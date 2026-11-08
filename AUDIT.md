# 完成後監査

## 企業理念ページ — 2026-11-08

変更理由: 事業の目的と基本姿勢を独立して説明するため。

- 1440px / 375pxで本文・3つの基本姿勢・リンクを画面確認、横はみ出しなし。
- Astro check: エラー・警告・ヒント0。7ページ静的ビルド成功。Impeccable detector `[]`。
- 企業概要の項目はサイバーエージェント・さくらインターネットの公式会社概要を調査。正式な会社名・代表者・所在地・設立はユーザー確認待ちで、推測掲載はしない。

## サービス紹介の手動横送り — 2026-11-08

変更理由: 全4件を一括で表示せず、2〜3件を見ながら左右ボタンで送るという依頼に対応。

- Chromium 1440px: 表示1〜3→次2〜4→前1〜3。768px: 表示1〜2→次2〜3、終端3〜4。375px: 1→次2、終端4。
- 終端で「次」を無効化。横スクロール後の表示範囲更新、一覧の右矢印キーで1→2、各幅の文書横はみ出しなしを確認。
- Astro checkエラー・警告・ヒント0、6ページビルド成功。Impeccable detector `[]`。実機のタッチジェスチャーは未検証で、標準の横スクロールを使用。

## 問い合わせ欄を一般的な静止フォームへ変更 — 2026-11-08

変更理由: ユーザーが赤い背景と動きを望まないため、白地・中央一列・控えめな見出しとボタンへ変更。

- 1440px / 375px: 背景白、動く文字帯なし、横はみ出しなしを確認。空入力時に相談文へフォーカス。
- Astro check エラー・警告・ヒント0、6ページビルド成功。
- 送信先未確定のためコピー操作を維持し、送信機能が未接続である説明を残した。

## スクロール演出・相談欄の簡略化 — 2026-11-08

変更理由: HiXFiのような大胆さと動きを増やし、問い合わせの入力負担を減らすため。

- 相談文の空入力で最初のエラーへフォーカス。クリップボードはテスト用受け口に置き換え、相談文が正しく渡されることを確認（利用者のクリップボードは変更していない）。
- 通常表示のフォーム入力は相談文のみ。任意URLは折りたたみ、SEOからの引き継ぎ時は開いて表示する。
- 新スクロール演出は縮小モーションへ変更するとtransformが解除されることを確認。
- Astro check エラー・警告・ヒント0、6ページビルド成功。メール受付は未接続のまま。
- 独立レビューは変更5ファイルと3画面幅の全9枚を確認し、今回追加範囲の判定は`ship`。新大見出しのスクロール前後でtransformが変わることを実操作で確認。最終375pxの文書幅は363pxで横はみ出しなし。

## 画像付きサービスカラム — 2026-11-08

変更理由: 各サービスの完成イメージと短い説明を横並びで比較できるようにするため。

- Chromium 1440px / 768px / 375pxで4列 / 2列 / 1列を確認。横はみ出しなし、画像4点の読込成功。
- 画像は自社サンプル画面で、顧客の実績写真ではないと表記。取得元は `public/images/services/PROVENANCE.md` に記録。
- Astro check: エラー・警告・ヒント0。静的6ページのビルド成功。

## サービス4ページ・SEO確認導線の追加 — 2026-11-08

変更理由: 対応内容を説明と操作サンプルで理解できるようにし、SEO確認を自社の案内・相談へつなぐため。

- 対象: 新規サービス4ページ、SEO確認ページ、トップのサービス一覧・URL引き継ぎ。
- Chromium 1440px / 375px: サービス4ページの横はみ出しなし。各画面を保存して見出し・操作・コラム・相談導線を確認。
- 実操作: 花屋サンプルの理由表示、ECの色・数量変更と合計5,400円（商品2点＋送料600円）、カート消去、AIサンプル切替、メール3か所の確認数を検証。
- SEO: トップ→専用ページ→目的別ガイド→相談欄へURLと目的の引き継ぎを検証。不正URLは近接エラーとフォーカス移動を確認。
- Google実接続は429（利用上限）。取得不能状態を検証し、スコアを表示しない。API成功分岐はテスト用応答で82点と改善項目の描画を検証したもので、ライブ解析成功の証拠ではない。
- Impeccable detector: 変更UIに対して `[]`。Web Interface Guidelines最新版を照合。スコア・所見はテキストノードで表示し、外部HTMLを注入しない。
- 独立finish review: コード・差分とdesktop/mobile全10枚を別担当が確認し、今回追加したローカル範囲のdispositionは`ship`。実API成功・本番・実メール送信の検証を含むものではない。
- 残る接続: 安定した診断結果の取得にはGoogle API利用設定・制限付き公開キーが必要。問い合わせメールはユーザーが新設予定で、送信先は未接続と明記。
- 未確認: 実機Safari、全WCAG基準の適合。今回の追加を営業サイト全体の監査合格とは扱わない。

