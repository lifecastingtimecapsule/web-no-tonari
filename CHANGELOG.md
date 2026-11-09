# 変更履歴

## 2026-11-09：診断結果を書類で郵送する案内へ統一

- `pricing.ts`: ユーザーの訂正に合わせ、PDF1枚・メール納品を外し、診断結果をまとめた書類の郵送へ変更。ページ数の制限を設けず、ホームと料金詳細を同期。
- PRODUCT: 最新の納品方法を記録。料金16,500円・指定10件まで・確認1回と、受付準備中の表示は維持。

## 2026-11-09：漏えいチェックをPDF1枚で納品

- `pricing.ts`: 30分の口頭説明を外し、結果・情報源・確認範囲・優先対策をPDF1枚にまとめて後日メール納品する形へ変更。郵送希望と条件の事前案内を明記し、料金・件数は維持。
- PRODUCT: 納品方法の最新指示と、送料の扱いが未確定であることを記録。
- 検証: 型検査40ファイル・11ページの生成成功。ホームと料金詳細にPDF1枚の報告が反映され、1280/375/320pxで横はみ出しがないことを確認。

## 2026-11-09：漏えい履歴チェックの料金を追加

- `pricing.ts` / `PricingSummary.astro` / `pricing.astro`: 指定10アドレスまで・1回16,500円、報告書・対策案内・結果説明30分の独立メニューを追加。受付準備中、調査の限界と対象外を明示。ホームと料金詳細で同じデータを使用。
- `global.css`: 四料金をPC2列×2段・スマホ1列で表示。受付状況を濃い16px文字で表示。
- PRODUCT / DESIGN: 掲載承認された範囲、未開始の実務、表示方針を記録。既存料金や専門診断の参考価格は維持。
- 検証: 型検査40ファイル・11ページ生成、1280/768/375/320pxで横はみ出しなし。受付状況の濃い16px文字と、相談欄へのサービス名引き継ぎを確認。Impeccable実URL検出0件。

## 2026-11-09：問い合わせURL欄を分かりやすく

- `index.astro` / `global.css`: URL欄を常時表示し、既存ホームページがある場合だけ入力する案内と空欄可を明示。補足・未送信の注意を16pxの本文色へ変更して見落としを減らす。
- `site.ts`: 不要になった折りたたみ開閉を除去し、任意入力の検証と確認結果からの引き継ぎは維持。
- PRODUCT / DESIGN: 最新の表示方針と変更理由を記録。
- 検証: 40ファイルの型検査・11ページのビルド成功。1280/375/320pxで横はみ出しなし。任意URLの空欄・形式エラー・エラー解除・URL引き継ぎ、案内の16px・本文色を確認。実画面検査でImpeccable検出0件。

## 2026-11-09：AI画像の用意と専門診断の参考費用

- `pricing.ts` / `services.ts`: イメージ画像のAI生成・選定・調整を基本制作料金に含め、準備方法の曖昧さを解消。実物を示す写真とは区別。
- `pricing.astro`: 写真準備のFAQと、専門診断の他社公開価格例を折りたたみで追加。税込・対象・出典を併記し、基本確認55,000円や自社提供価格と混同させない。
- `services/[slug].astro`: セキュリティ詳細から専門診断の参考費用へリンクを追加。
- PRODUCT / 料金設計記録: 新方針と根拠、未確定の提供体制、価格を記録。自社の掲載金額は変更しない。

## 2026-11-09：サービスと料金を専用ページへ

- `SiteHeader.astro` / `SiteFooter.astro`: サービス・料金をページ遷移へ変更し、現在地と一覧への入口を追加。
- `services/index.astro` / `ServiceCarousel.astro` / `service-carousel.ts` / `site.ts`: 既存の三サービス・横送りを共通化し、一覧ページを追加。
- `pricing.astro` / `pricing.ts` / `PricingSummary.astro`: 金額を変えず基本範囲、対象外、六オプション、合計例、実費、FAQを追加。
- `index.astro` / `services/[slug].astro` / `services.ts`: ホームを概要と専用ページへの入口へ整理し、詳細ページの料金・一覧への回遊を追加。
- `catalog.css` / PRODUCT / DESIGN / 設計記録: 既存の見た目との統一、レスポンシブ、対象範囲と検証を記録。

## 2026-11-09：フィッシングの正解・不正解を色で区別

- `phishing-experience.css` / `PhishingExperience.astro` / `phishing-experience.ts`: 正解は緑とチェック、危険な操作は赤とバツ、ヒントは黄系と感嘆符。見出しにも判定を明示し、色だけに依存せず結果を分かりやすくする。
- DESIGNと体験仕様に判定色・文字・アイコンの方針を記録。

