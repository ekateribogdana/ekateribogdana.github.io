// Looma · слой эффектов: сквозная нить по прокрутке, маска для заголовков, счётчики, шаги теста, автопоказ метафоры,
// наклон экранов, магнитная кнопка и свечение за курсором. Без JS и при reduced-motion страница остаётся статичной
(function () {
  var d = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  d.classList.add('fx');
  var fine = matchMedia('(pointer: fine)').matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // ---------- обложка: факты по очереди, параллакс фото ----------
  $$('.hero-facts > div').forEach(function (el, i) { el.style.setProperty('--i', i); });
  var art = document.querySelector('.hero-f .art');
  if (art) {
    art.addEventListener('animationend', function () { art.classList.add('fx-par'); });
    var hero = art.parentElement;
    var px = 0, py = 0;
    if (fine) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - .5) * -14; py = ((e.clientY - r.top) / r.height - .5) * -10;
      paintArt();
    });
    function paintArt() { if (art.classList.contains('fx-par')) art.style.transform = 'translate3d(' + px + 'px,' + (py + scrollY * .12) + 'px,0) scale(1.04)'; }
    addEventListener('scroll', function () { if (scrollY < innerHeight * 1.2) paintArt(); }, { passive: true });
  }

  // ---------- заголовки: слова под маской ----------
  $$('.shead h2, .s12-sub h3, .sec > .h2.tl').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/([ \t\n\r]+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^[ \t\n\r]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), s = document.createElement('span');
            w.className = 'fx-w'; s.textContent = p; s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
    h.setAttribute('aria-label', h.textContent);
    if (!h.closest('.rv')) h.classList.add('fx-split', 'rv');
  });

  // ---------- индексы для ступенчатого появления ----------
  $$('.r5-bars li').forEach(function (li, i) { li.querySelector('i') && li.querySelector('i').style.setProperty('--i', i); });
  $$('.pstep .col').forEach(function (c) { $$('li', c).forEach(function (li, i) { li.style.setProperty('--i', i); }); });

  // ---------- наблюдатель: .in для новых .rv, счётчики, 9 → 4 ----------
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target; t.classList.add('in'); io.unobserve(t);
      if (t.matches('[data-fx-count]')) count(t);
      if (t.matches('.pstep .col.lm')) setTimeout(function () { t.parentElement.classList.add('fx-done'); }, 1700);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.fx-split').forEach(function (el) { io.observe(el); });
  $$('.pstep .col.lm').forEach(function (el) { io.observe(el); });

  // счётчики: «5», «~6», «5/5», «4»
  $$('.s25 .stats dd, .s25 .sum .n, .s26 .stat .big, .r5-n').forEach(function (el) {
    var m = el.textContent.match(/^(\D*)(\d+)(.*)$/); if (!m) return;
    el.dataset.fxCount = m[2]; el.dataset.fxPre = m[1]; el.dataset.fxPost = m[3];
    el.textContent = m[1] + '0' + m[3];
    io.observe(el);
  });
  function count(el) {
    var to = +el.dataset.fxCount, pre = el.dataset.fxPre, post = el.dataset.fxPost, t0 = null, dur = 900 + to * 60;
    function step(t) {
      if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(to * k) + post;
      if (k < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 250);
  }

  // ---------- метафора: кадр закреплён, нить протягивается и зажигает точки по прокрутке (широкие экраны) ----------
  var mc = document.querySelector('.mc');
  if (mc) {
    var mpin = mc.querySelector('.mc-pin'), mpts = $$('.mc-pt', mc), wideM = matchMedia('(min-width: 1001px)');
    function mcLayout() {
      if (wideM.matches) { mc.classList.add('mc-sticky'); mc.style.height = (mpin.offsetHeight + innerHeight * 1.2) + 'px'; }
      else { mc.classList.remove('mc-sticky'); mc.style.height = ''; mc.style.setProperty('--mc-p', 1); mpts.forEach(function (li) { li.classList.add('on'); }); }
    }
    function mcScroll() {
      if (!wideM.matches) return;
      var r = mc.getBoundingClientRect(), run = mc.offsetHeight - mpin.offsetHeight;
      var p = Math.min(1, Math.max(0, (-r.top + (innerHeight - mpin.offsetHeight) / 2) / Math.max(1, run)));
      mc.style.setProperty('--mc-p', p.toFixed(3));
      mpts.forEach(function (li, i) { li.classList.toggle('on', p >= i * .5 - .001); });
    }
    mcLayout(); mcScroll();
    addEventListener('scroll', mcScroll, { passive: true });
    addEventListener('resize', function () { mcLayout(); mcScroll(); });
  }

  // ---------- финал: живой прототип грузится, когда блок близко к экрану (только широкие экраны) ----------
  var live = document.querySelector('.live'), fr = live && live.querySelector('.live-fr');
  if (fr && matchMedia('(min-width: 1001px)').matches) {
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      fr.addEventListener('load', function () { setTimeout(function () { live.classList.add('ready'); fr.removeAttribute('tabindex'); }, 400); });
      fr.src = fr.dataset.src;
    }, { rootMargin: '600px 0px' }).observe(live);
  }

  // ---------- наклон экранов и магнитная кнопка ----------
  if (fine) {
    $$('.h7-shot, .s08-shot, .s15-pair img, .ba .scr, .a4-ph').forEach(function (el) {
      el.classList.add('fx-tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.classList.add('fx-move'); el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('fx-move'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
    var mb = document.querySelector('.s28 .b.main');
    if (mb) {
      var zone = mb.closest('.acts') || mb.parentElement;
      zone.addEventListener('pointermove', function (e) {
        var r = mb.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        mb.style.setProperty('--mx', (x * .18).toFixed(1) + 'px'); mb.style.setProperty('--my', (y * .3).toFixed(1) + 'px');
      });
      zone.addEventListener('pointerleave', function () { mb.style.setProperty('--mx', '0px'); mb.style.setProperty('--my', '0px'); });
    }
    // свечение за курсором
    var g = document.createElement('div'); g.className = 'fx-glow'; g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
    var gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, raf = 0;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; g.classList.add('on'); if (!raf) raf = requestAnimationFrame(glow); }, { passive: true });
    document.addEventListener('pointerleave', function () { g.classList.remove('on'); });
    function glow() { gx += (tx - gx) * .14; gy += (ty - gy) * .14; g.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)'; raf = Math.abs(tx - gx) + Math.abs(ty - gy) > .5 ? requestAnimationFrame(glow) : 0; }
  }

  // ---------- сквозная нить ----------
  var heads = $$('main .shead').filter(function (h) { return h.offsetParent !== null; });
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'fx-thread'); svg.setAttribute('aria-hidden', 'true');
  var base = document.createElementNS(NS, 'path'); base.setAttribute('class', 'base');
  var lit = document.createElementNS(NS, 'path'); lit.setAttribute('class', 'lit');
  var dot = document.createElementNS(NS, 'circle'); dot.setAttribute('class', 'head'); dot.setAttribute('r', '3.5');
  svg.appendChild(base); svg.appendChild(lit); svg.appendChild(dot);
  var bar = document.createElement('div'); bar.className = 'fx-bar'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(svg); document.body.appendChild(bar);

  var samples = [], total = 0, anchors = [], knots = [], headY = [], useThread = false, ticking = false;

  // положение в документе без учёта transform (заголовки до появления сдвинуты анимацией)
  function pagePos(el) { var r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY }; }

  function build() {
    d.classList.add('fx-measure'); void d.offsetHeight;
    try { buildIn(); } finally { d.classList.remove('fx-measure'); }
  }
  function buildIn() {
    var rules = heads.map(function (h) { return h.querySelector('.rule'); }).filter(Boolean);
    var gutter = rules.length ? pagePos(rules[0]).x - scrollX * 0 : 0;
    useThread = gutter >= 44 && rules.length > 1;
    svg.style.display = useThread ? '' : 'none'; bar.style.display = useThread ? 'none' : '';
    knots.forEach(function (k) { k.c.remove(); k.b.remove(); }); knots = [];
    headY = heads.map(function (h) { var r = h.querySelector('.rule'); return pagePos(r || h).y; });
    if (!useThread) return;
    var hero = document.querySelector('.hero-f');
    var startY = hero ? pagePos(hero).y + hero.offsetHeight * .55 : 0;
    anchors = rules.map(function (r) { var q = pagePos(r); return { x: q.x, y: q.y }; });
    var endEl = document.querySelector('.s28'); var endY = endEl ? pagePos(endEl).y + 80 : anchors[anchors.length - 1].y + 400;
    var xg = Math.max(14, gutter * .42);
    // одна непрерывная линия без разрывов: пунктир, которым рисуется нить, не сбивается
    var dStr = 'M' + xg + ' ' + startY, prevY = startY;
    anchors.concat([{ y: endY }]).forEach(function (a, i) {
      var dy = a.y - prevY, sway = (i % 2 ? 1 : -1) * Math.min(14, xg * .5);
      dStr += ' C' + (xg + sway * .3) + ' ' + (prevY + dy * .3) + ' ' + (xg + sway) + ' ' + (a.y - dy * .3) + ' ' + xg + ' ' + a.y;
      prevY = a.y;
    });
    var H = document.documentElement.scrollHeight;
    svg.setAttribute('height', H); svg.style.height = H + 'px';
    base.setAttribute('d', dStr); lit.setAttribute('d', dStr);
    total = lit.getTotalLength();
    lit.style.strokeDasharray = total + ' ' + total;
    samples = [];
    for (var L = 0; L <= total; L += 6) { var pt = lit.getPointAtLength(L); samples.push([L, pt.y]); }
    // отводы к линиям заголовков — отдельные отрезки, прорисовываются, когда нить до них дошла
    anchors.forEach(function (a) {
      var br = document.createElementNS(NS, 'path'); br.setAttribute('class', 'br');
      br.setAttribute('d', 'M' + xg + ' ' + a.y + ' L' + (a.x + 1) + ' ' + a.y); br.setAttribute('pathLength', '1');
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('class', 'knot'); c.setAttribute('cx', xg); c.setAttribute('cy', a.y); c.setAttribute('r', 3);
      svg.insertBefore(br, dot); svg.insertBefore(c, dot); knots.push({ c: c, b: br });
    });
  }

  function update() {
    ticking = false;
    var target = scrollY + innerHeight * .62;
    heads.forEach(function (h, i) { h.classList.toggle('fx-lit', headY[i] < target); });
    if (!useThread) { var max = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0); return; }
    // наибольшая длина пути, точка которой выше цели (путь монотонно идёт вниз)
    var lo = 0, hi = samples.length - 1, best = 0;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (samples[mid][1] <= target) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    var L = samples.length ? samples[best][0] : 0;
    lit.style.strokeDashoffset = (total - L).toFixed(1);
    var p = lit.getPointAtLength(L); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    knots.forEach(function (k, i) { var on = anchors[i].y < target; k.c.classList.toggle('on', on); k.b.classList.toggle('on', on); k.c.setAttribute('r', on ? 4 : 3); });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  var rb; function rebuild() { clearTimeout(rb); rb = setTimeout(function () { build(); update(); }, 120); }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', rebuild);
  addEventListener('load', rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.querySelector('main') || document.body);
  build(); update();
})();