## 現行版: HiXFi参照の白黒赤トップ — 2026-11-08

対象: OpeningHero.astro、index.astro、global.css、site.ts。以下の旧3D監査は過去版の記録。

統率役が実画面確認を実施。確認した新規範囲のP0/P1指摘なし。Impeccable detectorは `[]`。Web Interface Guidelines は2026-11-08に再取得して照合。

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility | 3/4 | 見出し・読み上げ除外・縮小モーション・メニューEscape・フォーム初回エラーフォーカスを確認。全WCAG項目の適合認証ではない |
| Performance | 4/4 | 現行ヒーローにThree.js描画・常駐ループはなく、静的HTML/CSSを基本とする |
| Theming | 4/4 | 共通トークンを白黒赤へ統一。巨大見出し、赤い相談導線、複数面の重なりを一貫して適用 |
| Responsive | 3/4 | Chromiumの375/1440pxで横はみ出しなし、見出しと相談導線が初期画面内。実機・Safariは未確認 |
| Implementation Integrity | 4/4 | 特定の作品・顧客画面を外し、未完成のAMOUNTも実績として見せない。detector指摘0 |
| **Total** | **17/20** | **Good — 確認した範囲で重大問題なし** |

### 修正した指摘

- P2 / `src/scripts/site.ts`: メニュー閉鎖中のEscapeでフォーム入力からフォーカスを奪う既存処理を修正。メニュー表示中だけを閉鎖対象にした。ブラウザでフォーム#nameのフォーカス維持を確認。
- `src/pages/index.astro`: ナビの「できること」が二重に表示される状態を画面確認で見つけ、1項目へ修正。
- `src/scripts/site.ts`: 任意のサイトURLが不正な形式のとき、修正対象を誤ってメールアドレスと案内する表示をURL専用の文言へ修正。
- `src/scripts/site.ts`: 削除済みの進め方セクションを終点にしていた対話線のスクロール設定を、現行のセキュリティセクションへ更新。

### 実ブラウザ結果

- 375/1440px: documentの横はみ出しなし。375pxで見出しと相談導線が初期画面内、表示中のリンクは44px以上。
- モバイルメニュー: 開くとaria-expanded true、Escapeでfalse。閉鎖中のフォーム入力にEscapeしてもフォーカス保持。
- フォーム: 空入力で必須3件のエラー、最初のエラーへフォーカス。テスト入力でデモ完了表示。POSTリクエスト0。
- 困りごと選択: セキュリティを選ぶと案内が「セキュリティ診断」へ切り替わる。
- ヒーロー: URL入力が右側のSEO確認画面へ同期する。抽象3Dは撤去済み。
- JavaScript無効の375pxページ: 主見出し、相談導線、対応領域が存在。
- Console error / warning: 0。
- SEO簡易チェック: `hixfi.com` を入力すると、HTTPS付きURLとしてGoogle PageSpeed Insightsのモバイル解析を別タブで開くことを確認。不正な空白入りURLはタブを開かず、入力欄へエラーとフォーカスを戻すことを確認。

### 最新Web Interface Guidelines

https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md を2026-11-08に取得し照合。画像寸法、lazy、focus-visible、意味のあるリンク、読み上げ除外、縮小モーション、明示transition、アンカー余白を確認。

- `src/components/OpeningHero.astro` - ✓ ラベル、ライブ通知、縮小モーション分岐を確認
- `src/scripts/site.ts` - ✓ URL同期を確認
- `src/pages/index.astro` / `src/styles/global.css` - ✓ 今回変更範囲の指摘なし

### 変更履歴

- 2026-11-08: 白黒赤トップ・YAYOI社内制作事例の現行監査、独立コード指摘と修正、実画面確認、未確認範囲を追加。
- 2026-11-08: ユーザーの方針変更後、YAYOI SAIGAを外したHiXFi参照のサービスヒーローを再監査。Impeccable detector `[]`、最新Web Interface Guidelinesの変更範囲に指摘なし。
- 2026-11-08: 初回SEO確認・有料セキュリティ診断の導線と任意URL欄を追加。`type=url`、ラベル、補助文、近接エラー、フォームの未送信境界を確認。
- 2026-11-08: 動的演出を追加。通常設定ではロード直後に見出し・画面カードのopacityが0→1へ収束し、サービス一覧も表示を確認。縮小モーション設定では初期からopacity 1・JS由来のtransformなし。375px/1440pxで横はみ出しなし、Impeccable detector `[]`。
- 2026-11-08: Google PageSpeed InsightsへのSEO簡易チェックを追加。ラベル、URL入力形式、別タブ、ライブ通知、不正URL時の近接エラーを確認。サイト内スコアAPIは専用キー未設定のため実装対象外。
- 2026-11-08: 抽象3DシグナルとSEO入力同期を追加。375px/通常幅で横はみ出しなし、WebGL初期化、停止・再開、URL同期、Console error 0を確認。Impeccable detector `[]`。Three.jsの遅延チャンクが500KBを超えるため、公開先決定後に実機計測を行う。
- 2026-11-08: ユーザーの指示により、上記の抽象3Dシグナルを撤去。`astro check` 0 errors / 0 warnings / 0 hints、静的ビルドと15テストの通過を確認。
- 2026-11-08: 固定料金と任意オプションの料金面を追加。PC・375px幅で価格、追加請求なしの条件、保守契約が任意である説明を確認。横はみ出しなし、Impeccable detector `[]`、`astro check` 0 errors / 0 warnings / 0 hints、15テスト通過。

