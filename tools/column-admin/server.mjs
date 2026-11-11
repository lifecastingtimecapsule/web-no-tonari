// 変更履歴: 2026-11-11 ローカル限定の認証・CSRF・記事管理APIを追加。公開Workerには含めない。
import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,lstat} from 'node:fs/promises';
import {createStorage,writeJson} from './storage.mjs';
const derive=promisify(scrypt);
const securityHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",'Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
/** 比較長の違いも例外にせず、秘密値を一定時間で比較する。 */
function equalSecret(actual,expected){return typeof actual==='string'&&typeof expected==='string'&&Buffer.byteLength(actual)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(actual),Buffer.from(expected));}
/** 平文を保持せず、乱数saltを使ったscryptの結果だけを保存する。 */
async function passwordRecord(password,salt=randomBytes(32).toString('hex')){const derived=await derive(password,salt,64,{N:131072,r:8,p:1,maxmem:256*1024*1024});return {salt,hash:derived.toString('hex')};}
/** ローカル認証と記事管理。操作は直列化し、状態の同時更新を防ぐ。 */
export async function createAdmin({privateDirectory,publicFile,setupToken=randomBytes(32).toString('hex'),clock=Date.now}){
 const storage=await createStorage(privateDirectory,publicFile);let auth=null;
 try{if((await lstat(storage.authFile)).isSymbolicLink())throw new Error('認証保存先は通常ファイルが必要です。');auth=JSON.parse(await readFile(storage.authFile,'utf8'));if(!/^[a-f0-9]{64}$/.test(auth.salt)||!(/^[a-f0-9]{128}$/.test(auth.hash)))throw new Error('認証情報が破損しています。');}catch(error){if(error.code!=='ENOENT')throw error;}
 const sessions=new Map();let failures=[];let queue=Promise.resolve();
 /** 全応答へキャッシュ禁止・CSPを付ける。入力本文や秘密値はログへ出さない。 */
 function json(value,status=200,extra={}){return new Response(JSON.stringify(value),{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8',...extra}});}
 /** 新規ログイン時に既存セッションを失効させる。IDはメモリだけに保存する。 */
 function signedIn(){sessions.clear();const token=randomBytes(32).toString('hex');const csrf=randomBytes(32).toString('hex');sessions.set(token,{csrf,created:clock(),last:clock()});return json({ok:true},200,{'Set-Cookie':`siteveil_editor=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`});}
 /** Cookieと期限を検証し、失効した値を破棄する。 */
 function session(request){const token=/\bsiteveil_editor=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')??'')?.[1];const current=sessions.get(token);if(!current)return null;if(clock()-current.last>=1800000||clock()-current.created>=1800000){sessions.delete(token);return null;}current.last=clock();return current;}
 /** 64KBで打ち切り、巨大なリクエストをメモリへ溜めない。 */
 async function inputJson(request){
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw Object.assign(new Error('JSON形式で送信してください。'),{status:415});
  if(Number(request.headers.get('content-length'))>65536)throw Object.assign(new Error('入力が大きすぎます。'),{status:413});
  const reader=request.body?.getReader();if(!reader)throw new Error('入力がありません。');let bytes=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();throw Object.assign(new Error('入力が大きすぎます。'),{status:413});}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Error('入力形式を確認してください。');}
 }
 /** 固定Host・OriginとCSRFを認証より前後の両方で検査する。 */
 async function handleRequest(request,origin){
  const url=new URL(request.url);if(origin!=='http://'+request.headers.get('host')||!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)||url.origin!==origin)return json({error:'接続元を確認できません。'},403);
  if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return json({error:'他のサイトからの操作はできません。'},403);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'他のサイトからの操作はできません。'},403);
  if(request.method==='GET'&&['/','/admin.js','/admin.css','/content.js'].includes(url.pathname)){
   const name=url.pathname==='/'?'index.html':url.pathname.slice(1);const content=await readFile(new URL(name==='content.js'?'./content.mjs':'./ui/'+name,import.meta.url));return new Response(content,{headers:{...securityHeaders,'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8'}});
  }
  if(!url.pathname.startsWith('/api/'))return json({error:'見つかりません。'},404);
  if(!['GET','POST'].includes(request.method))return json({error:'許可されていない操作です。'},405);
  if(request.method==='POST'&&request.headers.get('origin')!==origin)return json({error:'接続元を確認できません。'},403);
  const current=session(request);
  if(url.pathname==='/api/state'&&request.method==='GET')return json({authenticated:!!current,setupRequired:!auth,...(current?{csrf:current.csrf,expiresAt:current.created+1800000}:{})});
  if(url.pathname==='/api/setup'&&auth)return json({error:'初回設定は完了しています。'},409);
  if(['/api/setup','/api/login'].includes(url.pathname)&&request.method==='POST'){
   failures=failures.filter(time=>clock()-time<900000);if(failures.length>=5)return json({error:'試行回数が多いため、15分ほど待ってからお試しください。'},429,{'Retry-After':'900'});
   const input=await inputJson(request);if(!input||typeof input!=='object')throw new Error('入力を確認してください。');
   if(typeof input.password!=='string'||input.password.length>128)return json({error:'パスワードを確認してください。'},400);
   if(url.pathname==='/api/setup'){
    if(!equalSecret(input.setupToken,setupToken)){failures.push(clock());return json({error:'起動時の初回設定URLから開いてください。'},403);}
    if(input.password.length<10)return json({error:'パスワードは10文字以上にしてください。'},400);
    auth=await passwordRecord(input.password);await writeJson(storage.authFile,auth,{exclusive:true});setupToken='';failures=[];return signedIn();
   }
   if(!auth)return json({error:'初回設定が必要です。'},409);
   const candidate=await passwordRecord(input.password,auth.salt);if(!equalSecret(candidate.hash,auth.hash)){failures.push(clock());return json({error:'パスワードが違います。'},401);}failures=[];return signedIn();
  }
  if(!current)return json({error:'ログインしてください。'},401);
  if(request.method==='POST'&&!equalSecret(request.headers.get('x-csrf-token'),current.csrf))return json({error:'画面を再読み込みして操作してください。'},403);
  if(url.pathname==='/api/articles'&&request.method==='GET')return json({articles:await storage.list()});
  if(request.method!=='POST')return json({error:'見つかりません。'},404);
  const input=await inputJson(request);
  if(url.pathname==='/api/logout'){sessions.clear();return json({ok:true},200,{'Set-Cookie':'siteveil_editor=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
  if(url.pathname==='/api/articles')return json({article:await storage.save(input.article,input.revision)});
  if(['/api/stage','/api/unstage'].includes(url.pathname)){await storage.stage(input.id,input.revision,url.pathname==='/api/unstage');return json({ok:true});}
  return json({error:'見つかりません。'},404);
 }
 return {setupRequired:!auth,setupUrlFragment:!auth?setupToken:'',
  /** 例外を秘密値のない日本語エラーに変え、操作を一つずつ処理する。 */
  handle(request,origin){const result=queue.then(()=>handleRequest(request,origin)).catch(error=>json({error:error.code?'保存できませんでした。保存先の権限・空き容量を確認してください。':error.message??'操作できませんでした。'},error.status??400));queue=result.then(()=>{});return result;}
 };
}
