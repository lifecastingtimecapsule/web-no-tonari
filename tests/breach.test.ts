// 変更履歴: 2026-11-11 公開メール照会の入力保護・失敗時の判定・メタ情報限定・重複統合を検証。実メールや外部APIは使わない。
import {afterEach,describe,expect,it,vi} from 'vitest';
import {handleBreach,type BreachEnv} from '../deploy/site/src/breach';
import {mergeBreaches,normalizeBreachDate,translateFields} from '../deploy/site/src/breach-model';
/** 単一の許可済みアドレスを模擬し、認証情報を含まないテスト用環境を作る。 */
function environment():BreachEnv {
 return {HIBP_API_KEY:'test-only',BREACH_RATE_LIMITER:{limit:vi.fn(async()=>({success:true}))},BREACH_BUDGET:{idFromName:name=>name,get:()=>({fetch:vi.fn(async()=>Response.json({allowed:true}))})}};
}
function request(fields:unknown={email:'test@example.com',consent:true},origin='https://site-veil.com') {
 return new Request('https://site-veil.com/api/breach-check',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.2'},body:JSON.stringify(fields)});
}
/** 公式ホスト以外の通信や、メタ情報以外の応答への依存を検出する。 */
function providerTransport(hibpStatus=200,xonStatus=200){
 return vi.fn(async(url:string,_options?:RequestInit)=>{
  if(url.includes('haveibeenpwned.com'))return hibpStatus===200?Response.json([{Name:'MovieBoxPro',Title:'MovieBoxPro',BreachDate:'2024-04-15',DataClasses:['Email addresses','Passwords'],Description:'Do not retain FULL_SECRET_VALUE',password:'FULL_SECRET_VALUE'}]):new Response(null,{status:hibpStatus});
  if(url.endsWith('/breaches'))return Response.json({exposedBreaches:[{breachID:'MovieBoxPro',breachedDate:'2024-04-01T00:00:00Z',exposedData:['Email addresses','Usernames'],sensitive:false,searchable:true}]});
  if(url.includes('api.xposedornot.com'))return xonStatus===200?Response.json({status:'success',email:'test@example.com',breaches:[['MovieBoxPro']],breach_details:[{name:'MovieBoxPro',description:'FULL_SECRET_VALUE'}]}):Response.json({Error:xonStatus===404?'Not found':'Unavailable'},{status:xonStatus});
  throw new Error('Unexpected host');
 });
}
afterEach(()=>vi.unstubAllGlobals());
describe('public breach check',()=>{
 it('両照会元の同一月の記録を統合し、日付差と日本語の情報種類を保持する',async()=>{
  const transport=providerTransport();vi.stubGlobal('fetch',transport);
  const response=await handleBreach(request(),environment());const payload=await response.json();
  expect(response.status).toBe(200);expect(payload.state).toBe('complete');expect(payload.breaches).toHaveLength(1);
  expect(payload.breaches[0].dateConflict).toBe(true);expect(payload.breaches[0].dates).toEqual(expect.arrayContaining([{source:'hibp',date:'2024-04-15'},{source:'xposedornot',date:'2024-04-01'}]));
  expect(payload.breaches[0].fields).toEqual(expect.arrayContaining(['メールアドレス','パスワード','ユーザー名']));
  const serialized=JSON.stringify(payload);expect(serialized).not.toContain('FULL_SECRET_VALUE');expect(serialized).not.toContain('test@example.com');expect(serialized).not.toContain('test-only');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  for(const [url,options] of transport.mock.calls as unknown as [string,RequestInit][]){if(!url.includes('haveibeenpwned.com'))expect(new Headers(options.headers).has('hibp-api-key')).toBe(false);expect(options.redirect).toBe('manual');}
 });
 it('一方が失敗したら未完了とし、失敗した照会元の件数を0にしない',async()=>{
  vi.stubGlobal('fetch',providerTransport(500));const payload=await (await handleBreach(request(),environment())).json();
  expect(payload.state).toBe('partial');expect(payload.providers[0]).toMatchObject({status:'error',count:null});expect(payload.breaches).toHaveLength(1);
 });
 it('両方失敗したときに漏えいなしや完了を返さない',async()=>{
  vi.stubGlobal('fetch',providerTransport(500,500));const response=await handleBreach(request(),environment());const payload=await response.json();
  expect(response.status).toBe(503);expect(payload.state).toBeUndefined();expect(payload.breaches).toBeUndefined();
 });
 it('正しい404応答だけを該当なしとして扱う',async()=>{
  vi.stubGlobal('fetch',providerTransport(404,404));const payload=await (await handleBreach(request(),environment())).json();expect(payload.state).toBe('complete');expect(payload.breaches).toEqual([]);
 });
 it('カタログが失敗しても記録名を保持し、日付と項目は不明にする',async()=>{
  const transport=providerTransport(500);vi.stubGlobal('fetch',async(url:string,options:RequestInit)=>url.endsWith('/breaches')?new Response(null,{status:500}):transport(url,options));
  const payload=await (await handleBreach(request(),environment())).json();expect(payload.breaches[0]).toMatchObject({service:'MovieBoxPro',fields:[],dates:[{source:'xposedornot',date:null}]});
 });
 it('上流の不正JSONを該当なしにしない',async()=>{
  vi.stubGlobal('fetch',async()=>Response.json({unexpected:[]}));const response=await handleBreach(request(),environment());expect(response.status).toBe(503);
 });
 it.each([{email:'a@example.com\r\nSecret: x',consent:true},{email:'a@example.com',consent:false},{email:'a@example.com',consent:true,website:'bot'},{email:'a'.repeat(1100),consent:true},[]])('不正入力・未同意・大きな本文で外部照会しない %j',async(fields)=>{
  const transport=vi.fn();vi.stubGlobal('fetch',transport);expect((await handleBreach(request(fields),environment())).status).toBe(400);expect(transport).not.toHaveBeenCalled();
 });
 it('外部Origin・GET・利用制限を拒否する',async()=>{
  const transport=vi.fn();vi.stubGlobal('fetch',transport);
  expect((await handleBreach(request(undefined,'https://evil.example'),environment())).status).toBe(403);
  expect((await handleBreach(new Request('https://site-veil.com/api/breach-check'),environment())).status).toBe(405);
  const limited=environment();limited.BREACH_RATE_LIMITER={limit:async()=>({success:false})};expect((await handleBreach(request(),limited)).status).toBe(429);
  expect((await handleBreach(request(),{})).status).toBe(503);expect(transport).not.toHaveBeenCalled();
 });
 it('共通利用枠を予約できない場合は上流へ送信しない',async()=>{
  const transport=vi.fn();vi.stubGlobal('fetch',transport);const env=environment();env.BREACH_BUDGET={idFromName:name=>name,get:()=>({fetch:async()=>new Response(null,{status:429})})};
  expect((await handleBreach(request(),env)).status).toBe(429);expect(transport).not.toHaveBeenCalled();
 });
});
describe('metadata normalization',()=>{
 it('同名でも別の時期の事案を統合しない',()=>{
  expect(mergeBreaches([{id:'Example',service:'Example',date:'2020-01-01',fields:[],source:'hibp'},{id:'Example',service:'Example',date:'2023-01-01',fields:[],source:'xposedornot'}])).toHaveLength(2);
 });
 it('年・月の精度を維持し、不正日付を補完しない',()=>{
  expect(normalizeBreachDate('2024')).toBe('2024');expect(normalizeBreachDate('2024-04')).toBe('2024-04');expect(normalizeBreachDate('2024-02-31')).toBeNull();expect(normalizeBreachDate('not a date')).toBeNull();
 });
 it('未知の情報種類を既知の情報に置き換えない',()=>{expect(translateFields(['New category'])).toEqual(['その他の情報（分類未対応）']);});
});
