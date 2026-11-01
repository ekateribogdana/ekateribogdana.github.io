// Занавес между страницами сайта: перехватывает внутренние ссылки, закрывает страницу и открывает следующую
(function () {
  var d = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var vt = document.createElement('div');
  vt.id = 'vt';
  vt.setAttribute('aria-hidden', 'true');
  vt.innerHTML = '<span><i></i>Е. Богданова</span>';
  d.appendChild(vt);

  function reveal() {
    d.classList.remove('vt-out');
    d.classList.add('vt-hold');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      d.classList.remove('vt-hold');
      d.classList.add('vt-in');
      setTimeout(function () { d.classList.remove('vt-in'); }, 900);
    }); });
  }

  var came = false;
  try { came = sessionStorage.getItem('vt') === '1'; sessionStorage.removeItem('vt'); } catch (e) {}
  if (came) {
    d.classList.add('vt-hold');
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(reveal, 150); });
    else setTimeout(reveal, 150);
  }

  // назад из кеша браузера: страница вернулась закрытой — открываем
  addEventListener('pageshow', function (e) { if (e.persisted && d.classList.contains('vt-out')) reveal(); });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    if (/\.(pdf|jpe?g|png|webp|mp4|zip|txt|xml)$/i.test(u.pathname)) return;
    e.preventDefault();
    try { sessionStorage.setItem('vt', '1'); } catch (err) {}
    d.classList.add('vt-out');
    setTimeout(function () { location.href = u.href; }, 650);
  });
})();
