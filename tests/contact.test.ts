// 変更履歴: 2026-11-11 直接送信の宛先固定・入力保護・重複防止・失敗時の挙動を検証。
import {afterEach,describe,expect,it,vi} from 'vitest';
import {handleContact} from '../deploy/site/src/contact';
const validFields={name:'テスト',email:'customer@example.com',company:'会社',message:'<b>相談</b>',requestId:'c454b1ab-e2bd-49ff-8b61-dbb1e346b98e'};
/** 外部メールは送らず、固定窓口へのリクエストだけを確認する。 */
function makeRequest(fields:unknown=validFields,origin='https://site-veil.com'){
  return new Request('https://site-veil.com/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(fields)});
}
const makeEnv=()=>({RESEND_API_KEY:'test-only',CONTACT_RATE_LIMITER:{limit:vi.fn(async()=>({success:true}))}});
afterEach(()=>vi.unstubAllGlobals());
describe('contact delivery',()=>{
  it('固定の自社窓口へ、本文をHTML化せず、同じIDで送る',async()=>{
    const transport=vi.fn(async()=>Response.json({id:'accepted'}));vi.stubGlobal('fetch',transport);
    expect((await handleContact(makeRequest({...validFields,to:'attacker@example.com'}),makeEnv())).status).toBe(202);
    const [target,options]=transport.mock.calls[0] as unknown as [string,RequestInit];
    const sent=JSON.parse(options.body as string);
    expect(target).toBe('https://api.resend.com/emails');expect(sent.to).toEqual(['info@site-veil.com']);expect(sent.reply_to).toBe(validFields.email);expect(sent.html).toBeUndefined();expect(sent.text).toContain('<b>相談</b>');expect(new Headers(options.headers).get('Idempotency-Key')).toContain(validFields.requestId);
  });
  it('外部サイトからの送信を拒否する',async()=>{
    const transport=vi.fn();vi.stubGlobal('fetch',transport);
    expect((await handleContact(makeRequest(validFields,'https://evil.example'),makeEnv())).status).toBe(403);expect(transport).not.toHaveBeenCalled();
  });
  it('認証情報不足なら成功を返さない',async()=>{
    expect((await handleContact(makeRequest(),{})).status).toBe(503);
  });
  it('連続送信を制限する',async()=>{
    const env=makeEnv();env.CONTACT_RATE_LIMITER.limit.mockResolvedValue({success:false});
    expect((await handleContact(makeRequest(),env)).status).toBe(429);
  });
  it.each([{email:'a@example.com\r\nBcc: x@evil.test'},{message:'x'.repeat(5001)},{website:'bot'},{requestId:'bad'},{name:''}])('不正入力を送信しない %j',async invalid=>{
    const transport=vi.fn();vi.stubGlobal('fetch',transport);
    expect((await handleContact(makeRequest({...validFields,...invalid}),makeEnv())).status).toBe(400);expect(transport).not.toHaveBeenCalled();
  });
  it('長さヘッダーがなくても大きい本文を拒否する',async()=>{
    expect((await handleContact(makeRequest({...validFields,message:'x'.repeat(20000)}),makeEnv())).status).toBe(413);
  });
  it('メールサービス側のエラー内容を公開しない',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json({error:'secret provider detail'},{status:401})));
    const response=await handleContact(makeRequest(),makeEnv());expect(response.status).toBe(502);expect(await response.text()).not.toContain('secret provider detail');
  });
  it('壊れたJSONを拒否する',async()=>{
    const request=new Request('https://site-veil.com/api/contact',{method:'POST',headers:{Origin:'https://site-veil.com','Content-Type':'application/json'},body:'{'});
    expect((await handleContact(request,makeEnv())).status).toBe(400);
  });
});
