// 変更履歴: 2026-11-09 ホームとサービス一覧で横送りを共用するため、既存処理を移管。
/** サービスを1件ずつ横送りし、スワイプ・キー操作・画面幅変更にも表示範囲を同期する。 */
function setupServiceCarousel(): void {
  const track = document.querySelector<HTMLElement>('[data-service-list]');
  const controls = document.querySelector<HTMLElement>('[data-service-controls]');
  const previousButton = document.querySelector<HTMLButtonElement>('[data-service-prev]');
  const nextButton = document.querySelector<HTMLButtonElement>('[data-service-next]');
  const position = document.querySelector<HTMLElement>('[data-service-position]');
  if (!track || !controls || !previousButton || !nextButton || !position) return;
  const cards = [...track.querySelectorAll<HTMLElement>('.service-row')];
  controls.hidden = false;
  let scrollTimer = 0;
  const updatePosition = (): void => {
    const bounds = track.getBoundingClientRect();
    const visibleCards = cards.map((card, index) => ({ index, bounds: card.getBoundingClientRect() }))
      .filter(card => card.bounds.left >= bounds.left - 4 && card.bounds.right <= bounds.right + 4);
    // スナップ位置と描画端の数pxの差を許容し、実質終端でボタンを無効化する。
    previousButton.disabled = track.scrollLeft <= 8;
    nextButton.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
    if (visibleCards.length) {
      const first = visibleCards[0].index + 1;
      const last = visibleCards[visibleCards.length - 1].index + 1;
      position.textContent = `${first === last ? first : `${first}〜${last}`} / ${cards.length}`;
    }
  };
  const move = (direction: number): void => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const distance = (cards[0]?.getBoundingClientRect().width ?? track.clientWidth) + gap;
    track.scrollBy({ left: distance * direction, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  track.addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = window.setTimeout(updatePosition, 120); }, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  });
  new ResizeObserver(updatePosition).observe(track);
  updatePosition();
}
setupServiceCarousel();
