# EC・保守セキュリティの学習コラム

変更履歴追記（2026-11-09）：この記録のEC商品体験・4箇所メールは後続指示で変更済み。現行仕様と検証は `2026-11-09-service-operations.md` を参照。以下は初回実装時点の記録。

## 決定と範囲

2026-11-09。ユーザー指定により、ウェブ制作の余白問題程度の難易度をECと保守セキュリティへ広げる。専門知識の暗記や賛否が分かれる設計問題ではなく、日常で使える判断と具体的な行動に絞る。

- EC：商品選択の既存体験を残し、支払合計・寸法の意味・発送と到着の違いを3問で説明。販売条件はすべて架空。
- セキュリティ：リンク偽装、HTTPSの意味、偽認証の誘導を3問にする。メールの4箇所を開くと理由が読める。
- 補足：QR、認証コード、送金先変更、添付・共有資料。システム面は更新・権限・公開範囲・復旧を扱う。
- 字形・不自然な日本語は確認のきっかけであり、国籍や安全性の判定材料にはしない。自然な文章の偽メールも前提とする。
- 偽URLは `.test` / `.example` の文字表示だけ。リンク、実行コード、添付、認証欄、コピー操作、回答送信・保存は設けない。

## デザインと操作

frontend-designで既存記事の意匠を継承。白黒赤、共通書体、比較幅1000px・文章720px。スマホでは縦積み。選択すると解説を開き、回答なし・JavaScriptなしでもdetailsから読める。追加の手口は折りたたみ、長い記事に目次を設ける。旧豆知識と古いメール操作は重複のため外す。

## 根拠（2026-11-09確認）

本文は資料を基にした独自の説明・架空例であり、各機関の公式教材や診断ではない。

- [警察庁：フィッシング対策](https://www.npa.go.jp/bureau/cyber/countermeasures/phishing.html)：メール/SMS/検索広告、なりすまし、急がせる案内、別経路での確認、被害時の対処。
- [Chromium：通信の表示](https://blog.chromium.org/2023/05/an-update-on-lock-icon.html)：HTTPSと運営者の信頼性の区別。
- [大阪府警：ClickFix](https://www.police.pref.osaka.lg.jp/seikatsu/saiba/cyber_shiryou/cybersecurity_tsushin/8/24567.html)：2026年の偽認証・更新・修正を装う実行誘導。操作コマンドは掲載しない。
- [IPA：メールを悪用した攻撃](https://www.ipa.go.jp/security/support/abuse_email.html)：2026-08-03公開。心理・信頼を利用した手口と組織での対策。
- [IPA：中小企業向けガイドライン](https://www.ipa.go.jp/security/guide/sme/about.html)：第4.0版、2026-09-30更新を確認。管理・日常運用・バックアップ・事故対応の基礎。
- [IPA：情報セキュリティ白書2025](https://www.ipa.go.jp/publish/wp-security/j5u9nn0000004wk0-att/ISWP2025_ALL.pdf)：QRコードの誘導。
- [フィッシング対策協議会：2025年度ガイド](https://www.antiphishing.jp/report/antiphishing_guideline_2025.pdf)：認証情報の盗用と対策。
- [IPA：偽警告](https://www.ipa.go.jp/security/anshin/measures/fakealert.html)、[消費者庁：偽サイト](https://www.caa.go.jp/policies/policy/consumer_policy/caution/caution_033)：警告に記載された窓口に従わないこと、購入時の確認事項。

## 実装後の確認

- `npm run build`：30ファイルの診断はエラー・警告0、9ページ生成。
- 1440 / 768 / 375 / 320px：EC・セキュリティとも横はみ出しなし。PCと375pxのスクリーンショットを目視。
- 全6問：選択表示と解説の開閉。キーボードEnterでも動作。
- 架空メール4箇所：開閉でき、予約ドメインへのリンク・通信・入力欄は0。
- JavaScript無効：両ページとも標準detailsで解説を開ける。
- 320pxで行間・字間・単語間隔を増やしても横はみ出しなし。
- ECカート合計3000円とリセット、AIの整理サンプル、ウェブ制作の3問を回帰確認。ブラウザ実行エラー0。
- Impeccable detector：指摘0。最新Web Interface Guidelinesで見出し階層、標準操作、読み上げ通知、折り返し、固定ヘッダーの余白を確認。
- 網羅的なWCAG認証・セキュリティ診断を行ったものではない。記事は情報提供であり、受付メール未設定は既存どおり明示。

## 変更履歴

- 2026-11-09：依頼されたコラムの内容・安全な教材の境界・引用元を初版記録。
