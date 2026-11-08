# 変更履歴

## 2026-11-08

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
