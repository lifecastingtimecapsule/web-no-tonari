// 変更履歴: 2026-11-08 視線誘導、商品選択、文章整理、メール確認の学習用操作を追加。
// 役割: 架空サンプル内の表示だけを更新し、購入・生成・外部送信を行わない。
// 変更履歴: 2026-11-09 受注管理の教材へ変更したため、旧ECカートと色選択の処理を削除。
// 変更履歴: 2026-11-08 横向きタブで現在のサービスが画面外へ隠れないよう、横方向だけ表示位置を補正。
/** 現在のサービス名をタブ列の表示範囲に収め、サンプルへの縦スクロールは変えない。 */
function revealCurrentServiceTab(): void {
  const serviceTabs = document.querySelector<HTMLElement>('.service-tabs');
  const selectedTab = serviceTabs?.querySelector<HTMLElement>('[aria-current]');
  if (!serviceTabs || !selectedTab) return;
  const tabBounds = selectedTab.getBoundingClientRect();
  const listBounds = serviceTabs.getBoundingClientRect();
  if (tabBounds.right > listBounds.right) serviceTabs.scrollLeft += tabBounds.right - listBounds.right;
  else if (tabBounds.left < listBounds.left) serviceTabs.scrollLeft += tabBounds.left - listBounds.left;
}
revealCurrentServiceTab();
window.addEventListener('resize', revealCurrentServiceTab);

// 変更履歴: 2026-11-09 メールの解説を標準detailsへ変更したため、旧カウンター操作を削除。

const inquirySamples: Record<string, { message: string; category: string; action: string; reply: string }> = {
  update: { message: '来月から営業時間が10時〜18時になります。ホームページの案内を変更できますか？', category: '既存サイトの更新', action: '対象ページと変更開始日を確認する。', reply: '営業時間変更のご相談ですね。掲載ページのURLと、変更を反映したい日付を教えてください。' },
  renew: { message: '今のホームページがスマホで読みにくいです。内容も古いので作り直したいです。', category: 'サイトのリニューアル', action: '現在のURLと、残したい情報を確認する。', reply: 'スマホでの見やすさと掲載内容を一緒に確認します。現在のサイトURLと、特に気になっているページを教えてください。' },
  shop: { message: 'お店の商品をネットでも販売したいです。商品は10種類ほどで、発送は自分たちで行います。', category: 'ECショップの新規制作', action: '商品情報・配送方法・決済の希望を確認する。', reply: '10種類ほどの商品のオンライン販売ですね。商品一覧と、ご希望の決済・発送方法から整理しましょう。' },
};
const inquirySelect = document.querySelector<HTMLSelectElement>('[data-inquiry]');
const inquiryOutput = document.querySelector<HTMLElement>('[data-inquiry-output]');
inquirySelect?.addEventListener('change', () => {
  const inquiryText = document.querySelector('[data-inquiry-text]');
  if (inquiryText) inquiryText.textContent = inquirySamples[inquirySelect.value].message;
  if (inquiryOutput) inquiryOutput.textContent = '問い合わせを変更しました。「整理したサンプルを見る」を押してください。';
});
document.querySelector('[data-inquiry-organize]')?.addEventListener('click', () => {
  if (!inquirySelect || !inquiryOutput) return;
  const selectedInquiry = inquirySamples[inquirySelect.value];
  inquiryOutput.replaceChildren();
  for (const [label, value] of [['分類', selectedInquiry.category], ['次に確認すること', selectedInquiry.action], ['返信の下書き', selectedInquiry.reply]]) {
    const heading = document.createElement('strong'); heading.textContent = label;
    const paragraph = document.createElement('p'); paragraph.textContent = value;
    inquiryOutput.append(heading, paragraph);
  }
});
