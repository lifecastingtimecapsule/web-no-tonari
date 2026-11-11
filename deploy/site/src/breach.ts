// 変更履歴: 2026-11-11 HIBP・XposedOrNotの公開漏えいメタ情報を同時照会。入力・結果の保存やログ出力は行わない。
import {cleanLabel,mergeBreaches,normalizeBreachDate,translateFields,type BreachRecord,type Provider} from './breach-model';
export interface BreachEnv {
  HIBP_API_KEY?:string;
  BREACH_RATE_LIMITER?:{limit(options:{key:string}):Promise<{success:boolean}>};
  BREACH_BUDGET?:{idFromName(name:string):unknown;get(id:unknown):{fetch(request:Request):Promise<Response>}};
}
interface ProviderResult {source:Provider;status:'ok'|'error'|'limited'|'unconfigured';records:BreachRecord[];}
const sourceLabels={hibp:'Have I Been Pwned',xposedornot:'XposedOrNot'};
/** 本文サイズをストリームで制限し、パスワードや未使用の上流データをログへ残さず破棄する。 */
async function boundedJson(response:Response|Request,maxBytes:number):Promise<unknown>{
  const reader=response.body?.getReader();if(!reader)throw new Error('empty');
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.byteLength;if(length>maxBytes){await reader.cancel();throw new Error('too-large');}chunks.push(chunk.value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
/** サーバー全体の件数枠だけを予約。メールやIPはDurable Objectへ渡さない。 */
async function reserveProvider(env:BreachEnv,provider:string):Promise<boolean>{
  if(!env.BREACH_BUDGET)throw new Error('quota-unavailable');
  const budget=env.BREACH_BUDGET.get(env.BREACH_BUDGET.idFromName('public-breach-budget-v1'));
  const response=await budget.fetch(new Request(`https://budget.internal/${provider}`,{method:'POST'}));
  if(response.status===429)return false;
  if(!response.ok)throw new Error('quota-unavailable');
  return true;
}
/** 固定の公式ホストだけへ送信し、リダイレクトには認証情報や照会対象を引き継がない。 */
async function providerFetch(url:string,headers:Record<string,string>={}):Promise<Response>{
  return fetch(url,{headers:{'User-Agent':'SITEVEIL breach check (https://site-veil.com)',Accept:'application/json',...headers},redirect:'manual',signal:AbortSignal.timeout(12000),cache:'no-store'});
}
/** 有料キーはサーバー内だけで使用。404と429・接続失敗を区別する。 */
async function lookupHibp(email:string,env:BreachEnv):Promise<ProviderResult>{
  const source:Provider='hibp';
  if(!env.HIBP_API_KEY)return {source,status:'unconfigured',records:[]};
  try{
    if(!await reserveProvider(env,source))return {source,status:'limited',records:[]};
    const response=await providerFetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,{'hibp-api-key':env.HIBP_API_KEY});
    if(response.status===404)return {source,status:'ok',records:[]};
    if(response.status===429)return {source,status:'limited',records:[]};
    if(!response.ok)throw new Error('upstream');
    const payload=await boundedJson(response,2000000);
    if(!Array.isArray(payload)||payload.length>500)throw new Error('schema');
    const records=payload.filter(entry=>entry&&typeof entry==='object'&&entry.IsSensitive!==true&&entry.IsRetired!==true).map((entry:Record<string,unknown>):BreachRecord=>{
      const id=cleanLabel(entry.Name);if(!id||!Array.isArray(entry.DataClasses))throw new Error('schema');
      return {id,service:cleanLabel(entry.Title)||id,date:normalizeBreachDate(entry.BreachDate),fields:translateFields(entry.DataClasses),source,unverified:entry.IsVerified===false||entry.IsFabricated===true};
    });
    return {source,status:'ok',records};
  }catch{return {source,status:'error',records:[]};}
}
/** 個人の照会結果と分け、公開されている日付・項目カタログだけを24時間キャッシュする。 */
async function xonCatalogue(env:BreachEnv):Promise<Map<string,Record<string,unknown>>>{
  const catalogueKey=new Request('https://site-veil.com/__public-metadata/xon-breaches-v1');
  const publicCache=typeof caches!=='undefined' ? (caches as CacheStorage & {default:Cache}).default : undefined;
  try{
    let payload:unknown;
    const cached=await publicCache?.match(catalogueKey);
    if(cached)payload=await boundedJson(cached,4000000);
    else{
      if(!await reserveProvider(env,'xon-catalogue'))return new Map();
      const response=await providerFetch('https://api.xposedornot.com/v1/breaches');
      if(!response.ok)return new Map();
      const raw=await boundedJson(response,4000000) as Record<string,unknown>;
      if(!raw||!Array.isArray(raw.exposedBreaches))return new Map();
      // 保存は公開メタ情報だけ。説明文・レコード値・ロゴ・照会したアドレスは含めない。
      payload=raw.exposedBreaches.filter(entry=>entry&&typeof entry==='object').map(entry=>({breachID:entry.breachID,breachedDate:entry.breachedDate,exposedData:entry.exposedData,sensitive:entry.sensitive,searchable:entry.searchable}));
      await publicCache?.put(catalogueKey,Response.json(payload,{headers:{'Cache-Control':'public, max-age=86400'}}));
    }
    if(!Array.isArray(payload))return new Map();
    return new Map(payload.map(entry=>[cleanLabel(entry.breachID),entry]));
  }catch{return new Map();}
}
/** キー不要の公式APIを照会し、名前のみの結果には公開カタログから日付・項目を補足する。 */
async function lookupXon(email:string,env:BreachEnv):Promise<ProviderResult>{
  const source:Provider='xposedornot';
  try{
    if(!await reserveProvider(env,source))return {source,status:'limited',records:[]};
    const response=await providerFetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}?details=true`);
    if(response.status===429)return {source,status:'limited',records:[]};
    const payload=await boundedJson(response,2000000) as Record<string,unknown>;
    if(payload&&[200,404].includes(response.status)&&payload.Error==='Not found')return {source,status:'ok',records:[]};
    if(!response.ok||!payload||payload.status!=='success'||!Array.isArray(payload.breaches))throw new Error('schema');
    const names=payload.breaches.flat();
    if(names.length>500||names.some(name=>typeof name!=='string'||!cleanLabel(name)))throw new Error('schema');
    const details=Array.isArray(payload.breach_details)?payload.breach_details:[];
    const catalogue=names.length?await xonCatalogue(env):new Map<string,Record<string,unknown>>();
    const records=[...new Set(names as string[])].flatMap((name):BreachRecord[]=>{
      const id=cleanLabel(name);const metadata=catalogue.get(id);
      if(metadata?.sensitive===true||metadata?.searchable===false)return [];
      const detail=details.find(entry=>entry&&typeof entry==='object'&&entry.name===name);
      return [{id,service:id,date:normalizeBreachDate(metadata?.breachedDate)||normalizeBreachDate(detail?.breach_date),fields:translateFields(metadata?.exposedData||detail?.exposed_data),source}];
    });
    return {source,status:'ok',records};
  }catch{return {source,status:'error',records:[]};}
}
/** 同意した単一アドレスをPOSTで受け、照会失敗を「漏えいなし」として返さない。 */
export async function handleBreach(request:Request,env:BreachEnv):Promise<Response>{
  const respond=(status:number,payload:Record<string,unknown>)=>Response.json(payload,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  if(request.method!=='POST')return respond(405,{message:'POSTで照会してください。'});
  const origin=new URL(request.url).origin;
  if(request.headers.get('Origin')!==origin||!['https://site-veil.com','https://www.site-veil.com','http://127.0.0.1:8787','http://localhost:8787','http://127.0.0.1:8791','http://localhost:8791'].includes(origin))return respond(403,{message:'SITEVEILの画面から照会してください。'});
  if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return respond(415,{message:'入力形式を確認してください。'});
  if(!env.BREACH_RATE_LIMITER||!env.BREACH_BUDGET)return respond(503,{message:'照会を利用できません。時間をおいてお試しください。'});
  try{
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    if(!(await env.BREACH_RATE_LIMITER.limit({key:ip})).success)return respond(429,{message:'続けて照会されています。1分ほどおいてお試しください。'});
    let fields:Record<string,unknown>;
    try{const submitted=await boundedJson(request,1024);if(!submitted||typeof submitted!=='object'||Array.isArray(submitted))throw new Error('schema');fields=submitted as Record<string,unknown>;}catch{return respond(400,{message:'メールアドレスと確認欄を見直してください。'});}
    const email=typeof fields.email==='string'?fields.email.trim().toLowerCase():'';
    if(fields.website||fields.consent!==true||email.length>254||!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)||email.split('@')[0].startsWith('.')||email.includes('..'))return respond(400,{message:'メールアドレスと確認欄を見直してください。'});
    const results=await Promise.all([lookupHibp(email,env),lookupXon(email,env)]);
    const successful=results.filter(result=>result.status==='ok');
    const providers=results.map(result=>({source:result.source,name:sourceLabels[result.source],status:result.status,count:result.status==='ok'?result.records.length:null}));
    if(!successful.length)return respond(results.every(result=>result.status==='limited')?429:503,{message:'現在、照会元に接続できないか利用枠が混み合っています。漏えいの有無は判定できません。時間をおいて再度お試しください。',providers});
    return respond(200,{state:successful.length===results.length?'complete':'partial',checkedAt:new Date().toISOString(),providers,breaches:mergeBreaches(successful.flatMap(result=>result.records))});
  }catch{return respond(503,{message:'照会できませんでした。漏えいの有無は判定できません。'});}
}
