# site-veil.com と問い合わせメール

変更履歴：2026-11-11、ユーザーが実際に取得したドメインをsite-veil.comへ変更し、info宛てを現在のライフキャスティングのメールへ転送するよう指示。

## 確認済みの外部設定
Cloudflareの取得完了画面でsite-veil.comの登録完了を確認。購入・支払いはユーザーが操作したもので、助手が重複購入したものではない。メール転送は同じライフキャスティングのCloudflareアカウントで設定。接続済みコネクタの別アカウントへ誤設定しないよう、実際のWebサイト・ドメインの所在を確認した。

info@site-veil.com → lifecasting.timecapsule@gmail.com のルールが「有効」、宛先が「検証済み」、Email Routingが有効であることを画面で確認。既定のキャッチオールは無効のまま。他の宛先のメールは転送しない。MX3件、SPF、DKIMの必要レコードはCloudflareの案内に従って有効化。MXとSPFはDNS照会でも確認。

これは受信転送で、独立したメールボックスやinfo差出人の送信設定ではない。実メールの到達テストはまだ実施していない。

## Web接続・変更ファイル
- deploy/site/wrangler.toml：apexとwwwを既存WorkerのCustom Domainへ接続。CloudflareでDNSとHTTPS証明書を管理。
- deploy/site/src/index.ts：wwwをHTTPSのapexへ転送。パス・クエリを維持。既存HTTP→HTTPS保護を維持。
- .github/workflows/deploy-cloudflare-site.yml：canonical/OGの正規URLをhttps://site-veil.comへ変更。
- workers/safety-check/wrangler.toml：新しい2オリジンを許可し、既存の許可元も維持。
- src/pages/index.astro、SiteFooter.astro、security.astro、pricing.astro：実際の問い合わせ先を掲載。未設定という古い表示を更新。
- src/scripts/site.ts：コピーした相談文をメールアプリの下書きへ渡すリンクを追加。フォーム自体で自動送信せず、送信完了を装わない。
- tests/site-domain.test.ts：www転送のパス・クエリと既存HTTPSを検証。

## 検証・境界
38テスト成功、Astro診断エラー・警告0、12ページビルド成功。メーラー用の下書き作成は宛先・件名・本文をURLエンコードし、利用者が自分のメーラーから送信する。お問い合わせの本文をサーバー側で保存したり、APIキーを追加したりしない。

メール内容の自動取り込みや顧客案件の自動作成は今回追加していない。運用者専用のローカル調査ツールを公開しない。保管期間・既存の同意範囲を変更しない。
