// 変更履歴: 2026-11-11 正規ドメインの転送と既存のHTTPS保護を検証。
import { describe, expect, it, vi } from 'vitest';
import siteWorker from '../deploy/site/src/index';

describe('SITEVEIL public domain', () => {
  it('wwwをHTTPSの正規ドメインへ、パスとクエリを維持して転送する', async () => {
    const assets = {fetch: vi.fn()};
    const response = await siteWorker.fetch(new Request('http://www.site-veil.com/security/?service=mail'), {ASSETS: assets});
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://site-veil.com/security/?service=mail');
    expect(assets.fetch).not.toHaveBeenCalled();
  });
  it('正規ドメインは静的アセットへ渡し、HTTPではHTTPSへ転送する', async () => {
    const assets = {fetch: vi.fn(async () => new Response('SITEVEIL'))};
    expect((await siteWorker.fetch(new Request('https://site-veil.com/'), {ASSETS: assets})).status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledTimes(1);
    const response = await siteWorker.fetch(new Request('http://site-veil.com/'), {ASSETS: assets});
    expect(response.headers.get('Location')).toBe('https://site-veil.com/');
  });
});

// 変更履歴: 2026-11-14 直接URLから音声と受付案内を取得できないことを保証する。
it.each(['/services/phone-reception/', '/services/phone-reception/samples/', '/audio/reception/industry-1-1.mp3'])('keeps paused reception resources private: %s', async path => {
  const assets = {fetch: vi.fn().mockResolvedValue(new Response('should not be served'))};
  const response = await siteWorker.fetch(new Request('https://site-veil.com'+path), {ASSETS:assets});
  expect(response.status).toBe(404);
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  expect(assets.fetch).not.toHaveBeenCalled();
});