## 2026-11-09：配色の選択肢を目指す印象で説明

- `WebsiteDesignDemo.astro`: 茶系・青系・赤系のラベルと解説に温かさ、信頼感、活気を明示。「どんな印象を届けたいか」を決めてから配色する流れへ変更。
- `docs/design/2026-11-09-design-essay.md`: 追加指示と表現の意図を記録。心理効果の一律保証にはしない。

## 2026-11-09：ウェブ教材を三テーマへ統合し、ECページを削除

- `WebsiteDesignDemo.astro` / 新規 `DesignSitePreview.astro` / `website-demo.css` / `website-demo.ts`: 文字サイズと余白の比較、配色と差し色面積の切り替え、PC・タブレット・スマホ配置のプレビューへ再構成。重複感を減らし、実際の変化で理解できる内容にする。
- `services.ts` / `ServiceDemo.astro` / `[slug].astro` / `index.astro`: 三テーマの紹介へ同期。ECのデータを除き、ルート・トップ・フッター・サービスタブから入口を削除。
- `EcOperationsDemo.astro` / `ServiceLearning.astro` / `learning-columns.ts` / `ec.png` を削除。`service-operations.css` / `service-learning.css` のEC専用装飾を整理し、PHP共用部分を維持。
- `design-workspace.webp` / `websites.webp` / `PROVENANCE.md`: 教材の写真を追加し、トップ紹介画像と出典を更新。写真を実績として扱わない。
- PRODUCT / DESIGN / 教材仕様 / 参考資料・運営教材の設計記録: 承認範囲、EC削除、現行仕様、検証を記録。会社概要のEC事業表記は保持。

## 2026-11-09：ウェブ制作に配色の第四問を追加

- `WebsiteDesignDemo.astro` / `website-demo.css`: 色数・役割・面積・印象を考える比較を追加。同じ案内を色だけ変えて比べ、日常での使い方と弊社の確認項目を解説。目次と結びも同期。
- `services.ts` / `index.astro` / `websites.webp` / `PROVENANCE.md`: 4問に増えた内容と紹介文・画像を一致させる。
- `PRODUCT.md` / `DESIGN.md` / 設計記録: 配色の目的・一次資料・検証を記録。

## 2026-11-09：似た手口を、異なる判断材料の三問へ

- `phishing-scenarios.ts`: 催促・誤字・金額の分かりやすい手がかりを減らし、URLの構造、添付PDFのQR、アプリ連携の権限へ変更。名称だけ変えた同種の問題にならないようにする。
- `PhishingExperience.astro` / `phishing-experience.css`: 添付プレビューと認可画面を追加。場面に合わせた操作名・ヒント・解説を表示し、既存の次問導線を維持。
- `services.ts` / `security.png` / `PROVENANCE.md`: 入口の紹介と画像を現行の三問に同期。
- `PRODUCT.md` / `DESIGN.md` / 設計記録: 現行方針、一次資料、学習例の限界と動作検証を記録。

## 2026-11-09：解説の近くから次の問題へ

- `PhishingExperience.astro` / `phishing-experience.ts` / `phishing-experience.css`: 次問ボタンを上部から各解説の直下へ移動。回答後は判定・リンク操作を隠し、再挑戦で戻す。全解説に短い表示演出を付け、縮小モーションを尊重。「リンクを開く（体験）」を「リンクを開く」へ短縮。操作の行き来と重複を減らすため。
- `PRODUCT.md` / `DESIGN.md` / `docs/design/2026-11-09-phishing-experience.md`: 導線と表示条件の現行仕様を記録。

## 2026-11-09：前後の文章を接続し、体験を三問へ拡張

- `src/data/services.ts` / `src/pages/services/[slug].astro`: 日常の管理と不審な連絡への備えを先に説明。SMS・メール体験の後はサイトの管理状況確認へ戻り、料金・相談につなぐ。PHPリンクを相談欄へ移動。他サービスの文章・料金・範囲は維持。
- `src/data/phishing-scenarios.ts`: 不在SMS・請求メール・アカウント停止SMSの表示と解説を定義。第三問は普段のURLを提示して一文字違いを判断できるようにする。
- `src/components/PhishingExperience.astro` / `src/scripts/phishing-experience.ts` / `src/styles/phishing-experience.css`: 既存の体験操作を維持して三問を切替。個別ID・前後ボタン・問題番号・フォーカス移動・JavaScriptなしの解説を追加。初期HTMLでも一問だけ表示し、情報が一度に増えないようにする。PHPリンクの未使用装飾を除去。
- `PRODUCT.md` / `DESIGN.md` / `docs/design/2026-11-09-phishing-experience.md`: 三問と説明順の現行仕様、検証結果を記録。


