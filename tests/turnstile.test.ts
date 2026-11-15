// 変更履歴: 2026-11-15 Turnstileのトークン・action・hostnameを外部照会前に検証する回帰テストを追加。
import {afterEach,describe,expect,it,vi} from 'vitest';
import {verifyTurnstile} from '../workers/shared/turnstile';

const env={TURNSTILE_SECRET:'test-secret',TURNSTILE_HOSTNAMES:'site-veil.com,www.site-veil.com'};
const request=new Request('https://site-veil.com/api/check',{headers:{'CF-Connecting-IP':'192.0.2.2'}});

afterEach(()=>vi.unstubAllGlobals());

describe('Turnstile server verification',()=>{
  it.each(['', 'x'.repeat(2049)])('空または長すぎるトークンを外部送信せず拒否する',async token=>{
    const transport=vi.fn();vi.stubGlobal('fetch',transport);
    expect(await verifyTurnstile({request,env,token,expectedAction:'safety_check'})).toBe('invalid');
    expect(transport).not.toHaveBeenCalled();
  });

  it('siteverifyのactionとhostnameが一致した場合だけ許可する',async()=>{
    const transport=vi.fn(async()=>Response.json({success:true,action:'safety_check',hostname:'site-veil.com'}));
    vi.stubGlobal('fetch',transport);
    expect(await verifyTurnstile({request,env,token:'valid-token',expectedAction:'safety_check'})).toBe('valid');
    const [url,options]=transport.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(options.method).toBe('POST');
    expect(String(options.body)).toContain('response=valid-token');
    expect(String(options.body)).toContain('remoteip=192.0.2.2');
  });

  it.each([
    {success:false,action:'safety_check',hostname:'site-veil.com'},
    {success:true,action:'email_check',hostname:'site-veil.com'},
    {success:true,action:'safety_check',hostname:'localhost'},
  ])('失敗・別action・許可外hostnameを拒否する %#',async payload=>{
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json(payload)));
    expect(await verifyTurnstile({request,env,token:'invalid-token',expectedAction:'safety_check'})).toBe('invalid');
  });

  it('設定不足や検証先の異常は利用不可として失敗閉じにする',async()=>{
    expect(await verifyTurnstile({request,env:{},token:'token',expectedAction:'safety_check'})).toBe('unavailable');
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('bad gateway',{status:502})));
    expect(await verifyTurnstile({request,env,token:'token',expectedAction:'safety_check'})).toBe('unavailable');
  });
});
