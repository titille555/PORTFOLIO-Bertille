// Animations ported from olatoyan.com (GSAP + ScrollTrigger), same timings and easings.
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = () => gsap.utils.random(-1, 1);
const smooth = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };

// purple pointer + name tag used in three places
$$('[data-cursor]').forEach((el) => {
  el.innerHTML = `<div class="cursor"><svg width="22" height="24" viewBox="0 0 22 24"><path d="M2 1.5 L2 20 L7.2 15.4 L10.6 22.6 L14 21 L10.7 14 L18 13.6 Z" fill="#6741ed" stroke="white" stroke-width="1.6" stroke-linejoin="round"/></svg><span>${el.dataset.cursor}</span></div>`;
});

/* ---------- nav ---------- */
const pill = $('.pill');
const onScroll = () => pill.classList.toggle('scrolled', scrollY > 80);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

const menu = $('#site-menu'), menuBtn = $('.menu-btn');
const setMenu = (open) => {
  menu.classList.toggle('open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  $$('.menu-links a').forEach((a, i) => { a.style.transitionDelay = open ? `${80 + 50 * i}ms` : '0ms'; a.tabIndex = open ? 0 : -1; });
  (open ? $('.menu-close') : menuBtn).focus();
};
menuBtn.addEventListener('click', () => setMenu(true));
$('.menu-close').addEventListener('click', () => setMenu(false));
$$('.menu-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => e.key === 'Escape' && menu.classList.contains('open') && setMenu(false));

/* ---------- hero: rotating words, letter by letter ---------- */
(function rotator(el, hold = 2.6) {
  if (!el) return;
  const words = el.dataset.words.split('|');
  el.innerHTML = words.map((w) => `<span class="ghost" aria-hidden="true">${w}</span>`).join('') +
    '<span class="live" aria-hidden="true"></span>' +
    `<span class="sr-only">${words.map((w) => w.replace(/[.!?]$/, '')).join(', ')}</span>`;
  const live = $('.live', el);
  let i = 0;
  const next = () => { i = (i + 1) % words.length; show(); };
  function show() {
    const parts = words[i].split(' ');
    live.innerHTML = parts.map((w, k) =>
      `<span class="word">${[...(k < parts.length - 1 ? w + ' ' : w)].map((c) => `<span class="letter">${c}</span>`).join('')}</span>`).join('');
    const letters = $$('.letter', live);
    if (reduce) { gsap.set(letters, { opacity: 1 }); gsap.delayedCall(hold + 1, next); return; }
    gsap.timeline()
      .fromTo(letters,
        { opacity: 0, filter: 'blur(12px)', x: () => 70 * rnd(), y: () => 50 * rnd(), rotate: () => 30 * rnd() },
        { opacity: 1, filter: 'blur(0px)', x: 0, y: 0, rotate: 0, duration: 0.9, ease: 'power3.out', stagger: 0.035 })
      .to({}, { duration: hold })
      .to(letters, { opacity: 0, filter: 'blur(10px)', x: () => 40 * rnd(), y: () => 30 * rnd(), duration: 0.4, ease: 'power2.in', stagger: 0.015, onComplete: next });
  }
  show();
})($('.rotator'));

const mm = gsap.matchMedia();

if (!reduce && $('#top')) {
  /* ---------- hero: intro + shrink into a browser window ---------- */
  gsap.from('[data-hero-in]', { opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.2 });
  mm.add('(min-width: 768px)', () => {
    const card = $('.hero-card');
    if (card.offsetHeight > innerHeight + 8) return;
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#top', start: 'top top', end: '+=70%', pin: true, scrub: true } })
      .to(card, { scale: 0.84, borderRadius: 32 }, 0)
      .fromTo('.hero-chrome', { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1 }, 0);
  });
}

// created here so its pin is registered in page order (after hero, before the rows below it)
dataStory($('#methode'));

if (!reduce) {
  /* ---------- work: rows reveal ---------- */
  $$('[data-row]').forEach((row) => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 75%' } })
      .from($('[data-window]', row), { opacity: 0, y: 60, rotate: -2, scale: 1.03, duration: 0.9, ease: 'power3.out' })
      .from($('[data-row-copy]', row).children, { opacity: 0, y: 24, stagger: 0.07, duration: 0.7, ease: 'power3.out' }, 0.15);
  });
}

/* ---------- work: dashed trail + paper plane that follows the scroll ---------- */
const catmull = (p, k = 1) => {
  if (p.length < 2) return '';
  const f = (v) => v.toFixed(1);
  let d = `M ${f(p[0][0])} ${f(p[0][1])}`;
  for (let s = 0; s < p.length - 1; s++) {
    const a = p[s - 1] ?? p[s], o = p[s], c = p[s + 1], e = p[s + 2] ?? c;
    d += ` C ${f(o[0] + ((c[0] - a[0]) / 6) * k)} ${f(o[1] + ((c[1] - a[1]) / 6) * k)} ${f(c[0] - ((e[0] - o[0]) / 6) * k)} ${f(c[1] - ((e[1] - o[1]) / 6) * k)} ${f(c[0])} ${f(c[1])}`;
  }
  return d;
};
const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };

const buildWorkPath = (sec) => {
  const box = sec.getBoundingClientRect(), W = box.width;
  const rows = $$('[data-row]', sec).map((r) => { const b = r.getBoundingClientRect(); return { top: b.top - box.top, bottom: b.bottom - box.top, left: b.left - box.left }; });
  const hb = $('[data-work-head]', sec).getBoundingClientRect();
  const head = { top: hb.top - box.top, bottom: hb.bottom - box.top };
  if (!rows.length || W < 1024) return [];
  const L = rows[0].left / 2, R = W - L;
  const side = (i) => (i % 2 === 0 ? R : L);
  const inset = (i) => Math.min(200, (rows[i].bottom - rows[i].top) * 0.3);
  const out = [[[0.72 * W, head.top + 10], [(0.72 * W + R) / 2, head.bottom + 10], [R, rows[0].top + inset(0)]]];
  rows.forEach((row, i) => {
    const x = side(i), s = row.top + inset(i), u = row.bottom - inset(i);
    out.push([[x, s], [x + (x === R ? -10 : 10), (s + u) / 2], [x, u]]);
    if (i < rows.length - 1) {
      const nx = rows[i + 1], x2 = side(i + 1), gap = nx.top - row.bottom, dx = x2 - x;
      out.push([[x, u], [x + 0.15 * dx, row.bottom + 0.25 * gap], [W / 2, (row.bottom + nx.top) / 2], [x2 - 0.15 * dx, nx.top - 0.25 * gap], [x2, nx.top + inset(i + 1)]]);
    } else {
      out.push([[x, u], [W / 2, box.height - 60], [W / 2 + (x === R ? -40 : 40), box.height - 6]]);
    }
  });
  return out;
};