## 2026-11-09：登録不要のフィッシング体験（現行）

ユーザーがGoogleの方向を選択したため、直前の採用保留を解除。情報量を減らし、SMS一通と回答後の短い解説へ置換。

- `PhishingExperience.astro` / `phishing-experience.ts` / `phishing-experience.css`: 番号・期限・URLの指摘、全体の判定、疑似リンクでの詐欺演出、やり直しを実装。登録・情報入力・外部送信は行わず、縮小モーションとキーボードに対応。
- `ServiceDemo.astro` / `services.ts` / `pages/services/[slug].astro`: 新体験へ導線と表示を切り替え。
- `ServiceLearning.astro` / `learning-columns.ts` / `service-learning.css` / `service-operations.css`: EC部分を維持し、旧セキュリティ長文3問・一覧・メール装飾を除去。旧 `SecurityMessageDemo.astro` を削除。
- `pages/services/security/php.astro` / `PhpMaintenanceColumn.astro`: 管理者向けPHP記事を別ページへ移し、見出し階層を調整。
- `PRODUCT.md` / `DESIGN.md` / `docs/design/2026-11-09-phishing-experience.md` / 同日の参考候補・運用教材の記録: 現行仕様と旧案の置換を記録。
- `security.png` / `PROVENANCE.md`: サービス一覧の画像を現行の一問体験へ更新。
- 検証：35ファイルのチェックと静的10ページ生成、4画面幅での全5操作、キーボード・縮小モーション・JavaScriptなし・偽ドメイン通信0を確認。


## 2026-11-09：追加改訂の採用保留

- ユーザーの「情報量が多すぎる」という指示により、下記の法人表現・セキュリティ追加案は未公開のローカル変更で止める。`docs/design/2026-11-09-security-reference-shortlist.md` に初心者向けの参考5件と検証範囲を記録。次の実装は候補選定後とする。


## 2026-11-09：法人の語り口と、具体的なセキュリティ教材

- `src/components/SecurityMessageDemo.astro` / `src/styles/service-operations.css`: iPhoneの番号表示・灰色のSMS吹き出し・入力欄の形を参考に再構成。日本郵便をかたる偽SMSと明記し、正規の確認先・電話番号は端末外へ分離。実在の送信番号や公式ロゴは使用しない。
- `src/data/learning-columns.ts` / `src/components/ServiceLearning.astro`: HTTPS・ClickFixの主問題を、URLの一文字違い・紛らわしいドメイン・認証コードの窃取へ置換。文字差分を解説で可視化し、重複する認証コードの補足を整理。
- `src/components/PhpMaintenanceColumn.astro`: 情報漏えい・改ざん・業務停止や踏み台化の可能性を先に説明。IPAの実例とPHP 5.6/8.0の終了日を補い、更新手順は折り畳みへ。終了済みという事実と侵害の診断を区別。
- `src/components/WebsiteDesignDemo.astro` / `EcOperationsDemo.astro` / `ServiceLearning.astro` / `src/data/services.ts` / `src/data/learning-columns.ts` / `src/scripts/website-demo.ts` / `src/pages/philosophy.astro`: 個人の語りを「弊社」または会社の設計方針へ変更。既存変数名・教材の操作は維持。
- `PRODUCT.md` / `DESIGN.md` / `docs/design/2026-11-09-service-operations.md`: 新しい内容・出典・名称と番号の扱いを記録。旧決定は更新履歴として残す。
- `public/images/services/security.png` / `ec.png` / `PROVENANCE.md`: 現行画面と会社としての表現に合わせて紹介画像を更新。


## 2026-11-09

