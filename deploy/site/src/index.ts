// 変更履歴: 2026-11-08 workers.devでは「常にHTTPSを使用」が使えないため、http://の訪問をhttps://へ転送する入口を追加。
// 役割: http://のリクエストだけを301で転送し、それ以外は静的アセット（_headersのヘッダー付き）をそのまま返す。
interface Env { ASSETS: { fetch(request: Request): Promise<Response> } }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === 'http:' && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