実施日: 2026-11-04  
対象: `src/pages/index.astro`、`src/scripts/site.ts`、`src/styles/global.css`

## Impeccable

### Audit Health Score

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility | 4/4 | 見出し階層、スキップリンク、ラベル、近接エラー、フォーカス移動、縮小モーションを実画面確認 |
| Performance | 4/4 | 静的HTMLを基本とし、動きはSVGとtransform/opacityへ限定。画像・動画なし |
| Theming | 3/4 | 全色をCSSトークン化。単一ブランドテーマとして意図的にライト面とダーク面を併用 |
| Responsive | 4/4 | 375 / 768 / 1024 / 1440pxで横スクロールなし。44px以上の操作領域を確認 |
| Implementation Integrity | 4/4 | 対話線が構造・状態・物語を一貫して担当。Impeccable detectorは `[]` |
| **Total** | **19/20** | **Excellent** |

### 実画面で確認した経路

- モバイルメニューを開き、Escapeで閉じる
- 困りごとの選択を切り替え、`aria-pressed` と案内内容が同期する
- 空のフォームで全必須項目にエラーを表示し、最初の項目へフォーカスする
- テスト入力後、ボタンの処理中状態と「外部送信されていない」完了表示を確認する
- `prefers-reduced-motion: reduce` で対話線を最終状態にし、スクロール演出を停止する

## Web Interface Guidelines

最新の `vercel-labs/web-interface-guidelines` を取得して照合した。

### 修正済み

- `src/pages/index.astro:253` - ブランド宣言を段落から `h2` へ変更し、見出し階層を修正
- `src/pages/index.astro:299` - メール欄へ `spellcheck="false"` を追加
- `src/scripts/site.ts:203` - 処理中表記を「確認しています…」へ変更
- `src/styles/global.css:38` - アンカー対象へ `scroll-margin-top` を追加
- `src/styles/global.css:91` - タップ時のハイライト色を明示
- `src/styles/global.css:181` - 固定ヘッダーへ左右セーフエリア対応を追加

### 再監査

- `src/pages/index.astro` - ✓ pass
- `src/scripts/site.ts` - ✓ pass
- `src/styles/global.css` - ✓ pass

`transition: all`、ズーム無効化、フォーカス除去、クリック可能な非セマンティック要素、ラベルのないフォーム、寸法のない画像は検出されなかった。

## ビルド・依存関係

- `astro check`: 0 errors / 0 warnings / 0 hints
- `astro build`: 成功、1ページを静的生成
- `npm audit --audit-level=low`: 既知脆弱性0件
- Astro 7.4.5を安全に動かすため、OSを変更せずプロジェクト内Node.js 22.23.4を使用

## 意図的な制約

- 仮名称のため、正式公開前に類似名称・ドメイン・商標を確認する
- 相談フォームはデモであり、外部送信しない
- 料金、対応地域、正式な診断範囲は未確定として表示する
- 実績、顧客ロゴ、資格、受賞、件数を創作しない

## 変更履歴

- 2026-11-04: Impeccable、最新Web Interface Guidelines、実ブラウザ、ビルド、依存関係の監査結果を初版記録。
- 2026-11-05: 3Dヒーロー追加後にImpeccable、最新Web Interface Guidelines、実ブラウザ、縮小モーション、WebGL復帰、ビルドを再監査。

---

## 3Dヒーロー再監査 — 2026-11-05

対象: `src/pages/index.astro`、`src/scripts/site.ts`、`src/scripts/hero3d.ts`、`src/scripts/hero3d-policy.ts`、`src/styles/global.css`