- `EcOperationsDemo.astro` / `learning-columns.ts`: ECを運営者向けに修正。受注管理3場面、承認と売上確定、在庫引き当て、返品・返金・再入庫を説明。旧商品カート・色選択・専用CSSを削除。
- `SecurityMessageDemo.astro` / `PhpMaintenanceColumn.astro` / `service-operations.css`: SMSとPCメールを端末別UIに変更し、7箇所の理由と対策を表示。PHP公式のサポート表と更新手順を追加。偽URL・添付は文字のみで通信・実行しない。
- `ServiceLearning.astro` / `ServiceDemo.astro` / `services.ts` / サービスページ: 記事・入口・事業説明を新しい主題へ更新。ECとセキュリティのプレビュー画像・根拠記録・PRODUCT/DESIGNを現行仕様に統一。
- `ServiceLearning.astro` / `learning-columns.ts` / `service-learning.css`: ECの支払合計・サイズ・発送日の3問、セキュリティの偽メール・HTTPS・偽認証の3問を追加。日常向けの難易度と「私が考えること」の語りを継承し、社会的な誘導とシステム側の備え・被害時の対応を出典付きで説明。
- `ServiceDemo.astro` / `services.ts` / サービスページ: 新記事への入口とメタ説明を更新し、重複する旧豆知識を非表示。ECの商品選択・カートは維持。`service-demos.ts` / `services.css` の旧メールカウンターと装飾を削除。
- セキュリティのプレビューを新しいメール教材の画面に更新。PRODUCT / DESIGN / 設計記録 / 出典記録に範囲・根拠・検証を記録。
- `WebsiteDesignDemo.astro` / `website-demo.css`: 難易度を余白の問題程度に揃える指定を受け、日常のメール・案内文を題材とした余白・段落・項目整理の3問へ変更。A/Bの情報を揃え、理由・日常で使うコツ・作り手の注意点を解説。専門用語と賛否が分かれる設計判断は外し、未使用の図用CSSも削除。
- サービス説明・プレビュー・設計資料を今回の読者像に統一。料金・他サービス・問い合わせ機能・選択操作は維持。
- `WebsiteDesignDemo.astro` / `website-demo.css`: 初級向けに見えるという指摘を受け、情報の比較・スマホでの再構成・フォームの条件分岐を題材に、制約・代替案・実装・検証を説明する中級以上向けの記事へ更新。設問を裏付ける一次資料を追記し、使わなくなった比較用CSSは削除。
- 入口の紹介文・プレビュー画像・設計資料を現行記事に統一。クイズ操作、問い合わせフォーム自体、料金、他サービスの機能は維持。
- `WebsiteDesignDemo.astro` / `website-demo.css` / `website-demo.ts`: ユーザーの指定により花屋を撤去。文字の優先順位を体験する導入、3問の比較、作り手の一人称による判断理由、実制作の確認点へ変更。選択なし・JavaScriptなしでも解説が読める構成とし、採点ゲームは採用しない。
- `services.ts` / サービスページ / トップのプレビュー: 記事と入口の説明を揃えるため更新。`DESIGN.md` / `PRODUCT.md` / 設計記録に最新方針を記録。
- 作業前にorigin/mainの最新11e5898へfast-forwardし、安全チェック・Cloudflare配信・新フッターを保持した。
- `index.astro` / `global.css` / `site.ts`: 縦のサービス一覧を、ユーザーの既定指示であるPC3件・タブレット2件・スマホ1件の手動横送りへ復元。左右・キーボード・標準スクロール・縮小モーションに対応し、現在の料金短縮表記を維持。
- `WebsiteDesignDemo.astro` / `website-demo.css` / `website-demo.ts` / `ServiceDemo.astro`: 架空の花屋を写真と情報の優先順位が分かる見本へ変更。番号1〜4、近接解説、余白可視化、文字比較、基本8項目と出典を追加。実測を装わず、予約や送信はしない。
- `services.ts` / サービスページ: ウェブ制作のサンプル説明・更新日を変更。他の3体験は維持。
- `public/images/`: ライセンス確認済みの花束写真と、新教材を撮影したWebPプレビューを追加。画像の作者・用途・取得方法を出典記録に追記。
- `DESIGN.md` / `PRODUCT.md` / `docs/design/2026-11-09-reading-flow.md`: 現在の設計と研究・指針・プロジェクト判断を分けて記録。

## 2026-11-08