(function pathFollower(sec, anchor = 0.5) {
  if (!sec) return;
  const svg = $('.trail-svg', sec), motion = $('.trail-motion', sec), trail = $('.trail', sec),
    mask = $('.trail-mask', sec), follower = $('.plane', sec), sprite = $('.plane-sprite', sec);
  let segs = [], total = 0, raf = 0, lastKey = '', cur = -1, vw = innerWidth, vh = innerHeight;

  const layout = () => {
    const { width, height } = sec.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const parts = buildWorkPath(sec).filter((p) => p.length > 1);
    segs = [];
    if (!parts.length) { trail.setAttribute('d', ''); follower.style.opacity = '0'; return; }
    let d = '';
    parts.forEach((p, i) => {
      const a = catmull(p), prev = parts[i - 1], end = prev?.[prev.length - 1], start = p[0];
      if (i === 0) d = a;
      else if (Math.hypot(start[0] - end[0], start[1] - end[1]) < 1) d += a.replace(/^M[^C]*/, ' ');
      else {
        const t = unit(prev[prev.length - 2], end), n = unit(start, p[1]), o = 0.4 * Math.hypot(start[0] - end[0], start[1] - end[1]);
        const mStart = total;
        d += ` C ${end[0] + t[0] * o} ${end[1] + t[1] * o} ${start[0] - n[0] * o} ${start[1] - n[1] * o} ${start[0]} ${start[1]}`;
        motion.setAttribute('d', d); total = motion.getTotalLength();
        segs.push({ yStart: end[1], yEnd: start[1], mStart, mEnd: total, bridge: true });
        d += a.replace(/^M[^C]*/, ' ');
      }
      const mStart = i === 0 ? 0 : total;
      motion.setAttribute('d', d); total = motion.getTotalLength();
      segs.push({ yStart: p[0][1], yEnd: p[p.length - 1][1], mStart, mEnd: total, bridge: false });
    });
    trail.setAttribute('d', parts.map((p) => catmull(p)).join(' '));
    mask.setAttribute('d', d);
    mask.style.strokeDasharray = `${total}`;
    lastKey = '';
    if (reduce) { mask.style.strokeDashoffset = '0'; follower.style.opacity = '0'; return; }
    cancelAnimationFrame(raf);
    tick(true);
  };

  const target = () => {
    const t = vh * anchor - sec.getBoundingClientRect().top;
    const first = segs[0], last = segs[segs.length - 1];
    let len = 0, opacity = 1;
    if (t <= first.yStart) opacity = smooth(1 - (first.yStart - t) / 160);
    else if (t >= last.yEnd) len = total;
    else {
      const s = segs.find((s) => t < s.yEnd) ?? last;
      const k = Math.max(0, Math.min(1, (t - s.yStart) / Math.max(1, s.yEnd - s.yStart)));
      if (!s.bridge) len = s.mStart + k * (s.mEnd - s.mStart);
      else if (k < 0.55) { len = s.mStart; opacity = 1 - smooth((k - 0.3) / 0.25); }
      else { len = s.mEnd; opacity = smooth((k - 0.75) / 0.25); }
    }
    return { len, opacity };
  };

  const draw = (len, opacity) => {
    const key = `${len.toFixed(1)}|${opacity.toFixed(2)}`;
    if (key === lastKey) return;
    lastKey = key;
    const p = motion.getPointAtLength(len), a = motion.getPointAtLength(Math.max(0, len - 1)), b = motion.getPointAtLength(Math.min(total, len + 1));
    const angle = (180 * Math.atan2(b.y - a.y, b.x - a.x)) / Math.PI;
    follower.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    follower.style.opacity = `${opacity}`;
    sprite.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    mask.style.strokeDashoffset = `${total - len}`;
  };

  // eases toward the scroll target, so the plane glides instead of jumping
  function tick(snap = false) {
    raf = 0;
    if (reduce || !segs.length) return;
    const t = target();
    if (snap || cur < 0 || t.opacity < 0.05) cur = t.len;
    else {
      cur += (t.len - cur) * 0.22;
      if (Math.abs(t.len - cur) < 0.4) cur = t.len;
      else raf = requestAnimationFrame(() => tick());
    }
    draw(cur, t.opacity);
  }
  const request = () => { raf || (raf = requestAnimationFrame(() => tick())); };

  layout();
  new ResizeObserver(layout).observe(sec);
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { if (innerWidth !== vw) { vw = innerWidth; vh = innerHeight; request(); } });
})($('#projets'));