### Audit Health Score

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility | 4/4 | 3Dは装飾として読み上げ対象外。HTML見出しとCTAを最前面に維持し、縮小モーションでは静止1フレームを表示 |
| Performance | 3/4 | DPR 1.5上限、画面外・非表示タブ停止、GPU資源破棄を実装。JSは181,905 bytes gzipだが、未圧縮minify後654KBの警告あり |
| Theming | 3/4 | 既存CSSトークンと青・あずきの役割を維持。WebGL材質色は同値をコード側でも保持 |
| Responsive | 4/4 | 1440×1000で3面、375×812で2面へ削減。横はみ出しなし、スマホではDOMラベルを非表示 |
| Implementation Integrity | 4/4 | 対話線の物語を3Dへ一貫して拡張。Impeccable detectorは `[]` |
| **Total** | **18/20** | **Excellent** |

### Implementation Integrity Verdict

Pass。3Dは汎用的な粒子背景ではなく、既存の「対話線」と保守・AI・セキュリティの接続を立体化している。本文や操作をCanvasへ移さず、非対応環境でも意味と導線を失わない。

### 実ブラウザ検証

- Chromium / 1440×1000: WebGL初期化、3つの情報面、ポインター非干渉、横はみ出しなし
- Chromium / 375×812: 2つの情報面、DOMラベル非表示、見出し・CTA可読、横はみ出しなし
- `prefers-reduced-motion: reduce`: 静止3D、CSS遷移0秒
- `webglcontextlost`: 3D準備属性とラベルを除去し、SVGフォールバックを即時表示
- 通常再読込後のConsole: error 0 / warning 0

### Impeccable

- `impeccable detect --json src/pages/index.astro`: `[]`
- P0: 0 / P1: 0 / P2: 1 / P3: 0
- P2 Performance: Three.jsを含む単一JSチャンクがViteの500KB警告値を超える。公開環境の転送圧縮と実測を確認し、必要なら `$impeccable optimize` で遅延読込または描画実装の軽量化を検討する

### Web Interface Guidelines

2026-11-05に最新版を再取得し、対象5ファイルを照合。

- `src/pages/index.astro` - ✓ pass
- `src/scripts/site.ts` - ✓ pass
- `src/scripts/hero3d.ts` - ✓ pass
- `src/scripts/hero3d-policy.ts` - ✓ pass
- `src/styles/global.css` - ✓ pass

装飾Canvasの読み上げ除外、縮小モーション、明示的transition、フォームラベル、フォーカス、タッチ操作、セーフエリア、アンカー余白、レイアウト読み書きの分離を確認した。

---

## シネマティックE案 最終監査 — 2026-11-05

対象: `src/pages/index.astro`、`src/scripts/site.ts`、`src/scripts/hero3d.ts`、`src/scripts/hero3d-policy.ts`、`src/styles/global.css`

### Implementation Integrity Verdict

Pass。商品固有の「技術の外殻と、仕事を理解する温度」を、黒鉛色の二つの殻と一つの温かな核へ集約した。情報・CTAはHTMLに残し、3Dは意味を補強する装飾に限定。Impeccable detectorは `[]`。

### Audit Health Score

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility | 4/4 | Canvasは読み上げ対象外。見出し、CTA、フォーカス、フォームラベル、縮小モーション静止表示を確認 |
| Performance | 3/4 | DPR 1.5上限、影・後処理なし、操作収束後・画面外・非表示タブで停止。Three.jsを含む単一チャンクの警告は残る |
| Theming | 3/4 | CSSトークンとシネマ配色の役割は一貫。WebGL材質色はThree.js側に同値を保持 |
| Responsive | 4/4 | 1440×1000と375×812でコピーと造形が分離し、横はみ出しなし、CTAは最初の画面内 |
| Implementation Integrity | 4/4 | 単一造形、コピー優先、静止SVG復帰が同じ概念を保持。detector `[]` |
| **Total** | **18/20** | **Excellent** |

### 検証結果

- Desktop 1440×1000: WebGL準備完了、CTA下端721.75px、横はみ出しなし、SVG非表示
- Mobile 375×812: 見出し下端228.66px、CTA下端448.66px、造形との重なりなし、横はみ出しなし
- `prefers-reduced-motion: reduce`: Canvas transition 0秒、開いた外殻を静止表示
- `webglcontextlost`: イベントを処理し、Canvas opacity 0、SVG opacity 0.82、見出しとCTAは継続表示
- 最新Web Interface Guidelines: 5秒超の装飾ループを検出し、呼吸表現を廃止。初回演出と操作追従の収束後に描画停止する方式へ修正済み
- Impeccable detector: `[]`

### 残る軽微な指摘

- **P2 Performance**: Three.jsを含む本番JSチャンクがViteの500KB警告値を超える。公開先決定後に実転送量と端末性能を測定し、必要なら3Dモジュールの遅延読込を行う
- P0: 0 / P1: 0 / P2: 1 / P3: 0

### 変更履歴

- 2026-11-05: 承認済みE案をImpeccable、最新Web Interface Guidelines、実ブラウザ、縮小モーション、WebGL喪失で最終監査。