- `company.astro` / `SiteFooter.astro` / `DESIGN.md`: 会社概要本文の末尾リンク列と、同ページのフッター運営者再掲を削除。情報と導線が続けて重なる状態を整理し、会社情報・確認元・共通フッターナビは維持。
- `index.astro` / `site.ts` / `global.css`: ユーザー依頼で会社名・屋号、担当者名、メールアドレスを必須に追加。相談文は初期2行・88pxから内容と画面幅に合わせて伸縮し、削除すると縮む。必須・メール形式の検証と入力全項目のコピーに対応し、未接続の送信状態は維持。
- `PRODUCT.md` / `DESIGN.md`: 最新の問い合わせ項目、自動伸縮、コピーのみという接続条件を現行方針へ反映。
- `service-demos.ts` / `global.css`: 独立レビューの指摘を受け、選択中サービスを横タブの可視範囲へ収め、横向きの低い画面でもメニュー全項目へ到達できる高さへ修正。
- `AUDIT.md` / `docs/audits/2026-11-08-design-fixes.md`: 横断監査11件の対応、全16ビュー・操作検証、残るメール・API接続条件を修正後の記録として追加。
- `SiteLayout` / `Brand` / `SiteHeader` / `SiteFooter` / `navigation.ts` と全8ページ: ページ移動時の雰囲気を揃えるため、トップの固定ナビ・ロゴ・書体・黒いフッター・headを共通化。会社・理念の本文幅、白い静止問い合わせは維持。
- `global.css` / `services.css` / `OpeningHero.astro`: 入力枠と入力例の対比を改善。サービス切り替えはスマホで1行の横スクロールとし、プレビュー画像は直接サンプルへ移動。未使用hero/cinema CSSを削除し、旧3Dソースは配信しないまま保管。
- `site.ts`: 空白だけの相談文をエラーとし、閲覧途中の縮小モーション変更でも表示を静止状態へ戻すよう修正。本文からの相談ボタン表記を統一。
- `DESIGN.md`: 撤回済みの赤い動く問い合わせ帯を過去案へ移し、共通レイアウト・入力の基準・現在の動作を記録。

