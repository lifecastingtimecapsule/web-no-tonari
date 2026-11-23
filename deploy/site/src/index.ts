// 変更履歴: 2026-11-15 制作・SEO・業務開発の旧URLを現行セキュリティ案内へ転送。
// 変更履歴: 2026-11-14 音声・電話受付の公開停止。旧URLも静的配信より先に404とし、再生とダウンロードを止める。
// 変更履歴: 2026-11-11 保存しない無料メール照会APIと、件数だけを管理するBudgetを追加。
// 変更履歴: 2026-11-08 workers.devでは「常にHTTPSを使用」が使えないため、http://の訪問をhttps://へ転送する入口を追加。
// 役割: http://のリクエストだけを301で転送し、それ以外は静的アセット（_headersのヘッダー付き）をそのまま返す。
// 変更履歴: 2026-11-11 同一サイトの問い合わせ送信を静的アセットより前に処理。
import {handleContact,type ContactEnv} from './contact';
import {handleBreach,type BreachEnv} from './breach';
export {BreachBudget} from './breach-budget';
interface Env extends ContactEnv,BreachEnv { ASSETS: { fetch(request: Request): Promise<Response> } }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // 2026-11-11: Preserve paths and queries while using the canonical apex.
    if (url.hostname === 'www.site-veil.com') {
      url.hostname = 'site-veil.com';
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.protocol === 'http:' && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    // 役割: 再開が明示されるまで旧案内・会話集・音声ファイルを公開しない。
    if (url.pathname.startsWith('/services/phone-reception') || url.pathname.startsWith('/audio/reception')) {
      return new Response('Not found', {status:404, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
    }
    // 役割: 終了した制作・SEO・業務開発の古いURLから、現行のサービス案内へ移す。
    if (/^\/services\/(websites|seo|ai-apps)(?:\/|$)/.test(url.pathname)) {
      return Response.redirect(new URL('/services/',url.origin).href,301);
    }
    if (url.pathname === '/api/breach-check') return handleBreach(request,env);
    // 変更履歴: 2026-11-23 無料診断を /security/ に統合したため、旧URLを統合ページの該当位置へ転送する。
    if (url.pathname === '/check' || url.pathname === '/check/') {
      return Response.redirect(new URL('/security/#site',url.origin).href,301);
    }
    if (url.pathname === '/email-check' || url.pathname === '/email-check/') {
      return Response.redirect(new URL('/security/#email',url.origin).href,301);
    }
    if (url.pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
