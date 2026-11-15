// 変更履歴: 2026-11-15 公開チェック共通のTurnstileサーバー検証を追加。
// 役割: トークンの成功だけでなく、用途(action)と本番ホスト名も照合し、検証不能時は失敗閉じにする。
export interface TurnstileEnv {
  TURNSTILE_SECRET?:string;
  TURNSTILE_HOSTNAMES?:string;
}

type VerificationState='valid'|'invalid'|'unavailable';
interface VerificationOptions {request:Request;env:TurnstileEnv;token:unknown;expectedAction:string;}

/** Cloudflare Siteverifyを有限時間・小さな応答サイズで呼び、現在の操作に発行されたトークンだけを許可する。 */
export async function verifyTurnstile({request,env,token,expectedAction}:VerificationOptions):Promise<VerificationState>{
  const secret=env.TURNSTILE_SECRET?.trim();
  const hostnames=(env.TURNSTILE_HOSTNAMES??'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  if(!secret||!hostnames.length)return 'unavailable';
  if(typeof token!=='string'||token.length<1||token.length>2048)return 'invalid';
  const body=new URLSearchParams({secret,response:token});
  const remoteIp=request.headers.get('CF-Connecting-IP');
  if(remoteIp)body.set('remoteip',remoteIp);
  try{
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,redirect:'manual',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return 'unavailable';
    const text=await response.text();
    if(text.length>16384)return 'unavailable';
    const result=JSON.parse(text) as {success?:unknown;action?:unknown;hostname?:unknown};
    if(result.success!==true)return 'invalid';
    if(result.action!==expectedAction)return 'invalid';
    if(typeof result.hostname!=='string'||!hostnames.includes(result.hostname.toLowerCase()))return 'invalid';
    return 'valid';
  }catch{return 'unavailable';}
}
