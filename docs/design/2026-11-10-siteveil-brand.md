# SITEVEIL ブランド変更

変更履歴：2026-11-10、ユーザーがサービス名SITEVEILを承認し、ドメイン調査とlogomaker.vnを参考にしたロゴ制作、GitHub/Xで紹介されるスキルの導入・適用を指示。

## 決定
Web制作・運用保守・セキュリティ検査の全体ブランドをSITEVEIL（サイトヴェイル）とする。運営法人は株式会社ライフキャスティングジャパンのまま。ARTEX/Strixは内部で使う別々の検査として維持する。

ロゴはVEIL CUT。文字そのものに図形の意味を持たせる参考サイトの考え方を取り入れ、Vの片側に切れ目を入れた独自のアウトライン文字を制作。既存作品をトレースしない。盾・鍵・グラデーション・回路の定型表現を避け、墨 #16191D と白を使う。既存の白・墨・赤のサイト配色と日本語書体は維持する。

3方向（切れ目のV、枠とV、層のS）を比較し、ユーザーの確認不要指示に沿って切れ目のVを採用。単色・反転・16/32/64pxを確認し、字形・記号・横組・縦組・アイコンを用意。文字は専用パスで、フォントファイルは含めない。

## 使用したスキルと参考
- https://github.com/kaankiziltug/logo-design-skill （MIT）。GitHub API確認時6468スター。revision bbf31e521d765eb6d53242549bbee7c2e5bbd6bc。siteveil-logo-designとして導入し、SKILL.mdが同リビジョンと一致することをSHA256で確認。
- X検索では該当スキルの人気を裏付ける投稿を確認できなかった。「Xで人気」とは表示しない。
- https://logomaker.vn/ の文字と図形を一体にする構成、白黒で成立させる考え方を参考にした。個別ロゴを複製しない。

## 適用先
src/components/Brand.astro（ヘッダー/フッターで黒/白ロゴ）、public/brandとfavicon、各ページのサービス名・タイトル・会社紹介・フッターをSITEVEILへ変更。独自ドメインはまだ取得していないため、現在のURL・リポジトリ名・配信設定・CSPの接続先は変更しない。

/security/を新設し、サイト・メール・システムの3つの入口を案内。/services/security/、/check/、フッターから回遊できる。受付メール未設定・コピーのみの表示を維持し、送信完了を装わない。料金や調査対象件数は今回変更しない。

ローカル調査ツールも表示と新規PDFのブランドを変更するが、既存の確定本文・受諾済み同意・顧客DBは書き換えない。

## ドメイン
JPRS WHOISでsiteveil.jpとsiteveil.co.jpにNo match、Verisign RDAPでsiteveil.netに404、siteveil.comに200（登録あり）、Identity Digital RDAPでsiteveil.studioに404を確認。第一候補はsiteveil.jp。WHOIS/RDAPの未登録は販売店での購入可否・価格の確約ではない。CO.JPは国内法人と原則1組織1ドメインの条件がある。購入・メール作成・DNS変更は行わない。

## 変更ファイルの役割
- src/components/Brand.astro、public/favicon.svg、public/brand/*：独自の共通ロゴ。
- src/layouts/SiteLayout.astro、src/pages/*.astro、src/pages/services/**/*.astro、SiteFooter.astro：表示名、案内ページ、回遊と会社名の整合。
- docs/design/2026-11-10-security-service-entry.md：名称が確定したため案内方針を実装へ進める記録。
- ローカルapp/templates、app/static、app/main.py：運用者用の表示名・アイコン・これから生成する報告書の発行ブランド。
