/* =========================================================
   AS Code — interactions. No dependencies.
   ========================================================= */
(function () {
  'use strict';
  var SPIN = 1;                 // globe auto-rotation speed (0 = still)
  var ACCENT = '#3DD6F5';       // globe dot colour
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion) SPIN = 0;

  /* ---------- 3D globe ---------- */
  var el = document.getElementById('globe');
  var visible = true;
  if (el) {
    var S = { yaw: -1.25, pitch: 0.62, vy: 0, vp: 0, drag: false, lx: 0, ly: 0 };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(el);
    }
    const ctx = el.getContext('2d');
      const N = 1300, pts = [];
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
        pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
      }
      const ll = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)]; };
      const london = ll(51.5, -0.13);
      const cities = [ll(23.8, 90.4), ll(48.86, 2.35), ll(52.52, 13.4), ll(52.37, 4.9), ll(53.35, -6.26), ll(40.42, -3.7), ll(59.33, 18.07), ll(41.9, 12.5)];
      const slerp = (a, b, t) => {
        const d = Math.max(-1, Math.min(1, a[0]*b[0] + a[1]*b[1] + a[2]*b[2])), w = Math.acos(d), s = Math.sin(w) || 1;
        const k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s;
        return [a[0]*k1 + b[0]*k2, a[1]*k1 + b[1]*k2, a[2]*k1 + b[2]*k2];
      };
      const loop = (ms) => {
        requestAnimationFrame(loop);
        if (!visible) return;
        const w = el.clientWidth, h = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (!w || !h) return;
        if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(h * dpr); }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const spin = SPIN;
        if (!S.drag) { S.yaw += 0.0016 * spin + S.vy; S.pitch += S.vp; S.vy *= 0.95; S.vp *= 0.92; }
        S.pitch = Math.max(-1.2, Math.min(1.2, S.pitch));
        const cy_ = Math.cos(S.yaw), sy_ = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
        const R = Math.min(w, h) * 0.34, cx = w / 2, cy = h / 2;
        const P = (v, s) => {
          s = s || 1;
          const x1 = (v[0] * cy_ + v[2] * sy_) * s, z1 = (-v[0] * sy_ + v[2] * cy_) * s, y1 = v[1] * s;
          const y2 = y1 * cp - z1 * sp, z2 = y1 * sp + z1 * cp;
          const f = 3 / (3 - z2);
          return [cx + x1 * R * f, cy - y2 * R * f, z2];
        };
        const accent = ACCENT;
        const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
        g.addColorStop(0, 'rgba(61,214,245,0.16)'); g.addColorStop(0.55, 'rgba(61,214,245,0.05)'); g.addColorStop(1, 'rgba(61,214,245,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        // orbit ring (behind + front)
        const ring = [];
        for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2; ring.push(P([Math.cos(a) * 1.32, Math.sin(a) * 0.3, Math.sin(a) * 1.32 * 0.95])); }
        ctx.lineWidth = 1;
        for (let i = 0; i < 120; i++) { const p = ring[i], q = ring[i + 1]; ctx.strokeStyle = p[2] > 0 ? 'rgba(61,214,245,0.35)' : 'rgba(61,214,245,0.1)'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
        // dots
        ctx.fillStyle = accent;
        for (let i = 0; i < N; i++) {
          const p = P(pts[i]);
          const a = p[2] > 0 ? 0.25 + p[2] * 0.7 : 0.06 + (p[2] + 1) * 0.08;
          const s = 0.7 + (p[2] + 1) * 0.65;
          ctx.globalAlpha = a; ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
        // arcs
        const t = ms / 1000;
        cities.forEach((c, ci) => {
          const seg = [];
          for (let i = 0; i <= 48; i++) { const u = i / 48, v = slerp(london, c, u); seg.push(P(v, 1 + Math.sin(Math.PI * u) * (ci === 0 ? 0.42 : 0.16))); }
          for (let i = 0; i < 48; i++) { const p = seg[i], q = seg[i + 1]; ctx.strokeStyle = p[2] > -0.1 ? 'rgba(255,181,71,0.75)' : 'rgba(255,181,71,0.12)'; ctx.lineWidth = ci === 0 ? 1.8 : 1.1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
          const k = Math.floor(((t * 0.35 + ci * 0.17) % 1) * 48), pp = seg[k];
          if (pp[2] > -0.1) { ctx.fillStyle = '#FFE2B0'; ctx.shadowColor = '#FFB547'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(pp[0], pp[1], 2.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
          const e = P(c);
          if (e[2] > -0.05) { ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(e[0], e[1], 3, 0, 7); ctx.fill(); }
        });
        const L = P(london);
        if (L[2] > -0.05) {
          const pr = 6 + ((t * 1.2) % 1) * 16;
          ctx.strokeStyle = 'rgba(255,181,71,' + (1 - ((t * 1.2) % 1)) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(L[0], L[1], pr, 0, 7); ctx.stroke();
          ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(L[0], L[1], 4, 0, 7); ctx.fill();
          ctx.font = '600 13px Inter, sans-serif'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('London HQ', L[0] + 10, L[1] - 8);
        }
        const D = P(cities[0]);
        if (D[2] > -0.05) { ctx.font = '600 13px Inter, sans-serif'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Dhaka delivery', D[0] + 10, D[1] - 8); }
        // satellites on ring
        for (let s = 0; s < 3; s++) { const i = Math.floor(((t * 0.08 + s / 3) % 1) * 120), p = ring[i]; ctx.fillStyle = p[2] > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(p[0], p[1], p[2] > 0 ? 3.2 : 2, 0, 7); ctx.fill(); }
      };
    requestAnimationFrame(loop);

    el.addEventListener('pointerdown', function (e) {
      S.drag = true; S.lx = e.clientX; S.ly = e.clientY; S.vy = 0; S.vp = 0;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', function (e) {
      if (!S.drag) return;
      var dx = e.clientX - S.lx, dy = e.clientY - S.ly;
      S.lx = e.clientX; S.ly = e.clientY;
      S.vy = -dx * 0.006; S.vp = dy * 0.004; S.yaw += S.vy; S.pitch += S.vp;
    });
    var release = function () { if (!S.drag) return; S.drag = false; el.style.cursor = 'grab'; };
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { el.addEventListener(t, release); });
  }

  /* ---------- Hero floating chips: mouse parallax ---------- */
  var hero = document.querySelector('.hero');
  var chips = document.querySelectorAll('.chip[data-depth]');
  if (hero && finePointer && !reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      chips.forEach(function (c) {
        var d = Number(c.getAttribute('data-depth'));
        c.style.transform = 'translate(' + (-px * d).toFixed(1) + 'px,' + (-py * d).toFixed(1) + 'px)';
      });
    });
  }

  /* ---------- Rotating headline word ---------- */
  var rot = document.getElementById('rotator');
  if (rot && !reduceMotion) {
    var words = ['Faster.', 'Safer.', 'Smarter.', 'Together.'], wi = 0, ci = words[0].length, del = true;
    var tick = function () {
      var w = words[wi];
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; } }
      else { ci++; if (ci >= words[wi].length) { del = true; rot.textContent = words[wi]; return setTimeout(tick, 2200); } }
      rot.textContent = words[wi].slice(0, Math.max(ci, 0)) || ' ';
      setTimeout(tick, del ? 45 : 85);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- 3D tilt + spotlight cards ---------- */
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (!finePointer || reduceMotion) return;
      var px = x / r.width - 0.5, py = y / r.height - 0.5;
      card.style.transform = 'rotateX(' + (-py * 12).toFixed(2) + 'deg) rotateY(' + (px * 14).toFixed(2) + 'deg) translateZ(10px)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Process cube (auto-plays until a step is clicked) ---------- */
  var cube = document.getElementById('cube');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var current = 0, auto = !reduceMotion, timer = null;
  function setStep(i, fromAuto) {
    current = i;
    steps.forEach(function (b, k) {
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      b.classList.remove('auto');
    });
    if (fromAuto && auto) { void steps[i].offsetWidth; steps[i].classList.add('auto'); }
    if (cube) cube.style.transform = 'rotateX(-18deg) rotateY(' + (-20 - 90 * i) + 'deg)';
  }
  steps.forEach(function (b, i) {
    b.addEventListener('click', function () { auto = false; clearInterval(timer); setStep(i, false); });
  });
  var processSec = document.getElementById('process');
  if (processSec && auto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      clearInterval(timer);
      if (e[0].isIntersecting && auto) {
        setStep(current, true);
        timer = setInterval(function () { setStep((current + 1) % steps.length, true); }, 4500);
      }
    }, { threshold: 0.35 }).observe(processSec);
  }

  /* ---------- Scroll reveal + count-up ---------- */
  function countUp(node) {
    var target = Number(node.getAttribute('data-count')), t0 = null, dur = 1400;
    if (reduceMotion) { node.textContent = target; return; }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target, siblings = n.parentElement ? n.parentElement.querySelectorAll(':scope > .reveal') : [];
        var idx = Array.prototype.indexOf.call(siblings, n);
        n.style.transitionDelay = (Math.max(idx, 0) * 90) + 'ms';
        n.classList.add('in');
        n.querySelectorAll('[data-count]').forEach(countUp);
        setTimeout(function () { n.style.transitionDelay = ''; }, 1200);
        io.unobserve(n);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (n) { io.observe(n); });
  } else {
    reveals.forEach(function (n) { n.classList.add('in'); });
  }

  /* ---------- Nav, progress bar, back-to-top ---------- */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress');
  var toTop = document.getElementById('toTop');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if (nav) nav.classList.toggle('scrolled', y > 20);
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', y > 800);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menuBtn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ---------- Cursor glow ---------- */
  var glow = document.getElementById('cursorGlow');
  if (glow && finePointer && !reduceMotion) {
    window.addEventListener('mousemove', function (e) {
      document.body.classList.add('has-pointer');
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  /* ---------- Office clocks ---------- */
  function fmt(tz) {
    try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date()); }
    catch (_) { return '--:--'; }
  }
  var cl = document.getElementById('clockLondon'), cd = document.getElementById('clockDhaka');
  function clocks() { if (cl) cl.textContent = fmt('Europe/London'); if (cd) cd.textContent = fmt('Asia/Dhaka'); }
  clocks(); setInterval(clocks, 20000);

  /* ---------- Forms (email-based; swap for your backend or form service) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var needs = d.getAll('need').join(', ') || 'Not specified';
      var body = 'Name: ' + d.get('name') + '\nEmail: ' + d.get('email') + '\nNeeds: ' + needs + '\n\n' + (d.get('message') || '');
      window.location.href = 'mailto:ascodeuk@gmail.com?subject=' + encodeURIComponent('New enquiry from ' + d.get('name')) + '&body=' + encodeURIComponent(body);
      var note = document.getElementById('formNote');
      if (note) note.textContent = 'Opening your email app… Thanks! We reply within 1 business day.';
    });
  }
  var nl = document.getElementById('newsletter');
  if (nl) {
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('nl-email');
      if (!nl.reportValidity()) return;
      window.location.href = 'mailto:ascodeuk@gmail.com?subject=' + encodeURIComponent('Newsletter signup') + '&body=' + encodeURIComponent('Please add ' + email.value + ' to the AS Code newsletter.');
    });
  }
})();