/* ---------- about: pinned card, words part, photo rises; curved text ---------- */
if (!reduce && $('.about-pin')) {
  const aboutTl = (tl) => tl
    .to('[data-word="1"]', { xPercent: 70 }, 0)
    .to('[data-word="2"]', { xPercent: -70 }, 0)
    .fromTo('[data-photo]', { yPercent: 12 }, { yPercent: 0 }, 0)
    .fromTo('[data-me]', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.2 }, 0.35);
  mm.add('(min-width: 701px)', () => aboutTl(gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.about-pin', start: 'top top', end: '+=110%', pin: true, scrub: true } })));
  mm.add('(max-width: 700px)', () => aboutTl(gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.about-pin', start: 'top top', end: 'bottom 30%', scrub: true } })));

  const textPath = $('.curve textPath');
  ScrollTrigger.create({ trigger: '.curve', start: 'top bottom', end: 'bottom top',
    onUpdate: (s) => textPath.setAttribute('startOffset', `${-60 * s.progress}%`) });
}

/* ---------- fade-up reveals (home + case studies) ---------- */
if (!reduce) $$('[data-reveal]').forEach((el) => gsap.from(el, { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));

/* ---------- case study: table of contents follows the section being read ---------- */
(function toc(links) {
  if (!links.length) return;
  const sections = links.map((a) => $(a.getAttribute('href')));
  const update = () => {
    const y = innerHeight * 0.35;
    let current = 0;
    sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top < y) current = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === current));
  };
  update();
  addEventListener('scroll', update, { passive: true });
})($$('.toc a'));

/* ---------- tools: magnifying dock + auto demo; tap grid below 1200px ---------- */
const projects = [
  { name: 'PetroStock SA', skills: ['PostgreSQL', 'FastAPI', 'React', 'Prophet'] },
  { name: 'TCVRP-softTW', skills: ['PyTorch', 'Python'] },
  { name: 'Lexique multilingue', skills: ['Python'] },
];
const noteFor = (tool) => {
  const used = projects.filter((p) => p.skills.includes(tool)).map((p) => p.name);
  return used.length ? `dans ${used.join(', ')}` : 'aussi dans ma boîte à outils';
};
// [name, simpleicons slug or #short text, in the dock?] — the dock keeps 17 icons like the reference so it fits 1440px
const toolGroups = [
  { name: 'Langages & ML', items: [['Python', 'python', 1], ['SQL', '#SQL', 1], ['C', 'c'], ['Pandas', 'pandas', 1], ['Scikit-learn', 'scikitlearn', 1], ['PyTorch', 'pytorch', 1], ['XGBoost', '#XGB'], ['Prophet', '#PR'], ['FastAPI', 'fastapi', 1]] },
  { name: 'Big Data & Cloud', items: [['Hadoop', 'apachehadoop', 1], ['Apache Spark', 'apachespark', 1], ['Hive', 'apachehive', 1], ['Pig', '#PIG'], ['AWS', '#AWS']] },
  { name: 'Bases de données', items: [['PostgreSQL', 'postgresql', 1], ['MongoDB', 'mongodb', 1], ['Cassandra', 'apachecassandra', 1], ['DynamoDB', '#DDB']] },
  { name: 'BI & Visualisation', items: [['Power BI', '#BI', 1], ['Orange', 'orange'], ['React', 'react', 1]] },
  { name: 'Au quotidien', items: [['Linux', 'linux'], ['Docker', 'docker', 1], ['Git', 'git', 1], ['GitHub', 'github', 1]] },
];
const iconHTML = (icon) => (icon.startsWith('#') ? `<b>${icon.slice(1)}</b>` : `<img src="https://cdn.simpleicons.org/${icon}" alt="">`);

(function tools(dock) {
  if (!dock) return;
  const tip = $('.dock-tip'), demoCursor = $('.dock-cursor');
  dock.insertAdjacentHTML('afterbegin', toolGroups.map((g, i) =>
    `<div class="dock-group">${i ? '<span class="dock-sep" aria-hidden="true"></span>' : ''}${g.items.filter((t) => t[2]).map(([name, icon]) =>
      `<button type="button" class="dock-icon" data-dock-icon data-name="${name}" aria-label="${name}, ${noteFor(name)}">${iconHTML(icon)}</button>`).join('')}</div>`).join(''));

  let pointerX = null, demo = null;
  const magnify = (x) => {
    let best = null;
    $$('[data-dock-icon]', dock).forEach((ic) => {
      const r = ic.getBoundingClientRect(), cx = r.left + r.width / 2;
      const d = x === null ? Infinity : Math.abs(x - cx);
      const size = 46 * (1 + 0.75 * Math.max(0, 1 - d / 150));
      gsap.to(ic, { width: size, height: size, duration: 0.18, ease: 'power2.out', overwrite: true });
      if (d < (best?.d ?? Infinity)) best = { name: ic.dataset.name, x: cx, d };
    });
    const box = dock.getBoundingClientRect();
    if (best && best.d < 40) {
      tip.hidden = false;
      tip.style.left = `${best.x - box.left}px`;
      tip.innerHTML = `${best.name}<span>${noteFor(best.name)}</span>`;
    } else tip.hidden = true;
  };
  dock.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; pointerX = e.clientX; demo || magnify(e.clientX); });
  dock.addEventListener('pointerleave', () => { pointerX = null; demo || magnify(null); });

  if (!reduce) mm.add('(min-width: 1201px)', () => {
    ScrollTrigger.create({ trigger: dock, start: 'top 70%', once: true, onEnter: () => {
      const r = dock.getBoundingClientRect(), s = { x: r.left - 40 };
      demo = gsap.timeline({ onComplete: () => { demo = null; magnify(pointerX); } })
        .set(demoCursor, { opacity: 1, x: -40, y: 0.55 * r.height })
        .to(s, { x: r.right + 20, duration: 2.6, ease: 'sine.inOut', onUpdate: () => {
          gsap.set(demoCursor, { x: s.x - dock.getBoundingClientRect().left });
          magnify(s.x);
        } })
        .to(demoCursor, { opacity: 0, duration: 0.3 });
    } });
    return () => demo?.kill();
  });

  const groupsEl = $('.tool-groups');
  groupsEl.innerHTML = toolGroups.map((g) => `<div><h3>${g.name}</h3><div class="tool-row">${g.items.map(([name, icon]) =>
    `<button type="button" class="tool-btn" aria-pressed="false" data-name="${name}">${iconHTML(icon)}<small>${name}</small></button>`).join('')}</div><p class="tool-note" aria-live="polite"></p></div>`).join('');
  let activeTool = null;
  const renderNotes = () => {
    $$('.tool-groups > div').forEach((g, i) => {
      const hit = $$('.tool-btn', g).find((b) => b.dataset.name === activeTool);
      $$('.tool-btn', g).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.name === activeTool)));
      $('.tool-note', g).innerHTML = hit ? `<em>${activeTool}</em> ${noteFor(activeTool)}` : (i === 0 && !activeTool ? 'Touche un outil pour voir où je l\'ai utilisé.' : '');
    });
  };
  groupsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.tool-btn');
    if (!b) return;
    activeTool = activeTool === b.dataset.name ? null : b.dataset.name;
    renderNotes();
  });
  renderNotes();
})($('.dock'));

