// 変更履歴: 2026-11-09 店舗の解説操作を、3問の選択と作り手の考えを読む操作へ置換。
// 役割: 回答を端末内の表示だけに反映する。採点・保存・外部送信はしない。

/** 選んだ案を示し、その場で解説を開く。JavaScriptなしでもdetailsから記事を読める。 */
function setupWebsiteDesignDemo(): void {
  const websiteDemo = document.querySelector<HTMLElement>('[data-website-demo]');
  if (!websiteDemo) return;
  websiteDemo.querySelectorAll<HTMLElement>('[data-design-question]').forEach(question => {
    const answer = question.querySelector<HTMLDetailsElement>('.design-answer')!;
    const feedback = question.querySelector<HTMLElement>('[data-choice-feedback]')!;
    const choices = question.querySelectorAll<HTMLButtonElement>('[data-design-choice]');
    choices.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        choices.forEach(choice => {
          const isSelected = choice === button;
          choice.setAttribute('aria-pressed', String(isSelected));
          choice.textContent = `${choice.dataset.designChoice}${isSelected ? 'を選択中' : 'を選ぶ'}`;
          choice.setAttribute('aria-label', `${question.querySelector('h3')!.textContent}：${choice.textContent}`);
        });
        answer.open = true;
        feedback.textContent = `${button.dataset.designChoice}を選びました。すぐ下に、私がこの目的で選ぶ案と理由を表示しました。`;
        // 縦積みの比較で解説が画面外になる場合だけ、固定ヘッダーの下へ読み始めを移す。
        const answerPosition = answer.getBoundingClientRect();
        if (answerPosition.top > window.innerHeight - 120 || answerPosition.top < 100) {
          answer.querySelector('summary')!.focus({ preventScroll: true });
          answer.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
      });
    });
  });
}
setupWebsiteDesignDemo();
