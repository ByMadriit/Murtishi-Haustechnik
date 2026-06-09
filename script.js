/* ═══════════════════════════════════════
   Murtishi Haustechnik — script.js
   Waterfall Canvas + UI Interactions
═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════ SANITÄR WASSER-ANIMATION ══════════
  // Rohrleitungen mit Wasser, Blasen, Hahn-Strahl und Wellenoberfläche
  const canvas = document.getElementById('waterfallCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;
    let t = 0;

    // Particles: water drops + bubbles
    let drops   = []; // faucet stream drops
    let bubbles = []; // rising bubbles in water
    let ripples = []; // surface ripples
    let splashes = [];

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function rndInt(a, b) { return Math.floor(rnd(a, b)); }

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      initScene();
    }

    /* ── Rohr-Layout ── */
    // Horizontal pipes and faucet positions — recalculated on resize
    let pipes = [];   // { x1, y1, x2, y2, w, col }
    let faucets = []; // { x, y, dir:'down'|'right', flowRate }
    let waterLevel = 0; // y of water surface

    function initScene() {
      waterLevel = H * 0.72;
      pipes   = [];
      faucets = [];

      // Main horizontal pipe near top
      const pipeY1 = H * 0.18;
      pipes.push({ x1: 0, y1: pipeY1, x2: W, y2: pipeY1, w: 10, col: '#1b4f7a' });

      // Vertical down-pipes from top
      const faucetXs = [W*0.14, W*0.32, W*0.52, W*0.70, W*0.88];
      faucetXs.forEach(fx => {
        const fy = pipeY1;
        const endY = fy + rnd(60, 130);
        pipes.push({ x1: fx, y1: fy, x2: fx, y2: endY, w: 7, col: '#1b6a8c' });
        faucets.push({ x: fx, y: endY, dir: 'down', flowRate: rnd(0.3, 0.7) });
      });

      // Secondary horizontal pipe
      const pipeY2 = H * 0.42;
      pipes.push({ x1: W*0.05, y1: pipeY2, x2: W*0.75, y2: pipeY2, w: 8, col: '#9b1a23' });
      // Vertical down-pipes
      [W*0.15, W*0.42, W*0.68].forEach(fx => {
        const endY = pipeY2 + rnd(50, 110);
        pipes.push({ x1: fx, y1: pipeY2, x2: fx, y2: endY, w: 6, col: '#b52a35' });
        faucets.push({ x: fx, y: endY, dir: 'down', flowRate: rnd(0.25, 0.55), red: true });
      });

      drops = [];
      bubbles = [];
      ripples = [];
    }

    /* ── Spawn drop from faucet ── */
    function spawnDrop(faucet) {
      drops.push({
        x:  faucet.x + rnd(-2, 2),
        y:  faucet.y,
        vx: rnd(-0.4, 0.4),
        vy: rnd(3, 6),
        r:  rnd(2, 4.5),
        alpha: rnd(0.6, 0.9),
        red: !!faucet.red,
        landed: false,
      });
    }

    /* ── Spawn bubble rising from water floor ── */
    function spawnBubble() {
      bubbles.push({
        x:    rnd(0, W),
        y:    H,
        vy:   rnd(0.6, 1.8),
        r:    rnd(2, 7),
        alpha: rnd(0.2, 0.55),
        wobble: rnd(0, Math.PI*2),
      });
    }

    /* ── Draw Pipes ── */
    function drawPipes() {
      pipes.forEach(p => {
        ctx.save();
        ctx.strokeStyle = p.col;
        ctx.lineWidth = p.w;
        ctx.lineCap = 'round';
        // Pipe body
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
        // Sheen
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = p.w * 0.3;
        ctx.beginPath();
        if (p.y1 === p.y2) {
          // horizontal — sheen on top
          ctx.moveTo(p.x1, p.y1 - p.w*0.18);
          ctx.lineTo(p.x2, p.y2 - p.w*0.18);
        } else {
          ctx.moveTo(p.x1 - p.w*0.18, p.y1);
          ctx.lineTo(p.x2 - p.w*0.18, p.y2);
        }
        ctx.stroke();
        ctx.restore();
      });

      // Joints / Elbows
      pipes.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x1, p.y1, p.w*0.6, 0, Math.PI*2);
        ctx.fill();
        ctx.arc(p.x2, p.y2, p.w*0.6, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Draw faucet tip ── */
    function drawFaucets() {
      faucets.forEach(f => {
        ctx.save();
        ctx.fillStyle = f.red ? '#c0392b' : '#2e9ac0';
        ctx.strokeStyle = f.red ? '#7d1e1e' : '#1b6a8c';
        ctx.lineWidth = 2;
        // Faucet nozzle rectangle
        ctx.beginPath();
        ctx.roundRect(f.x - 8, f.y - 4, 16, 14, 4);
        ctx.fill();
        ctx.stroke();
        // Opening slot
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(f.x - 4, f.y + 6, 8, 4, 2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Draw water surface with sine wave ── */
    function drawWaterSurface() {
      ctx.save();
      // Water body
      const wg = ctx.createLinearGradient(0, waterLevel, 0, H);
      wg.addColorStop(0, 'rgba(20,80,130,0.45)');
      wg.addColorStop(0.4, 'rgba(15,55,100,0.55)');
      wg.addColorStop(1, 'rgba(10,30,60,0.7)');

      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, waterLevel);
      // Sine-wave surface
      for (let x = 0; x <= W; x += 4) {
        const wave1 = Math.sin(x * 0.012 + t * 1.2) * 6;
        const wave2 = Math.sin(x * 0.025 - t * 0.8) * 3;
        const wave3 = Math.sin(x * 0.006 + t * 0.5) * 4;
        ctx.lineTo(x, waterLevel + wave1 + wave2 + wave3);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = wg;
      ctx.fill();

      // Surface shimmer line
      ctx.beginPath();
      ctx.moveTo(0, waterLevel);
      for (let x = 0; x <= W; x += 4) {
        const wave1 = Math.sin(x * 0.012 + t * 1.2) * 6;
        const wave2 = Math.sin(x * 0.025 - t * 0.8) * 3;
        const wave3 = Math.sin(x * 0.006 + t * 0.5) * 4;
        ctx.lineTo(x, waterLevel + wave1 + wave2 + wave3);
      }
      const sg = ctx.createLinearGradient(0, 0, W, 0);
      sg.addColorStop(0,   'rgba(100,200,255,0.1)');
      sg.addColorStop(0.5, 'rgba(150,220,255,0.4)');
      sg.addColorStop(1,   'rgba(100,200,255,0.1)');
      ctx.strokeStyle = sg;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    /* ── Draw drops ── */
    function drawDrops() {
      drops.forEach((d, i) => {
        d.vy += 0.22; // gravity
        d.x  += d.vx;
        d.y  += d.vy;

        // Hit water surface
        if (!d.landed && d.y >= waterLevel) {
          d.landed = true;
          if (Math.random() < 0.7) {
            ripples.push({ x: d.x, y: waterLevel, r: 0, maxR: rnd(12, 32), alpha: 0.7, speed: rnd(1.2, 2.5) });
          }
          // small splash
          for (let s = 0; s < rndInt(2,5); s++) {
            splashes.push({
              x: d.x, y: waterLevel,
              vx: rnd(-2,2), vy: rnd(-4,-1),
              life: 1, r: rnd(1,2.5), red: d.red
            });
          }
          drops.splice(i, 1);
          return;
        }

        // Elongate drop as it speeds up
        const elongation = Math.min(d.vy * 0.5, 8);
        ctx.save();
        const dc = d.red ? `rgba(200,80,80,${d.alpha})` : `rgba(80,180,230,${d.alpha})`;
        ctx.fillStyle = dc;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r, d.r + elongation, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Draw bubbles ── */
    function drawBubbles() {
      bubbles.forEach((b, i) => {
        b.wobble += 0.04;
        b.x += Math.sin(b.wobble) * 0.5;
        b.y -= b.vy;
        b.alpha -= 0.003;

        if (b.alpha <= 0 || b.y < waterLevel + 4) {
          // Pop at surface
          if (b.y < waterLevel + 4 && Math.random() < 0.3) {
            ripples.push({ x: b.x, y: waterLevel, r: 0, maxR: rnd(4, 10), alpha: 0.4, speed: 1 });
          }
          bubbles.splice(i, 1);
          return;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(160,220,255,${b.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
        // Sheen
        ctx.fillStyle = `rgba(220,240,255,${b.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r * 0.3, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Draw ripples ── */
    function drawRipples() {
      ripples.forEach((r, i) => {
        r.r     += r.speed;
        r.alpha -= 0.018;
        if (r.alpha <= 0) { ripples.splice(i, 1); return; }
        ctx.save();
        ctx.strokeStyle = `rgba(150,220,255,${r.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    /* ── Draw splashes ── */
    function drawSplashes() {
      splashes.forEach((s, i) => {
        s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.life -= 0.06;
        if (s.life <= 0) { splashes.splice(i, 1); return; }
        ctx.save();
        ctx.fillStyle = s.red ? `rgba(220,100,100,${s.life*0.8})` : `rgba(100,200,240,${s.life*0.8})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Draw steam wisps from hot pipe ── */
    let steamPuffs = [];
    function spawnSteam() {
      // From the red (hot water) pipes
      faucets.filter(f => f.red).forEach(f => {
        if (Math.random() < 0.04) {
          steamPuffs.push({ x: f.x + rnd(-6,6), y: f.y - 10, vy: rnd(0.5,1.2), vx: rnd(-0.3,0.3), r: rnd(4,10), alpha: 0.25, life: 1 });
        }
      });
    }
    function drawSteam() {
      steamPuffs.forEach((s, i) => {
        s.y -= s.vy; s.x += s.vx; s.r += 0.3; s.life -= 0.012; s.alpha = s.life * 0.25;
        if (s.life <= 0) { steamPuffs.splice(i, 1); return; }
        ctx.save();
        ctx.fillStyle = `rgba(200,230,240,${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Main loop ── */
    let frame = 0;
    function drawFrame() {
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      frame++;

      // Spawn
      faucets.forEach(f => {
        if (Math.random() < f.flowRate) spawnDrop(f);
      });
      if (frame % 4 === 0 && bubbles.length < 60) spawnBubble();
      spawnSteam();

      // Draw order: water first, then pipes on top
      drawWaterSurface();
      drawBubbles();
      drawRipples();
      drawSplashes();
      drawDrops();
      drawPipes();
      drawFaucets();
      drawSteam();

      requestAnimationFrame(drawFrame);
    }

    resize();
    window.addEventListener('resize', resize);
    drawFrame();
  }


  // ══════════ TOPBAR SCROLL EFFECT ══════════
  const topbar = document.getElementById('topbar');
  function onScroll() {
    if (window.scrollY > 60) topbar.classList.add('scrolled');
    else topbar.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  // ══════════ MOBILE MENU TOGGLE ══════════
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav    = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', open);
    });
    // Close on nav link click
    mainNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', false);
      });
    });
  }


  // ══════════ REVEAL ON SCROLL ══════════
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings
        const siblings = entry.target.parentElement
          ? [...entry.target.parentElement.querySelectorAll('.reveal')]
          : [entry.target];
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));


  // ══════════ ACTIVE NAV LINK HIGHLIGHT ══════════
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          link.style.background = '';
        });
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) {
          active.style.color = '#2e9ac0';
          active.style.background = 'rgba(46,154,192,0.1)';
        }
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => sectionObserver.observe(s));


  // ══════════ FORM VALIDATION FEEDBACK ══════════
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Wird gesendet…';
      btn.style.opacity = '0.7';
      btn.disabled = true;
    });
  }

});


/* =========================================================
   CMS CONTENT LOADER — Projekte & Website-Texte aus /data
   ========================================================= */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const safe = (v) => String(v ?? '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));

  async function getJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(path + ' konnte nicht geladen werden');
    return res.json();
  }

  function updateSite(data) {
    if (!data) return;
    const h = data.hero || {};
    if ($('.hero-tag') && h.tag) {
      const parts = String(h.tag).split('·').map(s => s.trim()).filter(Boolean);
      $('.hero-tag').innerHTML = parts.map((p, i) => `<span class="dot ${i % 2 ? 'blue' : 'red'}"></span>${safe(p)}`).join(' ');
    }
    if ($('.hero-title') && (h.titleLine1 || h.titleLine2)) {
      $('.hero-title').innerHTML = `<span class="line1">${safe(h.titleLine1 || '')}</span><span class="line2">${safe(h.titleLine2 || '')}</span>`;
    }
    if ($('.hero-sub') && h.subtitle) $('.hero-sub').textContent = h.subtitle;
    if ($('.hero-actions .primary') && h.primaryButton) $('.hero-actions .primary').lastChild.textContent = ' ' + h.primaryButton;
    if ($('.hero-actions .ghost') && h.secondaryButton) $('.hero-actions .ghost').childNodes[0].textContent = h.secondaryButton + ' ';
    if ($('.nav-cta') && h.phone) {
      $('.nav-cta').href = 'tel:' + h.phone.replace(/\s+/g, '');
      $('.nav-cta').lastChild.textContent = ' ' + h.phone;
    }

    const a = data.about || {};
    const about = $('#ueber-uns .about-content');
    if (about) {
      if (about.querySelector('.eyebrow') && a.eyebrow) about.querySelector('.eyebrow').textContent = a.eyebrow;
      if (about.querySelector('h2') && a.title) about.querySelector('h2').innerHTML = safe(a.title);
      if (about.querySelector('.about-lead') && a.lead) about.querySelector('.about-lead').textContent = a.lead;
      const aboutPs = about.querySelectorAll(':scope > p:not(.eyebrow):not(.about-lead)');
      if (aboutPs[0] && a.text) aboutPs[0].textContent = a.text;
      if (about.querySelector('.about-features') && Array.isArray(a.features)) {
        about.querySelector('.about-features').innerHTML = a.features.map(f => `<div class="afeat"><div class="afeat-icon">✓</div><span>${safe(f)}</span></div>`).join('');
      }
    }

    if (Array.isArray(data.services) && $('.service-grid')) {
      $('.service-grid').innerHTML = data.services.map((s, i) => `
        <article class="scard reveal visible">
          <div class="scard-icon"><span>${String(i+1).padStart(2,'0')}</span></div>
          <span class="scard-num">${String(i+1).padStart(2,'0')}</span>
          <h3>${safe(s.title)}</h3>
          <p>${safe(s.text)}</p>
          <div class="scard-line"></div>
        </article>`).join('');
    }

    if (Array.isArray(data.quickService) && $('.service-cards')) {
      $('.service-cards').innerHTML = data.quickService.map(s => `
        <article class="svcard reveal visible">
          <div class="svcard-icon">${safe(s.icon || '🔧')}</div>
          <h3>${safe(s.title)}</h3>
          <p>${safe(s.text)}</p>
        </article>`).join('');
    }

    if (Array.isArray(data.hours) && $('.hours-strip')) {
      $('.hours-strip').innerHTML = data.hours.map(h => `<div class="hday ${h.closed ? 'closed' : ''}"><span class="hday-name">${safe(h.day)}</span><span class="hday-time">${safe(h.time)}</span></div>`).join('');
    }

    const c = data.contact || {};
    if (c.email) {
      $$('a[href^="mailto:"]').forEach(el => { el.href = 'mailto:' + c.email; el.textContent = c.email; });
      const form = $('.contact-form');
      if (form) form.action = 'https://formsubmit.co/' + c.email;
    }
    if (c.phone) $$('a[href^="tel:"]').forEach(el => { el.href = 'tel:' + c.phone.replace(/\s+/g, ''); if (!el.classList.contains('nav-cta')) el.textContent = c.phone; });
    if (c.intro && $('.contact-info p')) $('.contact-info p').textContent = c.intro;
    if (c.address) {
      $$('.cinfo-item, .map-address').forEach(item => {
        if (item.textContent.includes('Hauptstrasse') || item.textContent.includes('Recherswil')) {
          const span = item.querySelector('span');
          if (span) span.textContent = c.address;
          else item.childNodes[item.childNodes.length - 1].textContent = ' ' + c.address;
        }
      });
    }
    if (c.company && $('.map-address strong')) $('.map-address strong').textContent = c.company;
    if (c.mapQuery && $('.map-wrap iframe')) $('.map-wrap iframe').src = 'https://www.google.com/maps?q=' + encodeURIComponent(c.mapQuery) + '&output=embed';
  }

  /* ── Lightbox ── */
  function createLightbox() {
    if (document.getElementById('lb-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'lb-overlay';
    overlay.innerHTML = `
      <div id="lb-box">
        <button id="lb-close" aria-label="Schließen">&#10005;</button>
        <img id="lb-img" src="" alt="">
        <p id="lb-caption"></p>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => { overlay.classList.remove('lb-open'); document.body.style.overflow = ''; };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('lb-close').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function openLightbox(src, alt) {
    const overlay = document.getElementById('lb-overlay');
    document.getElementById('lb-img').src = src;
    document.getElementById('lb-caption').textContent = alt;
    overlay.classList.add('lb-open');
    document.body.style.overflow = 'hidden';
  }

  function renderProjects(data) {
    const grid = $('.project-grid');
    if (!grid) return;
    const projects = Array.isArray(data.projects) ? data.projects : [];
    grid.innerHTML = projects.map(p => `
      <article class="pcard reveal visible">
        <div class="pcard-img">
          ${p.image ? `<img src="${safe(p.image)}" alt="${safe(p.title)}" loading="lazy" class="pcard-clickable">` : `<div class="pcard-fallback">${safe(p.category || 'Projekt')}</div>`}
          <div class="pcard-overlay">
            <span class="pcard-cat">${safe(p.category || 'Projekt')}</span>
            <h3>${safe(p.title)}</h3>
            ${p.description ? `<p class="pcard-desc">${safe(p.description)}</p>` : ''}
            ${p.image ? `<span class="pcard-zoom">🔍 Vergrössern</span>` : ''}
          </div>
        </div>
      </article>`).join('');

    createLightbox();
    grid.querySelectorAll('.pcard-clickable').forEach(img => {
      img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
    grid.querySelectorAll('.pcard-overlay').forEach(overlay => {
      const img = overlay.closest('.pcard-img').querySelector('.pcard-clickable');
      if (img) overlay.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try { updateSite(await getJSON('data/site.json')); } catch (e) { console.warn(e); }
    try { renderProjects(await getJSON('data/projects.json')); } catch (e) { console.warn(e); }
  });
})();


/* =========================================================
   ROBUST MOBILE MENU FIX
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mainNav') || document.querySelector('.main-nav');
  if (!toggle || !nav) return;
  toggle.setAttribute('aria-expanded', 'false');
  const closeMenu = () => { nav.classList.remove('is-open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  const openMenu = () => { nav.classList.add('is-open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
  toggle.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); nav.classList.contains('is-open') ? closeMenu() : openMenu(); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); });
});