/* ---------- contact: cursor clicks the button, dark card opens out of it ---------- */
(function contact(sec) {
  if (!sec) return;
  const btn = $('.build-btn', sec), dark = $('.dark-card', sec), box = $('.sel-box', sec),
    cur = $('.contact-cursor', sec), bob = $('.contact-bob', sec), pointer = $('.cursor', bob), label = $('.cursor span', bob);
  const KEEP = 'continue à scroller ↓', GO = "c'est parti";
  if (reduce) { gsap.set(cur, { opacity: 0 }); return; }

  const rect = () => {
    const e = sec.getBoundingClientRect(), t = btn.getBoundingClientRect();
    return { l: t.left - e.left, t: t.top - e.top, r: t.right - e.left, b: t.bottom - e.top, W: e.width, H: e.height };
  };
  let bobTween = null;
  gsap.set(bob, { opacity: 0, x: 48, y: 36 });
  const startBob = () => { bobTween?.kill(); bobTween = gsap.to(bob, { x: -6, y: -6, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }); };
  const arrive = () => gsap.to(bob, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.out', onComplete: startBob });
  const settle = () => { bobTween?.kill(); bobTween = null; gsap.killTweensOf(bob); gsap.to(bob, { opacity: 1, x: 0, y: 0, duration: 0.2 }); };
  const watchArrival = () => ScrollTrigger.create({ trigger: btn, start: 'bottom 75%', once: true, onEnter: arrive });

  const build = (tl) => {
    gsap.set([dark, box], { visibility: 'hidden' });
    return tl
      .fromTo(cur, { x: () => rect().r + 56, y: () => rect().b + 64 }, { x: () => rect().r - 8, y: () => rect().b - 8, ease: 'power2.out', duration: 0.25 })
      .to(pointer, { scale: 0.8, duration: 0.04 })
      .to(btn, { scale: 0.94, duration: 0.04 }, '<')
      .addLabel('open')
      .set([dark, box], { visibility: 'visible' }, 'open')
      .fromTo(dark,
        { clipPath: () => { const e = rect(); return `inset(${e.t}px ${e.W - e.r}px ${e.H - e.b}px ${e.l}px round ${(e.b - e.t) / 2}px)`; } },
        { clipPath: 'inset(16px 16px 16px 16px round 28px)', duration: 0.5, ease: 'power1.inOut' }, 'open')
      .fromTo(box,
        { opacity: 1, left: () => rect().l, top: () => rect().t, width: () => rect().r - rect().l, height: () => rect().b - rect().t, borderRadius: () => (rect().b - rect().t) / 2 },
        { left: 16, top: 16, width: () => rect().W - 32, height: () => rect().H - 32, borderRadius: 28, duration: 0.5, ease: 'power1.inOut' }, 'open')
      .to(cur, { x: () => rect().W - 22, y: () => rect().H - 22, duration: 0.5, ease: 'power1.inOut' }, 'open')
      .to(pointer, { scale: 1, duration: 0.04 })
      .fromTo('[data-footer-line]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.15 })
      .to([box, cur], { opacity: 0, duration: 0.1 });
  };

  mm.add('(min-width: 701px)', () => {
    label.textContent = KEEP;
    watchArrival();
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: () => { const t = tl.time(); label.textContent = t === 0 ? KEEP : t < tl.labels.open ? 'presque…' : GO; },
      scrollTrigger: { trigger: sec, start: 'top top', end: '+=160%', pin: true, scrub: 0.6, invalidateOnRefresh: true, onEnter: settle, onLeaveBack: startBob },
    });
    build(tl);
  });
  mm.add('(max-width: 700px)', () => {
    label.textContent = 'bertille';
    const tl = build(gsap.timeline({ paused: true, defaults: { ease: 'none' } })).call(() => { label.textContent = GO; }, [], 'open');
    tl.timeScale(0.55);
    watchArrival();
    ScrollTrigger.create({ trigger: sec, start: 'top 35%', once: true, onEnter: () => { settle(); tl.play(); } });
  });
})($('#contact'));

