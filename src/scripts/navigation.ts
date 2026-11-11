// 変更履歴: 2026-11-11 サービス展開、外側クリック、右下パネル内のフォーカス循環を追加。
// 変更履歴: 2026-11-08 トップ専用だったナビ操作を抽出し、全8ページで同じメニュー操作を提供。
/** モバイルナビを開閉し、Escapeとページ内リンクのフォーカスを扱う。 */
function setupNavigation(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!button || !nav) return;
  const closeMenu = (): void => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'メニューを開く');
    document.body.classList.remove('menu-open');
    nav.querySelectorAll('details').forEach(details => { details.open = false; });
  };
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.setAttribute('aria-label', expanded ? 'メニューを開く' : 'メニューを閉じる');
    document.body.classList.toggle('menu-open', !expanded);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    closeMenu();
    const destination = new URL(link.href, location.href);
    if (destination.pathname === location.pathname && destination.hash) {
      const target = document.getElementById(destination.hash.slice(1));
      if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    }
  }));
  /** パネル外の操作で閉じ、クリック先の通常動作は妨げない。 */
  document.addEventListener('pointerdown', event => {
    if (event.target instanceof Node && !nav.contains(event.target) && !button.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && button.getAttribute('aria-expanded') === 'true') {
      const focusable = [button, ...Array.from(nav.querySelectorAll<HTMLElement>('a,summary')).filter(element => element.getClientRects().length > 0)];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === button) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); button.focus(); }
    }
    if (event.key === 'Escape') {
      if (button.getAttribute('aria-expanded') === 'true') { closeMenu(); button.focus(); }
      else {
        const expandedServices = nav.querySelector<HTMLDetailsElement>('details[open]');
        if (expandedServices) { expandedServices.open = false; expandedServices.querySelector<HTMLElement>('summary')?.focus(); }
      }
    }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
}
setupNavigation();
