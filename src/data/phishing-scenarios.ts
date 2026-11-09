// 変更履歴: 2026-11-09 SMS一問を、不在通知・請求メール・アカウント停止の三問へ拡張。
// 役割: 各場面の表示文と短い解説を定義。URL・番号は教材用で、接続や個人情報の収集はしない。
export type PhishingAction = 'sender' | 'urgency' | 'url' | 'judge' | 'open';
interface PhishingResponse { title: string; explanation: string; takeaway: string; tone: 'hint' | 'found' | 'trap' }
interface PhishingScenario {
  id: string; medium: 'sms' | 'email'; title: string; prompt: string; sender: string; subject: string;
  message: string; urgency: string; url: string; ending: string;
  responses: Record<PhishingAction, PhishingResponse>;
}
export const phishingScenarios: PhishingScenario[] = [
  {
    id: 'delivery', medium: 'sms', title: 'この不在通知、信じていい？', prompt: '荷物を待っているときに届いた一通。怪しいと思う部分を押してみてください。',
    sender: '090-XXXX-XXXX', subject: '日本郵便を名乗るSMS', message: '【日本郵便】\nお荷物をお届けできませんでした。', urgency: '本日中に再配達のお手続きをお願いします。', url: 'https://japanpost-delivery.test', ending: '再配達の確認費用：100円',
    responses: {
      sender: { title: '番号だけでは、まだ分かりません。', explanation: '知らない番号は立ち止まるきっかけ。ただ、表示された番号だけでは本物かどうかを判断できません。', takeaway: '次は、本文やURLも確かめてみましょう。', tone: 'hint' },
      urgency: { title: '急がせる言葉に、気づきました。', explanation: '「本日中に」と焦らせ、確認する前に操作させる手口があります。期限のある連絡がすべて詐欺という意味ではありません。', takeaway: 'そのまま進まず、不在票や公式アプリで確認。', tone: 'found' },
      url: { title: '怪しいURLに、気づけました。', explanation: '「japanpost」と書かれていても、日本郵便の公式サイトとは別です。この見本の.testは説明用のドメインです。', takeaway: '見慣れた名前だけで信じず、普段の公式の入口から。', tone: 'found' },
      judge: { title: '正解。この例はフィッシングです。', explanation: '再配達の少額料金を口実に、偽の支払い画面へ誘導するケースです。会社名や金額の小ささで信用しないことが大切です。', takeaway: '届いたリンクを使わず、不在票や公式アプリで確認。', tone: 'found' },
      open: { title: 'これは、詐欺の誘導です。', explanation: 'この先にあるのは、カード情報を入力させる偽の支払い画面。少額の再配達料金は、その入口です。', takeaway: '開いても、入力せず閉じる。公式の入口で確かめる。', tone: 'trap' },
    },
  },
  {
    id: 'invoice', medium: 'email', title: 'この請求書、いつもの取引先？', prompt: '取引先の名前で、請求書が届きました。見覚えのある名前なら、そのまま開いて大丈夫でしょうか。',
    sender: '青葉商事 経理 <billing@aoba-support.test>', subject: '今月の請求書をご確認ください', message: 'いつもお世話になっております。\n今月の請求書を共有いたします。', urgency: '閲覧には、普段お使いのメールのパスワードでログインしてください。', url: 'https://aoba.example/invoice', ending: 'お手数ですが、ご確認をお願いいたします。',
    responses: {
      sender: { title: '表示名と、アドレスを分けて確認。', explanation: '見覚えのある会社名でも、差出人の表示名は自由に付けられます。予定のない請求なら、以前から知っている連絡先で確かめます。', takeaway: 'このメールへの返信だけで確認を済ませない。', tone: 'found' },
      urgency: { title: 'メールのパスワードを求めています。', explanation: '請求書を見るために、別サービスのパスワードを入力させようとしています。見慣れない画面には入力しません。', takeaway: 'いつもの請求確認の方法と違うときは、取引先へ確認。', tone: 'found' },
      url: { title: '表示と、実際の行き先が違います。', explanation: '表示は aoba.example/invoice。でも、この例で隠されている行き先は account-check.test/login です。リンクの文字と行き先は別に設定できます。', takeaway: '見えている文字だけを信じず、既知の連絡先で確認。', tone: 'found' },
      judge: { title: '正解。この例はフィッシングです。', explanation: '請求書を口実に、メールのパスワードを入力させる手口です。見覚えのある会社名でも、予定や普段のやり取りと照らして確かめます。', takeaway: 'パスワードを入力する前に、取引先へ別の経路で確認。', tone: 'found' },
      open: { title: 'これは、詐欺の誘導です。', explanation: 'この先にあるのは、メールのパスワードを盗む偽のログイン画面。請求書の表示は、その口実でした。', takeaway: '入力せず閉じて、以前から知っている担当者へ確認。', tone: 'trap' },
    },
  },
  {
    id: 'account', medium: 'sms', title: '利用停止の通知、すぐに手続きする？', prompt: '普段使う通販サイトは kurashi-shop.example。「アカウントを停止する」と通知が届きました。',
    sender: 'KURASHI', subject: '通販サービスを名乗るSMS', message: '【KURASHI】\nお客様のお支払い情報を確認できません。', urgency: '30分以内に確認しない場合、アカウントを停止します。', url: 'https://kurashi-sh0p.example', ending: 'ログイン後、SMSで届く認証コードを入力してください。',
    responses: {
      sender: { title: '名前が表示されても、本物とは限りません。', explanation: 'サービス名を名乗る通知でも、正規の連絡と決めつけないこと。公式アプリに同じ案内があるか確かめます。', takeaway: '送信者の名前だけで判断せず、本文とURLも確認。', tone: 'hint' },
      urgency: { title: '短い期限で、焦らせています。', explanation: '「30分」「利用停止」で急がせ、いつもなら立ち止まる操作へ誘導しています。まず届いたメッセージから離れましょう。', takeaway: 'リンクから進まず、普段のアプリで利用状況を確認。', tone: 'found' },
      url: { title: '小文字の「o」が、数字の「0」に。', explanation: '普段のURLを kurashi-shop.example とする例です。届いた文字は kurashi-sh0p.example。一文字を置き換えた別のURLです。', takeaway: '見分ける自信だけに頼らず、登録済みの入口から開く。', tone: 'found' },
      judge: { title: '正解。この例はフィッシングです。', explanation: '利用停止を口実に、パスワードと認証コードを入力させるケースです。本物のサービスからコードが届いても、開いた画面が本物とは限りません。', takeaway: '認証コードも渡さず、公式アプリで確かめる。', tone: 'found' },
      open: { title: 'これは、詐欺の誘導です。', explanation: 'この先は、パスワードと認証コードを盗む偽画面です。コードまで渡すと、時間内に使われてログインされるおそれがあります。', takeaway: '入力せず閉じる。覚えのないログイン承認も許可しない。', tone: 'trap' },
    },
  },
];
