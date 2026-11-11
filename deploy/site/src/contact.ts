// 変更履歴: 2026-11-11 コピー式の問い合わせをResend経由の直接送信へ変更。本文の保存・ログ出力は行わない。
export interface ContactEnv {
  RESEND_API_KEY?: string;
  CONTACT_RATE_LIMITER?: {limit(options:{key:string}):Promise<{success:boolean}>};
}
/** 公開フォームの応答はキャッシュせず、外部サービスの内部情報を利用者へ返さない。 */
function contactResponse(status:number, message:string):Response {
  return Response.json({message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
/** 上限付きでJSONを読み取り、Content-Lengthがないリクエストでも大量の本文を受け付けない。 */
async function readContactBody(request:Request):Promise<unknown> {
  const reader=request.body?.getReader();
  if(!reader) throw new Error('empty');
  const chunks:Uint8Array[]=[];
  let totalLength=0;
  while(true){
    const chunk=await reader.read();
    if(chunk.done) break;
    totalLength+=chunk.value.byteLength;
    if(totalLength>16384){await reader.cancel();throw new Error('large');}
    chunks.push(chunk.value);
  }
  const bytes=new Uint8Array(totalLength);
  let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
/** 固定の自社宛先だけへ転送する。顧客入力は返信先とプレーンテキスト本文に限定する。 */
export async function handleContact(request:Request,env:ContactEnv):Promise<Response> {
  const url=new URL(request.url);
  const allowedHosts=['site-veil.com','www.site-veil.com','web-no-tonari.amaretto.workers.dev'];
  const origin=request.headers.get('Origin')||'';
  const allowedOrigins=['https://site-veil.com','https://www.site-veil.com','https://web-no-tonari.amaretto.workers.dev','https://lifecastingtimecapsule.github.io'];
  if(!allowedHosts.includes(url.hostname)||!allowedOrigins.includes(origin)) return contactResponse(403,'サイトを開き直してお試しください。');
  const respond=(status:number,message:string):Response=>{
    const response=contactResponse(status,message);
    response.headers.set('Access-Control-Allow-Origin',origin);
    response.headers.set('Vary','Origin');
    return response;
  };
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store'}});
  if(request.method!=='POST') return respond(405,'送信方法を確認してください。');
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return respond(415,'送信形式を確認してください。');
  if(!env.RESEND_API_KEY||!env.CONTACT_RATE_LIMITER) return respond(503,'ただいま送信の準備中です。info@site-veil.comへお送りください。');
  try {
    const allowed=await env.CONTACT_RATE_LIMITER.limit({key:`contact:${request.headers.get('CF-Connecting-IP')||'unknown'}`});
    if(!allowed.success) return respond(429,'少し時間をおいてからお試しください。');
    let submitted:unknown;
    try { submitted=await readContactBody(request); } catch(error) { return respond(error instanceof Error && error.message==='large'?413:400,'入力内容を確認してください。'); }
    if(!submitted||typeof submitted!=='object'||Array.isArray(submitted)) return respond(400,'入力内容を確認してください。');
    const fields=submitted as Record<string,unknown>;
    const contactName=typeof fields.name==='string'?fields.name.trim():'';
    const contactEmail=typeof fields.email==='string'?fields.email.trim():'';
    const companyName=typeof fields.company==='string'?fields.company.trim():'';
    const message=typeof fields.message==='string'?fields.message.trim():'';
    const requestId=typeof fields.requestId==='string'?fields.requestId:'';
    if(fields.website||!contactName||contactName.length>100||/[\r\n\0]/.test(contactName)||companyName.length>200||/[\r\n\0]/.test(companyName)||contactEmail.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(contactEmail)||/[\r\n\0<>]/.test(contactEmail)||!message||message.length>5000||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return respond(400,'入力内容を確認してください。');
    const delivery=await fetch('https://api.resend.com/emails',{
      method:'POST',signal:AbortSignal.timeout(15000),
      headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`siteveil-contact/${requestId}`},
      body:JSON.stringify({from:'SITEVEIL <contact@site-veil.com>',to:['info@site-veil.com'],reply_to:contactEmail,subject:'SITEVEIL お問い合わせ',text:`お名前：${contactName}\n会社名：${companyName||'未記入'}\nメール：${contactEmail}\n\n${message}`}),
    });
    if(!delivery.ok) return respond(502,'送信できませんでした。入力内容は残っています。時間をおいて再度お試しください。');
    const receipt=await delivery.json() as {id?:string};
    if(!receipt.id) return respond(502,'送信を確認できませんでした。時間をおいて再度お試しください。');
    return respond(202,'送信しました。お問い合わせありがとうございます。');
  }catch{
    return respond(502,'送信できませんでした。入力内容は残っています。時間をおいて再度お試しください。');
  }
}
