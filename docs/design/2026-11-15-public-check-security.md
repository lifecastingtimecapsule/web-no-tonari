# 公開チェック機能の安全境界

変更履歴: 2026-11-15、無料URLチェックのSSRF・踏み台リスク、メール照会の濫用、個人情報の事前説明、DMARC・Turnstile・公開連絡先の見直しと実施結果を記録。

## 目的

SITEVEILは「安全を完全に保証する」のではなく、合意した範囲で確認できるリスクを早期に発見・可視化する。無料機能自体が第三者への攻撃や調査の手段にならないよう、取得先と結果を最小化する。

## 確定した実装

### かんたん安全チェック

- 入力は `http` / `https`の公開ドメインだけ。認証情報、IPリテラル、非標準ポート、社内向けの接尾辞を拒否する。
- 任意パスは捨て、必ずトップページへ正規化する。
- Cloudflareの公開DNSでA / AAAAを事前解決し、ループバック、プライベート、リンクローカル、特殊用途IPが1つでも含まれる場合は対象サイトへ接続しない。
- Workerの `global_fetch_strictly_public` を維持し、DNSリバインディングでも実接続時に非公開宛先を拒否する。
- HTTPSの転送は同一ホストのみ、最大2回。別ホストへの転送は追跡しない。
- 1通信8秒、HTML最大600KB。HTTPSとHTTPのトップページ以外は取得しない。
- Cloudflareの共有レートリミッターでIPごと1分6回に制限。制限設定がない場合は失敗閉じとし、キャッシュ命中でも先に回数を判定する。
- URLチェック専用action `safety_check` のTurnstileトークンをサーバーで検証する。成功、action、本番hostnameが一致するまでDNS・対象サイトへ接続しない。

### 無料メール漏えいチェック

- 同一IPに加え、正規化したメールアドレスのSHA-256ハッシュごとに回数を制限。制限キーにアドレス本文を保存しない。
- オンライン結果は記録の有無と `0` / `1` / `2` / `3件以上` の区分だけ。事案名、サービス名、発生日、情報種類、照会元別の件数はAPIに返さない。
- メールアドレスと照会結果はSITEVEILのストレージへ保存しない。上流URLにアドレスが含まれるため、Workerのトレースと一般ログは有効化しない。
- IPはCloudflareの回数制限に使う。生IPの長期ログを独自保存せず、IPによる濫用検知と不要な個人情報の保存回避を両立する。
- メール照会専用action `email_check` のTurnstileトークンをサーバーで検証する。各照会後にブラウザ側のトークンを破棄し、再利用しない。

### 公開説明と連絡先

- `/privacy/` に取得情報、利用目的、Have I Been Pwned / XposedOrNot / Cloudflare / Resend / 確認対象サイトへの送信、保存・削除と窓口を記載。
- メール照会画面で、外部送信先と非保存を入力前に示す。
- 公開フッター、構造化データ、利用規約、セキュリティページ、エラー応答から `info@` を外し、お問い合わせフォームへ集約。内部の受信宛先は変更しない。

## 公開設定の確認結果

- 2026-11-15、`_dmarc.site-veil.com` に `v=DMARC1; p=quarantine; pct=100; adkim=r; aspf=r` を追加し、公開DNSから同値を確認した。
- ルートのSPFはCloudflare Email Routingを許可。GoogleとResendのDKIM、Resendのリターンパス用SPFは公開DNSで確認。
- Turnstileウィジェット `SITEVEIL 公開チェック` を管理モードで作成し、`site-veil.com`、`www.site-veil.com`、開発用localhostを登録した。Secretは2つのWorkerの `TURNSTILE_SECRET` に保存し、リポジトリや文書には記録しない。
- サーバー側の許可hostnameは本番の `site-veil.com` と `www.site-veil.com` だけ。開発用localhostは本番APIの検証対象に含めない。

## 未実行・公開前の条件

- このブランチは未公開。公開後にTurnstileの通常通過と再利用拒否、危険宛先拒否、レート制限、メール照会の応答粒度、`/privacy/`、フッターを実機で再確認する。
- DMARCは隔離運用を開始した段階。正規送信の整合を継続確認してから、別作業として `p=reject` への強化を判断する。

## 回帰検証

- `tests/turnstile.test.ts`: トークン形式、成功、action、hostname、検証先異常の失敗閉じ。
- `tests/safety-check.test.ts`: 入力制限、Turnstile前の外部接続禁止、非公開IPへの接続回避、別ホスト転送の拒否、共有レート制限の失敗閉じ。
- `tests/breach.test.ts`: Turnstile前の照会禁止、詳細の非公開、IP・ハッシュ化アドレスの二重制限、照会失敗を「漏えいなし」としないこと。
- `tests/security-public-copy.test.ts`: プライバシーの必須説明、全ページ共通導線、公開 `info@` の除外。