/* ---------- method story: raw points → K-Means clusters → forecast, driven by scroll ---------- */
function dataStory(sec) {
  if (!sec) return;
  const canvas = $('.story-canvas', sec), ctx = canvas.getContext('2d');
  const steps = $$('.story-step', sec), file = $('.story-file', sec);
  const FILES = ['donnees_brutes.csv', 'kmeans.fit(k=4)', 'prophet.predict()'];
  const N = matchMedia('(max-width: 700px)').matches ? 220 : 420;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const GRAY = hex('#b5b0a6'), ACCENT = hex('#6741ed'), FORECAST = hex('#1f9d63');
  const CLUSTER = ['#6741ed', '#9c86ff', '#1f9d63', '#f59e0b'].map(hex);
  const CENTERS = [[0.24, 0.3], [0.74, 0.27], [0.3, 0.74], [0.75, 0.7]];
  const NOW = 0.74; // where history ends and the forecast starts
  const series = (x) => 0.66 - 0.3 * x - 0.07 * Math.sin(x * 13) - 0.035 * Math.sin(x * 37);

  // seeded random so the cloud looks the same on every visit
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const pts = Array.from({ length: N }, (_, i) => ({
    rx: rand(), ry: rand(), c: i % 4, gx: gauss(), gy: gauss(), jy: gauss(),
    ph: rand() * 6.28, d: rand(), s: i / (N - 1),
  }));

  const state = { p: reduce ? 1 : 0 };
  const mouse = { x: -1e4, y: -1e4 };
  let W = 0, H = 0, visible = false, raf = 0;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  // per-point stagger so the cloud moves like a flock, not a block
  const phase = (a, b, d) => ease(clamp((state.p - a - d * 0.12) / (b - a)));

  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw(now = performance.now()) {
    const t = reduce ? 0 : now / 1000, pad = 28, w = W - 2 * pad, h = H - 2 * pad;
    const spread = Math.min(w, h) * 0.07;
    ctx.clearRect(0, 0, W, H);

    // centroids (step 2)
    const cAlpha = clamp((state.p - 0.32) / 0.12) * (1 - clamp((state.p - 0.58) / 0.08));
    if (cAlpha > 0) CENTERS.forEach(([cx, cy], i) => {
      const x = pad + cx * w, y = pad + cy * h;
      ctx.strokeStyle = rgba(CLUSTER[i], 0.25 * cAlpha); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, spread * 2.6, 0, 7); ctx.stroke();
      ctx.strokeStyle = rgba([23, 23, 23], 0.8 * cAlpha); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke();
    });

    // forecast chart (step 3)
    const fAlpha = clamp((state.p - 0.8) / 0.12);
    if (fAlpha > 0) {
      const X = (s) => pad + s * w, Y = (s) => pad + series(s) * h;
      ctx.fillStyle = rgba(FORECAST, 0.1 * fAlpha);
      ctx.beginPath();
      for (let s = NOW; s <= 1.0001; s += 0.01) ctx.lineTo(X(s), Y(s) - 14 - (s - NOW) * 140);
      for (let s = 1; s >= NOW - 0.0001; s -= 0.01) ctx.lineTo(X(s), Y(s) + 14 + (s - NOW) * 140);
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(ACCENT, fAlpha);
      ctx.beginPath(); for (let s = 0; s <= NOW; s += 0.005) ctx.lineTo(X(s), Y(s)); ctx.stroke();
      ctx.setLineDash([6, 5]); ctx.strokeStyle = rgba(FORECAST, fAlpha);
      ctx.beginPath(); for (let s = NOW; s <= 1.0001; s += 0.005) ctx.lineTo(X(s), Y(s)); ctx.stroke();
      ctx.strokeStyle = rgba([23, 23, 23], 0.25 * fAlpha); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(NOW), pad); ctx.lineTo(X(NOW), H - pad); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '12px Inter, sans-serif'; ctx.fillStyle = rgba([115, 115, 115], fAlpha);
      ctx.fillText("aujourd'hui", X(NOW) + 8, pad + 12);
      ctx.fillStyle = rgba(FORECAST, fAlpha);
      ctx.fillText('prévision', X(0.8), Y(0.8) - 14 - (0.8 - NOW) * 140 - 12);
    }

    // the points themselves
    for (const b of pts) {
      const a = phase(0.12, 0.42, b.d), c = phase(0.58, 0.86, b.d);
      const drift = 7 * (1 - a) * (1 - c);
      const x0 = pad + b.rx * w + Math.cos(t * 0.6 + b.ph) * drift, y0 = pad + b.ry * h + Math.sin(t * 0.8 + b.ph) * drift;
      const [cx, cy] = CENTERS[b.c];
      const x1 = pad + cx * w + b.gx * spread + Math.cos(t + b.ph) * 1.5, y1 = pad + cy * h + b.gy * spread + Math.sin(t + b.ph) * 1.5;
      const x2 = pad + b.s * w, y2 = pad + series(b.s) * h + b.jy * (b.s > NOW ? 4 + (b.s - NOW) * 60 : 5);
      let x = lerp(lerp(x0, x1, a), x2, c), y = lerp(lerp(y0, y1, a), y2, c);
      const dx = x - mouse.x, dy = y - mouse.y, dist = Math.hypot(dx, dy);
      if (dist < 90 && dist > 0) { const f = ((1 - dist / 90) * 22) / dist; x += dx * f; y += dy * f; }
      const col = mix(mix(GRAY, CLUSTER[b.c], a), b.s > NOW ? FORECAST : ACCENT, c);
      ctx.fillStyle = rgba(col, lerp(0.55, 0.9, Math.max(a, c)));
      ctx.beginPath(); ctx.arc(x, y, lerp(2, 2.6, a), 0, 7); ctx.fill();
    }

    const step = state.p < 0.36 ? 0 : state.p < 0.68 ? 1 : 2;
    steps.forEach((el, i) => el.classList.toggle('active', i === step));
    if (file.textContent !== FILES[step]) file.textContent = FILES[step];
  }

  // keep drawing only while on screen (idle drift + mouse repulsion)
  const loop = (now) => { draw(now); raf = visible && !reduce ? requestAnimationFrame(loop) : 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

  if (reduce) return;
  gsap.to(state, { p: 1, ease: 'none', scrollTrigger: { trigger: $('.story-pin', sec), start: 'top top', end: '+=220%', pin: true, scrub: 0.8 } });
}