- `AUDIT.md` / `docs/audits/2026-11-08-all-pages-design-audit.md`: ページ遷移時の雰囲気の不一致という指摘を受け、全8ページをPC/スマホ・独立した見た目/技術担当で横断監査。共通外枠・導線・書体読込・入力状態など11件を記録。サイト実装の変更・公開は行わず、個別ページの合格をサイト統一の合格としない方針を明記。
- `company.astro` / `COMPANY.md`: ユーザーの明示情報に基づき資本金100万円を会社概要へ追加。代表者・正式設立日は未掲載を維持。
- `company.astro` / `index.astro` / `philosophy.astro` / `COMPANY.md`: ユーザー提供の会社名・市区町村と国税庁で確認した法人番号をもとに、会社概要と運営者表記を追加。設立年月日・代表者・資本金は確認できず未掲載。法人番号指定日を設立日に流用しない。
- `src/pages/philosophy.astro` / `index.astro`: ユーザー依頼で「身近な技術で、事業の可能性を広げる。」を主題とする企業理念ページとフッターリンクを追加。誇張や未確認の法人情報を避け、既存の事業目的と3つの基本姿勢を文章で説明。
- `site.ts`: 公開ブラウザでスナップ終端と描画端に4pxの差が出たため、終端ボタン判定に8pxの許容を設け、余分な横送り操作を防止。
- `index.astro` / `global.css` / `site.ts`: サービス4件の一括表示を、PC3件・タブレット2件・スマホ1件の手動横送りへ変更。左右ボタン、表示範囲、端での無効化、スワイプ、キーボード、縮小モーションに対応し、希望する項目を自分のペースで閲覧できるようにした。
- `index.astro` / `global.css` / `site.ts`: ユーザーの再指示で問い合わせ欄の赤い背景、巨大コピー、直前の動く文字帯を撤去。白地・中央一列・標準サイズの「お問い合わせ」、控えめな黒いボタンへ変更。最小入力と未接続の受付状況は維持。
- `OpeningHero.astro` / `index.astro` / `global.css` / `site.ts`: HiXFiらしい大胆さと動きの追加依頼に合わせ、ヒーローの大きな赤い面、画面のスクロール追従、赤い大文字帯と問い合わせ面を追加。自走ループは使わず、縮小モーション時は新しいスクロール演出を解除する。
- 問い合わせを相談文1項目＋折りたたみの任意URLへ簡略化。メール新設前のため個人情報欄と擬似送信を外し、実際に相談文をコピーする操作へ変更。SEOからURLを引き継いだ場合は任意欄を開いて確認できるようにした。
- `index.astro` / `global.css` / `services.ts` / `public/images/services/`: サービス説明を画像・短い説明・詳細リンク付き横4カラムに変更。画像は自社の架空体験サンプルを撮影し、実績と区別。タブレット2列・スマホ1列とすることで、それぞれの完成イメージを比較しやすくした。
- `src/pages/seo-check.astro` / `src/scripts/seo-check.ts`: 追加指示により自社SEO確認ページを追加し、URL→解析・目的別ガイド→相談に変更。45秒の取得期限、利用上限時の案内、実測のみのスコア表示を実装。目的別案内は一般ガイドと明記し、顧客サイトを検出した結果と混同させない。
- `src/data/services.ts` / `src/pages/services/[slug].astro` / `src/components/ServiceDemo.astro` / `src/scripts/service-demos.ts` / `src/styles/services.css`: ウェブ・EC・AIアプリ・保守セキュリティの4ページを追加。事業説明、実績と区別した体験サンプル、各3本の豆知識、料金の適用境界を掲載し、何を依頼できるか分かる構成へ拡張。
- `OpeningHero.astro` / `site.ts` / `index.astro`: SEO解析を開いた後に相談ボタンを表示し、対象URLと相談文を引き継ぐ。受付用メールは新設予定のため送信は接続せず、現状を相談導線上にも明示。
- `.github/workflows/deploy-pages.yml` / `astro.config.mjs` / `.gitignore` / `README.md`: GitHub Pagesで安全に静的公開できるよう、`main`更新時のビルド・デプロイ、プロジェクトページ用の配信パス、ローカル検証ログと途中成果物の公開除外、公開手順を追加。サイト本体と必要な制作記録だけを公開対象にするため。
- `src/pages/index.astro` / `src/styles/global.css`: 固定の基本料金3件と任意オプションを、追加請求の境界・保守契約の任意性・外部費用の実費を含めて掲載。料金の上振れを連想させる「〜」を使わず、クリーンな価格方針を伝えるため。
- `PRODUCT.md` / `DESIGN.md`: ユーザーが承認した税込固定価格、任意オプション、保守契約の非必須方針を記録。
- `src/components/OpeningHero.astro` / `src/scripts/site.ts` / `src/scripts/hero-ambient.ts`: ユーザーの指示により、常時表示の抽象3Dシグナルと停止操作、Three.jsの遅延読込を撤去。3Dの存在感が相談UIより強くなっていたため、次のヒーロー案を検討しやすい状態へ戻す。
- `src/components/OpeningHero.astro` / `src/scripts/hero-ambient.ts` / `src/scripts/site.ts`: 具象的な口元ではなく、赤い流動体の抽象3Dシグナルをヒーロー背景へ追加。通常時だけゆっくり回転し、画面外・非表示タブ・縮小モーション時は描画を止め、利用者も停止できるため。
- `src/components/OpeningHero.astro` / `src/scripts/site.ts`: 左のURL入力を右側のSEO確認画面にも同期。入力・確認という実際の行為と、ヒーローの見せ方を一つにするため。
- `src/components/OpeningHero.astro`: 見出し上の飾りラベルと赤い小カードを外し、主見出し・SEO確認・3Dシグナルの三要素へ整理。右側に同じ強さの主張が並ぶ状態を解消するため。
- `src/components/OpeningHero.astro` / `src/scripts/site.ts`: URLを入力するとGoogle PageSpeed InsightsのモバイルSEO確認を別タブで開く簡易チェッカーを追加。公開先未定の静的サイトでも、APIキーを保存せず実際の解析へつなぐため。
- `src/scripts/site.ts`: 空白を含む不正URLがブラウザで補完され外部へ渡るケースを防ぐため、`type=url`の形式検証を通るまでチェックを開かないよう修正。
- `PRODUCT.md` / `DESIGN.md`: 外部チェックの範囲と、サイト内スコア表示には公開先の専用APIキーが必要な境界を記録。
- `src/components/OpeningHero.astro` / `src/pages/index.astro` / `src/scripts/site.ts`: ヒーローのコピー・相談導線・対応画面が順に組み上がる導入、サービス一覧とセキュリティ診断線のスクロール演出を追加。常駐ループではなく、相談へ視線を導く一度きりの演出に限定。
- `src/scripts/site.ts`: 削除済みの進め方セクションを参照していた既存の対話線スクロール終点を、セキュリティセクションへ更新。動的演出の対象を現行構成へ合わせるため。
- `DESIGN.md`: 動きの役割、実行時間、縮小モーション時の静止表示を記録。
- `src/pages/index.astro` / `src/styles/global.css`: ユーザー指定により、相談から改善までの4ステップと「私たちの姿勢」セクションを削除。該当ナビゲーションと専用スタイルも外し、リンク切れを残さないため。
- `src/components/OpeningHero.astro` / `src/pages/index.astro`: URLを添えた相談から、初回のSEO・モバイル・更新状況確認へつながるコピーと任意URL欄を追加。自動診断ではなく相談時に整理する提供範囲を誤解なく伝えるため。
- `src/pages/index.astro` / `src/styles/global.css`: 必要な場合に有料セキュリティ診断を案内し、対象範囲と費用を事前に確認する説明面を追加。価格・診断結果を推測表示しないため。
- `src/scripts/site.ts`: 任意URLが形式不正のとき、メールアドレスではなくURLを直す案内を出すよう修正。
- `PRODUCT.md` / `DESIGN.md`: 初回確認と有料診断の役割・未確定境界を記録。
- ユーザーの指示により、YAYOI SAIGAの作品・事例をサイト表示から外した。`src/components/OpeningHero.astro` を、HiXFiを参考にしたサービス起点のヒーローと、独自のブラウザ・スマホ・状態カードの重なりへ再設計。第三者/社内作品の世界観ではなく、保守・AI・安全性の相談導線を主役にするため。
- `src/components/FeaturedWork.astro` を削除し、`src/pages/index.astro` の事例導線を「できること」へ変更。未完成のAMOUNTを架空の実績として見せないため。
- `src/scripts/site.ts` からYAYOI用のポインター追従を除去。新ヒーローは常駐描画・自動アニメーションを持たないため。
- `PRODUCT.md` / `DESIGN.md`: AMOUNTの公開可能範囲を確認してから掲載する方針と、HiXFiから参照する要素・参照しない要素を記録。
- `src/components/OpeningHero.astro`: 375px幅でカテゴリ表示が固定ヘッダーに近づきすぎたため、上部余白を調整。視認性を保つため。
- ユーザーのAIチーム実行依頼に基づき、統率・設計・コピー確認・事例実装・独立監査を分担。今回範囲は白黒赤トップとYAYOI SAIGAの社内事例。
- `src/components/OpeningHero.astro`: 「ウェブの心配を、仕事からなくす。」と、赤い唇作品・実サイト画面のコラージュを追加。
- `src/components/FeaturedWork.astro`: PC・スマホ実画面、社内事例表記、確認済み機能と外部リンクを追加。スマホの見出し改行を修正。
- `src/pages/index.astro`: 新コンポーネントを統合し、制作事例ナビ・白いテーマ色・極太ウェイトを追加。
- `src/styles/global.css`: 共通色を白黒赤へ変更し、ヘッダーとモバイルメニューを白い面へ統一。
- `src/scripts/site.ts`: 旧Three.jsを配信入口から除外し、操作時だけ最大2度追従する実画面演出を追加。監査指摘に基づきEscapeのフォーカス移動をメニュー表示中だけへ制限。
- `public/images/`: ユーザー指定の社内サイトの実画面・作品画像・取得元記録を追加。
- `PRODUCT.md` / `DESIGN.md` / 計画書: EC・AIアプリ開発、社内事例の根拠、白黒赤の現行設計と担当範囲を更新。
- `AUDIT.md` / `outputs/README.md`: 独立コード監査とブラウザ確認、現在の配布物に合わせて記録を更新。

