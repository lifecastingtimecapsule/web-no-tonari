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

// 変更履歴: 2026-11-11 業種に近い見積依頼を選ぶだけで、共有データの要点と返信案へ切り替える。
import {inquirySamples,quoteSummary} from '../data/quote-samples';
const inquirySelect = document.querySelector<HTMLSelectElement>('[data-inquiry]');
const inquiryOutput = document.querySelector<HTMLElement>('[data-inquiry-output]');
/** 架空の依頼と整理済みの見本を同時更新する。金額・納期の確約や外部送信は行わない。 */
function showQuoteSample():void {
  if(!inquirySelect||!inquiryOutput)return;
  const selectedInquiry=inquirySamples[inquirySelect.value];
  if(!selectedInquiry)return;
  const inquiryText=document.querySelector('[data-inquiry-text]');
  if(inquiryText)inquiryText.textContent=selectedInquiry.message;
  inquiryOutput.replaceChildren();
  for(const [label,value] of quoteSummary(selectedInquiry)){
    const heading=document.createElement('strong');heading.textContent=label;
    const paragraph=document.createElement('p');paragraph.textContent=value;
    inquiryOutput.append(heading,paragraph);
  }
}
inquirySelect?.addEventListener('change',showQuoteSample);
