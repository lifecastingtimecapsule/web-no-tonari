// 変更履歴: 2026-11-09 類似した偽リンク問題を、URLの構造・添付PDFのQR・連携権限の三種類へ改訂。
// 役割: 教材の画面・判断材料・解説を定義。URLは予約ドメインで、通信・入力・権限付与はしない。
export type PhishingAction = 'sender' | 'urgency' | 'url' | 'judge' | 'open';
interface PhishingResponse { title: string; explanation: string; takeaway: string; tone: 'hint' | 'found' | 'trap' }
interface PhishingScenario {
  id: string; medium: 'sms' | 'email' | 'permission'; title: string; prompt: string; sender: string; subject: string;
  message: string; urgency: string; url: string; ending: string;
  actionLabel: string; hint: string; simulation: string;
  attachment?: { name: string; heading: string; instruction: string };
  responses: Record<PhishingAction, PhishingResponse>;
}
export const phishingScenarios: PhishingScenario[] = [
  {
    id: 'delivery', medium: 'sms', title: '見慣れた文字、どこまでが公式？',
    prompt: '荷物を待っている日に届いた通知。日本郵便の公式サイトは post.japanpost.jp です。届いたURLと比べてみてください。',
    sender: '090-XXXX-XXXX', subject: '日本郵便を名乗るSMS',
    message: '【日本郵便】\nお荷物のお届けについてご案内いたします。',
    urgency: '配送状況と受け取り方法をご確認ください。',
    url: 'https://post.japanpost.jp.parcel-support.test/delivery', ending: '配達状況の反映に時間がかかる場合があります。',
    actionLabel: 'リンクを開く', hint: '番号・本文・URLを押して確かめられます。',
    simulation: '実際のサイトは開いていません。リンクを押しただけで情報が盗まれた、という意味ではありません。',
    responses: {
      sender: { title: '番号だけでは、決められません。', explanation: '知らない番号は確認のきっかけになりますが、それだけで本物・偽物を決める材料にはなりません。', takeaway: '公式サイトのURLと、届いたURLを比べてみましょう。', tone: 'hint' },
      urgency: { title: '自然な文章でも、確認は必要です。', explanation: 'この通知には不自然な日本語や強い催促がありません。文章が自然だから安全、とは判断できません。', takeaway: '文章の違和感だけに頼らず、行き先も確認。', tone: 'hint' },
      url: { title: '公式の名前は、先頭にあるだけ。', explanation: 'post.japanpost.jp の後ろに .parcel-support.test が続いています。このURLの行き先は parcel-support.test 側で、日本郵便の post.japanpost.jp とは別です。', takeaway: '会社名が含まれているかではなく、行き先全体を確認。', tone: 'found' },
      judge: { title: '正解。公式とは別の行き先です。', explanation: '公式サイト名を長いURLの先頭に入れ、見慣れた文字で信用させる例です。急がせる言葉や誤字がなくても、偽サイトへ誘導できます。', takeaway: '通知から進まず、不在票や普段の公式の入口で確認。', tone: 'found' },
      open: { title: 'その先は、偽の配送確認画面です。', explanation: 'この例では、配送先の確認を装って氏名・住所などを入力させます。URLの先頭だけを見て進むと、公式の画面だと思い込むおそれがあります。', takeaway: '入力せず閉じ、不在票や公式アプリから確認。', tone: 'trap' },
    },
  },
  {
    id: 'invoice', medium: 'email', title: '本文にリンクがなければ、大丈夫？',
    prompt: '見積もりを依頼していた相手からPDFが届きました。本文だけで判断せず、添付のプレビューも確認してみてください。',
    sender: '青葉商事 営業部 <sales@aoba.example>', subject: 'Re: お見積もりの件',
    message: '先ほどはありがとうございました。\nご依頼の見積書を添付いたします。',
    urgency: '詳細は添付のPDFからご確認ください。', url: 'https://document-session.test/signin',
    ending: 'ご不明な点がございましたらお知らせください。',
    attachment: { name: 'お見積書.pdf', heading: '見積書の閲覧', instruction: 'スマートフォンでQRコードを読み取り、会社のメールアカウントで本人確認を行ってください。' },
    actionLabel: 'QRコードの先へ進む', hint: '差出人・本文・添付PDFのQRを確認できます。',
    simulation: 'ファイルのダウンロードやQRの読み取りは行いません。PDFを開くだけで感染する、という意味ではありません。',
    responses: {
      sender: { title: '知っている相手でも、内容を確認。', explanation: 'この例は取引先のメールアカウントが乗っ取られた設定です。いつものアドレスや過去の件名が使われることもあり、差出人だけでは判断できません。', takeaway: '予定どおりの連絡でも、普段と違う手順には立ち止まる。', tone: 'hint' },
      urgency: { title: '確認する場所は、添付の中にも。', explanation: 'メール本文にはURLもパスワードの要求もありません。添付資料の中に、別のサイトへの入口を置く手口があります。', takeaway: '「本文に怪しいリンクがない」で確認を終えない。', tone: 'hint' },
      url: { title: '見積書のはずが、メールへのログインに。', explanation: 'このQRの行き先は document-session.test/signin という設定です。見積書を見るために、会社のメールの認証情報を別の画面で求めています。QRの形やPDF形式だけでは安全と判断できません。', takeaway: '読み取ってそのまま進まず、既知の連絡先で閲覧方法を確認。', tone: 'found' },
      judge: { title: '正解。入口は添付PDFの中です。', explanation: 'この例では、PDFのQRから偽のメールログイン画面へ誘導します。見積書を確認するという自然な流れを利用して、パスワードを入力させる手口です。', takeaway: '本文・差出人だけでなく、添付の中で求められる操作も確認。', tone: 'found' },
      open: { title: 'その先は、偽のログイン画面です。', explanation: '見積書を読むつもりが、会社のメールのパスワードを渡す入口になっています。PDFやQRコード自体が危険なのではなく、その先で何をさせるかがポイントです。', takeaway: '入力せず閉じ、普段から使っている電話などで相手に確認。', tone: 'trap' },
    },
  },
  {
    id: 'account', medium: 'permission', title: 'パスワード不要なら、許可していい？',
    prompt: '共有された資料を読もうとすると、アプリ連携の画面へ。正規のメールサービス上の画面という設定です。何を許可するのか確認してください。',
    sender: '共有資料ビューアー', subject: 'アプリへのアクセス許可',
    message: 'このアプリが、あなたのアカウントへのアクセスを求めています。',
    urgency: 'すべてのメールの閲覧\nあなたとしてメールを送信',
    url: 'https://accounts.workmail.example/consent', ending: '提供元：Document Tools',
    actionLabel: '許可して進む', hint: 'アプリ名・要求する権限・画面のURLを確認できます。',
    simulation: '実際のアカウント連携や権限の付与は行っていません。画面は教材用の見本です。',
    responses: {
      sender: { title: 'アプリ名は、用途を保証しません。', explanation: '「共有資料ビューアー」と名乗っていても、メールサービスの公式アプリとは限りません。提供元を信頼できるか、何を許可するかを分けて確認します。', takeaway: '資料を読むためのアプリが、どんな権限を求めているか確認。', tone: 'hint' },
      urgency: { title: '資料の閲覧に、メールの送信まで？', explanation: 'このアプリは資料を表示するという説明なのに、全メールの閲覧と、あなたとして送信する権限を求めています。目的に対して広すぎる権限は、許可を止めて確認する理由になります。', takeaway: '「許可」は内容の確認だけでなく、操作する権限を渡すこと。', tone: 'found' },
      url: { title: '正規の画面でも、相手は別のアプリ。', explanation: 'この例の workmail.example は正規のメールサービスという設定です。ただし、その画面で権限を求めているアプリまで、安全だと保証されるわけではありません。', takeaway: 'URLの確認に加えて、許可する相手と権限を確認。', tone: 'hint' },
      judge: { title: '正解。狙いはパスワードではなく権限。', explanation: '不正なアプリへの連携を承認させる「同意フィッシング」の例です。正規の認可画面でも、許可した範囲の情報や操作をアプリに渡すことになります。', takeaway: '用途に合わない権限は許可せず、社内の管理者に確認。', tone: 'found' },
      open: { title: 'メールを読む・送る権限を渡すところでした。', explanation: 'この例で許可すると、不正なアプリがメールを読み、あなたとして送信できるようになります。パスワードを教えなくても起こり得る被害です。', takeaway: '実際に許可した場合は連携を取り消し、管理者へ連絡。', tone: 'trap' },
    },
  },
];