## 2026-11-05

- `docs/superpowers/specs/2026-11-05-cinematic-tech-redesign.md`: 現行3D案を撤回し、候補Eの単一3Dコア、タイポグラフィ、下層構成、性能・アクセシビリティ条件を承認待ち設計として記録。
- `docs/superpowers/plans/2026-11-05-cinematic-tech-redesign.md`: 承認済みE案を、描画方針、単一3Dコア、ヒーロー統合、実ブラウザ監査の4タスクへ分解。
- `src/scripts/hero3d-policy.ts` / `tests/hero3d-policy.test.ts`: 900pxを境界に単一3Dコアの積層・左右分割構成とポインター追従範囲を決める契約を追加。
- `src/scripts/hero3d.ts`: 曲線、サービス面、DOMラベルを廃止し、黒鉛色の二つの外殻、あずき色の核、琥珀色の内核、控えめなコバルトリムから成る単一造形へ置換。縮小モーションの動的切替にも対応。
- `tests/hero3d-policy.test.ts`: 縮小モーション・画面外・非表示タブで継続描画を止める条件を15テストへ拡張。
- `src/scripts/hero3d.ts` / `src/scripts/hero3d-policy.ts` / `tests/hero3d-policy.test.ts`: 5秒を超える自動呼吸ループを廃止し、初回オープンと操作追従が収束したら描画を止める判定をRED→GREENで追加。
- `src/pages/index.astro` / `src/styles/global.css`: ヒーローを「技術が進むほど、相談できる距離は、近くていい。」の短いコピー、単一3Dコア、墨色と温かな核の非対称構成へ再設計。
- `DESIGN.md`: 対話線とサービス面の旧3D案を廃止し、承認済みE案を現行の実装基準として記録。
- `AUDIT.md` / `outputs/README.md`: E案のデスクトップ・モバイル・縮小モーション・WebGL喪失・最新ガイドライン監査結果と成果物条件を記録。
- `docs/superpowers/specs/2026-11-05-3d-hero-design.md`: 3D対話軌道と接続された情報面を組み合わせる、承認前のヒーロー設計を記録。
- `docs/superpowers/plans/2026-11-05-3d-hero.md`: 承認済み設計を、描画ポリシー、Three.jsシーン、統合、実ブラウザ検証の実装計画へ分解。
- `package.json` / `package-lock.json`: Three.js r187とVitestを追加。既知脆弱性0件を確認。
- `src/scripts/hero3d-policy.ts`: WebGL対応、縮小モーション、DPR、画面幅から描画方針を決める純粋関数を追加。
- `tests/hero3d-policy.test.ts`: 3つの描画モード、DPR上限、モバイルの情報面数を7テストで固定。
- `src/scripts/hero3d.ts`: 表示中だけ動く3D対話軌道、最大3枚のサービス面、縮小モーション静止表示、SVG復帰、GPU資源破棄を実装。
- `@types/three`: Three.js本体とCSS2DRendererを厳格なTypeScript検査へ含めるため開発依存へ追加。
- `tests/hero3d-policy.test.ts`: 非数値DPRと768px境界を追加し、8テストへ拡張。
- `src/pages/index.astro` / `src/styles/global.css` / `src/scripts/site.ts`: 3Dキャンバス、デスクトップ用ラベル、モバイル可読性、SVG切替、初期化と破棄を統合。
- `DESIGN.md`: 承認済みA+Cの3D表現、性能、縮小モーション、フォールバック条件を設計基準へ追記。
- `AUDIT.md`: Impeccable、最新Web Interface Guidelines、デスクトップ・スマホ、縮小モーション、WebGL喪失を再監査。
- `outputs/README.md`: 3Dの表示条件とSVGフォールバックを追記。
- `outputs/web-no-tonari-source.zip` / `outputs/web-no-tonari-static.zip`: 3D実装・設計・監査記録を含むソース版と静的版へ更新。

