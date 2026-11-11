# SITEVEIL SEO点検・改善報告

変更履歴：2026年11月11日。公開ページのSEOを点検し、古い案内・ページ名・クロール設定を修正。営業メール作成はユーザー指定で対象外。

## 実施したこと
- サイトマップ掲載13ページのタイトル・説明・正規URL・見出し・画像代替文を確認。
- ホームと4サービスの検索向けタイトルを、ホームページ制作・業務システム開発・SEO診断・保守など実際の提供内容へ調整。所在地は確認済みの愛知県大府市だけを使用。
- サービス一覧に残っていた「体験サンプル」の古い検索説明を撤去。安全確認の総合案内も、無料チェック・有料調査という実内容へ修正。
- SEO診断と業務システムの説明に、共有料金データから実際の税込料金・目安を反映。
- サービス一覧と4サービスに、画面のパンくずと一致するBreadcrumbListを追加。検索での表示や順位を保証するものではない。
- robots.txtの試作ページのクロール禁止を撤去。試作・補足ページ自体のnoindexとサイトマップ除外は維持し、検索エンジンが除外指定を読み取れるようにした。robots.txtはアクセス制御ではない。
- 既存URL、本文の見た目、料金、問い合わせ導線は維持。

## 確認済み
- HTTP→HTTPS、www→正規ドメインは301。存在しないページは404。
- サイトマップ13 URLとcanonicalが一致。公開13ページに意図しないnoindexなし。
- 全18 HTMLの内部リンクの遷移先が存在し、JSON-LDを解析できる。サービス4ページのパンくず階層と正規URLを照合。
- 試作・補足4ページのnoindexを維持。
- Astro62ファイルのエラー・警告0。18ページ生成成功、既存66テスト成功。

## 未確認・次に必要なこと
- Search Consoleの接続はこの環境で確認できず、実際のGoogle登録状況・検索語・表示回数・クリック数・順位は未取得。改善の効果はまだ測定していない。
- 一部の調査用取得経路は403となった一方、curlでは公開HTML・robots・サイトマップを取得できた。実際のGooglebotの取得状況はSearch ConsoleのURL検査で確認が必要。
- サイトマップのSearch Consoleへの登録、再クロール依頼、Googleによる構造化データの判定は未実施。アカウントの権限を使える状態で行う。
- Core Web Vitalsの実利用データ、外部リンク、Googleビジネスプロフィールの状態は今回未検証。順位保証や、検索結果への即時反映の約束はしない。

## 判断に用いたGoogle公式資料
- タイトル：https://developers.google.com/search/docs/appearance/title-link
- 正規URL：https://developers.google.com/search/docs/crawling-indexing/canonicalization
- パンくず：https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- robots.txtとnoindex：https://developers.google.com/search/docs/crawling-indexing/robots/intro

公開先：https://site-veil.com/
