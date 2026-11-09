# EC運用・端末別セキュリティ教材

## 目的と決定

2026-11-09の追加指示で、ECは購入者の見方から、購入後の管理と運用者の判断へ重点を変更。セキュリティは文章の一覧から、実際に触れる端末に近いSMS・メール画面へ変更し、古いPHPの保守を加える。

## 内容

- EC管理画面：架空の3注文。入金待ち、一部出荷、返品対応。決済・出荷・返品を独立して表示し、担当者・次の作業・対応の流れを提示。
- EC記事：カード承認と売上確定、販売可能数と引き当て、返品・返金・再入庫。通知の重複や遅延、在庫同期、二重返金を防ぐ運用判断にも触れる。
- SMS：不在通知、急がせる文章、偽URL、少額請求を口実とした入力誘導。
- PCメール：差出人、表示URLと実際の行き先、予定していないZIP添付、不自然な文字。自然な文章でも安全とは限らず、国籍は推測しない。
- PHP：7.4/8.1の終了、8.2〜8.5の公式期限を2026-11-09時点で抜粋。通常サポートとセキュリティ修正期間を区別。ベンダー延長保守は別途確認する。
- 更新：構成把握、バックアップ・復元準備、検証環境で互換性と業務動作を確認、本番後の確認。バージョンだけで侵入被害を断定しない。

実際の購入・送信・返金・診断は行わない。会社・商品・注文・メールは架空。実在のEC製品の管理画面を装わない。URLは予約ドメインの文字のみ、添付もファイルを持たない。

## 見た目と操作

ui-ux-pro-maxの状態通知の指針とfrontend-designを使い、既存の白黒赤と書体を維持。管理画面は一覧と詳細、SMSは端末と吹き出し、PCメールは差出人・本文・添付の構造で表現。ImpeccableとWeb Interface Guidelinesで操作・読み幅・折り返しを確認する。

ECの選択は押下状態と一つの読み上げ通知で示す。JavaScriptなしでは全3注文が読み進められる。SMS・メールの解説は標準detailsで開き、JavaScriptを必要としない。

## 参照した一次資料

- [Shopify：注文の状態](https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status)
- [Shopify：在庫の状態](https://help.shopify.com/en/manual/inventory-and-locations/fundamentals/inventory-states)
- [Shopify：返品と交換](https://help.shopify.com/en/manual/fulfillment/managing-orders/returns)
- [Stripe：決済通知の重複と順序](https://docs.stripe.com/webhooks#handle-duplicate-events)。通知単位と処理対象を照合する考え方の補足。
- [警察庁：フィッシング](https://www.npa.go.jp/bureau/cyber/countermeasures/phishing.html)
- [IPA：メールを悪用した攻撃](https://www.ipa.go.jp/security/support/abuse_email.html)
- [PHP：サポート中](https://www.php.net/supported-versions.php)、[終了済み](https://www.php.net/eol.php)、[更新の重要性](https://www.php.net/manual/en/security.current.php)

確認日：2026-11-09。デモ・設計上の工夫・更新手順は、資料を踏まえた独自の説明。各社・機関の公式教材ではない。

## 検証

- Astro check：33ファイル、エラー・警告0。静的9ページの生成成功。
- 1440 / 768 / 375 / 320px：EC・セキュリティとも横はみ出しなし。PCとモバイルの表示を目視し、PHPの日付を一行で読める形式に調整。
- 受注管理3場面：クリックとキーボードEnterで切替、表示ペインと選択状態は常に1つ。
- SMS3箇所・PCメール4箇所：キーボードでも開閉。全展開時の320pxでも横はみ出しなし。教材の予約ドメインへのリンク・通信0。
- 6問の選択と解説、ウェブ制作の既存3問、AI整理サンプルを確認。ブラウザ実行エラー0。
- JavaScriptなし：ECの3注文すべて読め、標準detailsで説明が開く。SMS・メールも開閉可能。
- 320pxで字間・単語間隔・行間を拡大しても横はみ出しなし。
- Impeccable detector指摘0。Web Interface Guidelinesに沿って標準要素、フォーカス、通知、見出し、折り返しを確認。固定ヘッダーを考慮してサンプルへのスクロール余白も120pxへ修正。

## 変更履歴

- 2026-11-09：ユーザー指定の運営側への重点変更と端末UI・PHP保守の設計を初版記録。従来の `2026-11-09-service-learning.md` のEC商品サンプル・4箇所メールの仕様を置き換える。
