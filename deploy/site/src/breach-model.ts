// 変更履歴: 2026-11-11 照会元のメタ情報だけを日本語へ正規化し、同時期の重複を統合する。
export type Provider = 'hibp'|'xposedornot';
export interface BreachRecord {id:string;service:string;date:string|null;fields:string[];source:Provider;unverified?:boolean;}
export interface BreachGroup {service:string;dates:{source:Provider;date:string|null}[];fields:string[];sources:Provider[];dateConflict:boolean;unverified?:boolean;}
const japaneseFields:Record<string,string> = {
  "Email addresses": "メールアドレス",
  "Passwords": "パスワード",
  "Password hints": "パスワードのヒント",
  "Phone numbers": "電話番号",
  "IP addresses": "IPアドレス",
  "Names": "氏名",
  "Physical addresses": "住所",
  "Dates of birth": "生年月日",
  "Usernames": "ユーザー名",
  "Genders": "性別",
  "Credit cards": "クレジットカード情報",
  "Bank account numbers": "銀行口座番号",
  "Social media profiles": "SNSプロフィール",
  "Website activity": "サイトの利用履歴",
  "Purchases": "購入履歴",
  "Job titles": "役職・職種",
  "Employers": "勤務先",
  "Geographic locations": "位置情報",
  "Device information": "端末情報",
  "Browser user agent details": "ブラウザ情報",
  "Partial credit card data": "クレジットカードの一部番号",
  "Security questions and answers": "秘密の質問と回答",
  "Chat logs": "チャット記録",
  "Email messages": "メール本文",
  "Password hashes": "パスワードのハッシュ値",
  "Account balances": "口座・アカウント残高"
};
/** HTMLや制御文字を画面に流さず、公開メタ情報のラベルだけを残す。 */
export function cleanLabel(value:unknown,limit=120):string {
  return typeof value==='string' ? value.replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,limit) : '';
}
/** 日付の精度を勝手に補わず、不正日付は不明として扱う。 */
export function normalizeBreachDate(value:unknown):string|null {
  if(typeof value!=='string')return null;
  const match=/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:T.*)?$/.exec(value);
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]||1),day=Number(match[3]||1);
  if(year<1970||year>new Date().getUTCFullYear()||month<1||month>12)return null;
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return match[3]?`${match[1]}-${match[2]}-${match[3]}`:match[2]?`${match[1]}-${match[2]}`:match[1];
}
/** 漏えいした情報の種類を翻訳する。値そのもの・説明HTML・平文パスワードは扱わない。 */
export function translateFields(value:unknown):string[] {
  if(!Array.isArray(value))return [];
  return [...new Set(value.slice(0,80).map(item=>cleanLabel(item)).filter(Boolean).map(label=>japaneseFields[label]||'その他の情報（分類未対応）'))];
}
/** 同名でも別時期は分け、同じ月の記録差は各出典の日付を保持して一つにまとめる。 */
export function mergeBreaches(records:BreachRecord[]):BreachGroup[] {
  const groups:{key:string;group:BreachGroup}[]=[];
  for(const record of records){
    const key=record.id.normalize('NFKC').toLowerCase().replace(/[^a-z0-9\p{L}]/gu,'');
    const candidates=groups.filter(entry=>entry.key===key);
    const found=candidates.find(entry=>entry.group.dates.some(previous=>!previous.date||!record.date||previous.date.slice(0,7)===record.date.slice(0,7)));
    if(found){
      const group=found.group;
      if(!group.dates.some(entry=>entry.source===record.source&&entry.date===record.date))group.dates.push({source:record.source,date:record.date});
      group.fields=[...new Set([...group.fields,...record.fields])];
      group.sources=[...new Set([...group.sources,record.source])];
      group.unverified=Boolean(group.unverified||record.unverified);
      group.dateConflict=new Set(group.dates.map(entry=>entry.date).filter(Boolean)).size>1;
    }else groups.push({key,group:{service:record.service,dates:[{source:record.source,date:record.date}],fields:record.fields,sources:[record.source],dateConflict:false,unverified:Boolean(record.unverified)}});
  }
  return groups.map(entry=>entry.group).sort((first,second)=>(second.dates.find(entry=>entry.date)?.date||'').localeCompare(first.dates.find(entry=>entry.date)?.date||''));
}
