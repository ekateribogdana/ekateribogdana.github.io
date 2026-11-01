// Направление перехода для transitions.css: «назад» — кнопка браузера или возврат на главную
addEventListener('pagereveal', e => {
  if (!e.viewTransition) return;
  const nav = window.navigation && navigation.activation;
  const toHome = location.pathname === '/' || location.pathname === '/index.html';
  if ((nav && nav.navigationType === 'traverse') || toHome) e.viewTransition.types.add('back');
});
