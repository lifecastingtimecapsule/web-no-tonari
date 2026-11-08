// 変更履歴: 2026-11-08 トップ専用だったナビ操作を抽出し、全8ページで同じメニュー操作を提供。
/** モバイルナビを開閉し、Escapeとページ内リンクのフォーカスを扱う。 */
function setupNavigation(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!button || !nav) return;
  const closeMenu = (): void => {
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
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
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { closeMenu(); button.focus(); }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
}
setupNavigation();