## 2026-11-04

- `PRODUCT.md`: 承認された事業目的、利用者、仮名称、未確定事項、外部送信しない境界を記録。
- `DESIGN.md`: 対話線を中心としたデザインシステム、検索結果の採否、動きとアクセシビリティ基準を記録。
- `package.json`: Astro、TypeScript、GSAPによるローカル制作・検証環境を追加。
- `astro.config.mjs`: 公開先未定の静的ビルドとローカルホスト設定を追加。
- `tsconfig.json`: Astroの厳格なTypeScript設定を追加。
- `src/pages/index.astro`: ヒーロー、困りごと選択、サービス、進め方、セキュリティ、FAQ、デモ相談フォームを実装。
- `src/scripts/site.ts`: モバイルナビゲーション、選択状態、対話線のモーション、フォーム検証と未送信デモ状態を実装。
- `src/styles/global.css`: デザイントークン、レスポンシブレイアウト、操作状態、フォーカス、縮小モーションを実装。
- `AUDIT.md`: Impeccable、最新Web Interface Guidelines、実ブラウザ、ビルド、依存関係の監査結果を記録。
- `outputs/README.md`: 成果物の内容、ローカル確認方法、現在の制約を記録。
- `package.json`: OS側を変更せず安全修正版Astro 7.4.5を使うため、プロジェクト内Node.js 22.23.4を追加。Astro 6系で検出されたXSS・画像処理系の既知脆弱性を回避。

### 変更理由

AI時代の先進性と、小さなチームだからできる近さを、一般的なSaaSカードやネオン表現ではなく、一本の対話線と明確な状態遷移で伝えるため。

### 実画面確認後の調整

- デスクトップで相談CTAが最初の画面から外れないよう、ヒーロー見出しの最大サイズを調整。
- フォーム送信時に全必須項目のエラーを表示し、最初の修正項目へフォーカスするよう変更。
- 縮小モーション時も有用な状態変化を失わないよう、全要素一括停止から装飾モーションだけを止める方式へ変更。
- 最新Web Interface Guidelines監査に基づき、ブランド宣言を正しい見出しへ変更し、メール欄、ローディング表記、アンカー位置、タップ表示、セーフエリアを調整。
