/* ============================================================
   ROYALS — CENAS ANIMADAS EM GSAP
   1) Hero: trilhas de energia com brilhos correndo pelo fundo.
   2) Jogos: rede de vôlei alongada, ocupando a largura da seção,
      com quadra, rastro de bola e movimento sutil na malha.
   3) Elenco, MVP e Jogos: entradas premium com GSAP/ScrollTrigger.
   ============================================================ */

(function () {
  const hasGsap = () => window.gsap && window.ScrollTrigger;

  /* ---------------------------------------------------------
     1) TRILHAS DE ENERGIA — HERO
     --------------------------------------------------------- */
  const TRAILS_SVG = `
    <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="trailGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g fill="none" stroke-linecap="round">
        <path class="trail-path" d="M -50,650 C 200,600 350,450 500,400 S 800,250 1250,150" style="stroke:var(--accent)" stroke-width="2" opacity="0.6"/>
        <path class="trail-path" d="M -50,560 C 150,530 300,490 460,470 S 720,440 1050,480" style="stroke:var(--secondary)" stroke-width="1.6" opacity="0.55"/>
        <path class="trail-path" d="M 250,-30 C 480,90 700,130 900,90 S 1150,-20 1260,-70" style="stroke:var(--accent)" stroke-width="1.4" opacity="0.3"/>
      </g>
      <g class="trail-stars" style="fill:var(--accent-light)">
        <circle cx="150" cy="120" r="2"/>
        <circle cx="820" cy="90" r="2.4"/>
        <circle cx="1000" cy="220" r="1.8"/>
        <circle cx="300" cy="300" r="2"/>
        <circle cx="950" cy="480" r="2.2"/>
        <circle cx="600" cy="80" r="1.6"/>
      </g>
    </svg>
  `;

  function initTrails(id) {
    const container = document.getElementById(id);
    if (!container || !window.gsap) return;

    container.innerHTML = TRAILS_SVG;
    const svg = container.querySelector('svg');
    const paths = svg.querySelectorAll('.trail-path');
    const stars = svg.querySelectorAll('.trail-stars circle');

    paths.forEach(path => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    });

    gsap.set(stars, { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.4 });
    tl.to(paths, { strokeDashoffset: 0, duration: 1.8, stagger: 0.25, ease: 'power2.inOut' })
      .to(stars, { opacity: 0.6, duration: 0.6, stagger: 0.08 }, '-=0.8')
      .add(() => {
        gsap.to(stars, {
          opacity: 0.15,
          duration: 1.6,
          stagger: { each: 0.3, repeat: -1, yoyo: true }
        });

        launchGlint(paths[0], 'var(--accent-pale)', 3, 6.5, 0);
        launchGlint(paths[0], 'var(--accent-pale)', 2.4, 6.5, 3.2);
        launchGlint(paths[1], 'var(--secondary-light)', 2.6, 7.5, 1.5);
      });
  }

  function launchGlint(pathEl, color, size, duration, delay) {
    if (!pathEl || !window.gsap) return;

    const svg = pathEl.ownerSVGElement;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', size);
    dot.style.fill = color;
    dot.setAttribute('filter', 'url(#trailGlow)');
    svg.appendChild(dot);

    gsap.set(dot, { opacity: 0 });
    gsap.timeline({ repeat: -1, delay })
      .to(dot, { opacity: 1, duration: 0.4 }, 0)
      .to(dot, {
        motionPath: { path: pathEl, align: pathEl, alignOrigin: [0.5, 0.5] },
        duration,
        ease: 'none'
      }, 0)
      .to(dot, { opacity: 0, duration: 0.5 }, duration - 0.5);
  }

  /* ---------------------------------------------------------
     2) CENA DE JOGOS — REDE ALONGADA + BOLA
     --------------------------------------------------------- */
  const SERVE_SVG = `
    <svg viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="netTapeGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style="stop-color:var(--secondary)" stop-opacity="0.2"/>
          <stop offset="0.18" style="stop-color:var(--accent-light)" stop-opacity="0.95"/>
          <stop offset="0.5" style="stop-color:var(--accent)" stop-opacity="1"/>
          <stop offset="0.82" style="stop-color:var(--accent-light)" stop-opacity="0.95"/>
          <stop offset="1" style="stop-color:var(--secondary)" stop-opacity="0.2"/>
        </linearGradient>
        <radialGradient id="serveBallGradient" cx="35%" cy="30%" r="70%">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.55" stop-color="#f1eef5"/>
          <stop offset="1" stop-color="#c9c2d4"/>
        </radialGradient>
        <filter id="serveBallGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="serveNetGlow" x="-60%" y="-80%" width="220%" height="260%">
          <feGaussianBlur stdDeviation="2.1" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="serveWordGlow" x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="1200" height="360" rx="28" fill="rgba(255,255,255,0.01)"/>

      <g class="serve-court" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path class="court-line" d="M155 264 H1045" style="stroke:var(--secondary)" stroke-width="1.4" opacity="0.26"/>
        <path class="court-line" d="M255 220 H945" style="stroke:var(--secondary)" stroke-width="1.2" opacity="0.22"/>
        <path class="court-line" d="M102 308 L307 146" style="stroke:var(--accent)" stroke-width="1.4" opacity="0.28"/>
        <path class="court-line" d="M1098 308 L893 146" style="stroke:var(--accent)" stroke-width="1.4" opacity="0.28"/>
      </g>

      <text class="serve-royals-word" x="600" y="330" text-anchor="middle">ROYALS</text>

      <g class="serve-net" fill="none" stroke-linecap="round" filter="url(#serveNetGlow)">
        <path class="serve-net-post" d="M88 101 V286" style="stroke:var(--accent)" stroke-width="7"/>
        <path class="serve-net-post" d="M1112 101 V286" style="stroke:var(--accent)" stroke-width="7"/>
        <path class="serve-tape serve-tape-top" d="M88 98 H1112" style="stroke:var(--accent)" stroke-width="4" opacity="0.82"/>
        <path class="serve-tape" d="M88 104 H1112" stroke="url(#netTapeGradient)" stroke-width="8"/>
        <path class="serve-tape serve-tape-bottom" d="M88 210 H1112" style="stroke:var(--accent)" stroke-width="4" opacity="0.82"/>

        <g class="serve-mesh" style="stroke:var(--secondary)" stroke-width="1.7" opacity="0.72">
          <path class="serve-net-line" d="M128 108 V210"/>
          <path class="serve-net-line" d="M176 108 V210"/>
          <path class="serve-net-line" d="M224 108 V210"/>
          <path class="serve-net-line" d="M272 108 V210"/>
          <path class="serve-net-line" d="M320 108 V210"/>
          <path class="serve-net-line" d="M368 108 V210"/>
          <path class="serve-net-line" d="M416 108 V210"/>
          <path class="serve-net-line" d="M464 108 V210"/>
          <path class="serve-net-line" d="M512 108 V210"/>
          <path class="serve-net-line" d="M560 108 V210"/>
          <path class="serve-net-line" d="M608 108 V210"/>
          <path class="serve-net-line" d="M656 108 V210"/>
          <path class="serve-net-line" d="M704 108 V210"/>
          <path class="serve-net-line" d="M752 108 V210"/>
          <path class="serve-net-line" d="M800 108 V210"/>
          <path class="serve-net-line" d="M848 108 V210"/>
          <path class="serve-net-line" d="M896 108 V210"/>
          <path class="serve-net-line" d="M944 108 V210"/>
          <path class="serve-net-line" d="M992 108 V210"/>
          <path class="serve-net-line" d="M1040 108 V210"/>
          <path class="serve-net-line" d="M1088 108 V210"/>

          <path class="serve-net-line" d="M88 132 H1112"/>
          <path class="serve-net-line" d="M88 156 H1112"/>
          <path class="serve-net-line" d="M88 181 H1112"/>
        </g>
      </g>

      <path id="serveArc" d="M72 260 C250 34 470 42 594 129 S920 205 1130 86" fill="none" opacity="0"/>

      <g class="serve-sparks" style="fill:var(--accent-light)" opacity="0">
        <circle cx="1128" cy="86" r="3"/>
        <circle cx="1110" cy="69" r="2"/>
        <circle cx="1098" cy="102" r="2.4"/>
        <circle cx="1148" cy="110" r="1.8"/>
      </g>

      <g id="ballTrail3" opacity="0"><circle r="5" fill="#e4def0"/></g>
      <g id="ballTrail2" opacity="0"><circle r="7" fill="#eee9f5"/></g>
      <g id="ballTrail1" opacity="0"><circle r="9" fill="#ffffff"/></g>
      <g id="ballMain" opacity="0" filter="url(#serveBallGlow)">
        <circle r="15" fill="url(#serveBallGradient)"/>
        <path d="M-11 -3 C-3 -12 8 -12 14 -4" style="stroke:var(--primary)" stroke-width="2" fill="none" opacity="0.7"/>
        <path d="M-12 8 C-3 1 7 1 13 10" style="stroke:var(--primary)" stroke-width="2" fill="none" opacity="0.65"/>
        <path d="M0 -14 C-5 -4 -5 6 1 15" style="stroke:var(--primary)" stroke-width="2" fill="none" opacity="0.62"/>
      </g>
    </svg>
  `;

  function initServe(id) {
    const container = document.getElementById(id);
    if (!container || !hasGsap() || !window.MotionPathPlugin) return;

    container.innerHTML = SERVE_SVG;
    const svg = container.querySelector('svg');
    const courtLines = svg.querySelectorAll('.court-line');
    const netParts = svg.querySelectorAll('.serve-net-post, .serve-tape, .serve-net-line');
    const meshLines = svg.querySelectorAll('.serve-net-line');
    const arc = svg.querySelector('#serveArc');
    const ball = svg.querySelector('#ballMain');
    const trail1 = svg.querySelector('#ballTrail1');
    const trail2 = svg.querySelector('#ballTrail2');
    const trail3 = svg.querySelector('#ballTrail3');
    const sparks = svg.querySelectorAll('.serve-sparks circle');
    const word = svg.querySelector('.serve-royals-word');

    [...courtLines, ...netParts].forEach(el => {
      const len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    });

    gsap.set([ball, trail1, trail2, trail3], { opacity: 0 });
    gsap.set(word, { autoAlpha: 0, y: 12 });
    gsap.set(sparks, { transformOrigin: 'center center', scale: 0, opacity: 0 });

    const intro = gsap.timeline({ paused: true });
    intro.to(courtLines, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: 'power2.inOut' })
      .to(netParts, { strokeDashoffset: 0, duration: 1.15, stagger: 0.025, ease: 'power2.out' }, '-=0.45')
      .to(word, { autoAlpha: 0.32, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
      .add(() => {
        animateNetBreath(meshLines);
        startServeLoop(arc, ball, trail1, trail2, trail3, sparks);
      });

    ScrollTrigger.create({
      trigger: container,
      start: 'top 82%',
      once: true,
      onEnter: () => intro.play()
    });
  }

  function animateNetBreath(meshLines) {
    gsap.to(meshLines, {
      y: -4,
      duration: 1.9,
      ease: 'sine.inOut',
      stagger: { each: 0.03, from: 'center', repeat: -1, yoyo: true }
    });

    gsap.to('.serve-tape', {
      filter: 'drop-shadow(0 0 8px rgba(255, 209, 107, 0.55))',
      duration: 1.3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  function startServeLoop(arc, ball, trail1, trail2, trail3, sparks) {
    const duration = 2.15;
    const repeatDelay = 0.55;
    const opts = { path: arc, align: arc, alignOrigin: [0.5, 0.5], autoRotate: false };

    const balls = [
      { el: ball, delay: 0, opacity: 1, scale: 1 },
      { el: trail1, delay: 0.055, opacity: 0.42, scale: 0.92 },
      { el: trail2, delay: 0.11, opacity: 0.24, scale: 0.82 },
      { el: trail3, delay: 0.165, opacity: 0.13, scale: 0.72 }
    ];

    balls.forEach(({ el, delay, opacity, scale }) => {
      gsap.timeline({ repeat: -1, repeatDelay, delay })
        .set(el, { opacity: 0, scale, rotation: 0 })
        .to(el, { opacity, duration: 0.18 }, 0)
        .to(el, { motionPath: opts, duration, ease: 'power1.inOut' }, 0)
        .to(el, { rotation: 720, duration, ease: 'none' }, 0)
        .to(el, { opacity: 0, duration: 0.25 }, duration - 0.22);
    });

    gsap.timeline({ repeat: -1, repeatDelay, delay: duration - 0.12 })
      .to(sparks, {
        opacity: 0.85,
        scale: 1,
        duration: 0.18,
        stagger: 0.035,
        ease: 'back.out(2)'
      })
      .to(sparks, {
        opacity: 0,
        scale: 0.2,
        x: () => gsap.utils.random(-22, 22),
        y: () => gsap.utils.random(-20, 18),
        duration: 0.42,
        stagger: 0.025,
        ease: 'power2.out'
      });
  }

  /* ---------------------------------------------------------
     3) ANIMAÇÕES DAS SEÇÕES — ELENCO, MVP E JOGOS
     --------------------------------------------------------- */
  function initSectionAnimations() {
    if (!hasGsap()) return;

    animateSectionHeading('#elenco');
    animateSectionHeading('#mvp');
    animateSectionHeading('#jogos');

    animateRosterFilters();
    animateRosterCards();
    animateMvpOnScroll();
    animateGamesShell();
    animateGameCards();
  }

  function animateSectionHeading(sectionSelector) {
    const heading = document.querySelector(`${sectionSelector} .section-heading`);
    if (!heading) return;

    const eyebrow = heading.querySelector('.eyebrow');
    const title = heading.querySelector('.section-title');
    const subtitle = heading.querySelector('.section-subtitle');

    gsap.fromTo([eyebrow, title, subtitle].filter(Boolean),
      { autoAlpha: 0, y: 34, filter: 'blur(8px)' },
      {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 82%', once: true }
      }
    );
  }

  function animateRosterFilters() {
    const filters = gsap.utils.toArray('#rosterFilters .filter-btn');
    if (!filters.length) return;

    gsap.fromTo(filters,
      { autoAlpha: 0, y: 18, scale: 0.94 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.055,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '#rosterFilters', start: 'top 88%', once: true }
      }
    );
  }

  function animateRosterCards() {
    const cards = gsap.utils.toArray('#playersGrid .player-card, #playersGrid .empty-role-card');
    if (!cards.length) return;

    gsap.fromTo(cards,
      { autoAlpha: 0, y: 42, rotateX: 10, scale: 0.94, filter: 'blur(7px)' },
      {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.75,
        stagger: 0.075,
        ease: 'power3.out',
        clearProps: 'transform,filter',
        scrollTrigger: { trigger: '#playersGrid', start: 'top 86%', once: true }
      }
    );
  }

  function animateMvpOnScroll() {
    const carousel = document.querySelector('#mvpCarousel');
    if (!carousel) return;

    gsap.fromTo('#mvpCarousel .mvp-btn, #mvpCarousel .mvp-dots',
      { autoAlpha: 0, scale: 0.86 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: carousel, start: 'top 82%', once: true }
      }
    );

    ScrollTrigger.create({
      trigger: carousel,
      start: 'top 82%',
      once: true,
      onEnter: () => window.royalsAnimateMvpSwitch && window.royalsAnimateMvpSwitch()
    });
  }

  function animateGamesShell() {
    const elements = gsap.utils.toArray('#jogos .games-tabs .tab-btn');
    if (!elements.length) return;

    gsap.fromTo(elements,
      { autoAlpha: 0, y: 20, scale: 0.92 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '#jogos .games-tabs', start: 'top 88%', once: true }
      }
    );
  }

  function animateGameCards() {
    const cards = gsap.utils.toArray('#gamesList .game-card');
    if (!cards.length) return;

    gsap.fromTo(cards,
      { autoAlpha: 0, x: -42, scale: 0.96, filter: 'blur(5px)' },
      {
        autoAlpha: 1,
        x: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.65,
        stagger: 0.085,
        ease: 'power3.out',
        clearProps: 'transform,filter',
        scrollTrigger: { trigger: '#gamesList', start: 'top 88%', once: true }
      }
    );
  }

  function animateMvpSwitch() {
    const cards = gsap.utils.toArray('#mvpCarousel .mvp-card');
    const active = document.querySelector('#mvpCarousel .mvp-card.active');
    if (!active || !window.gsap) return;

    gsap.set(cards.filter(card => card !== active), { autoAlpha: 0, x: 28, scale: 0.96 });

    gsap.fromTo(active,
      { autoAlpha: 0, x: 46, scale: 0.96, filter: 'blur(8px)' },
      { autoAlpha: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out', clearProps: 'filter' }
    );

    gsap.fromTo(active.querySelectorAll('.mvp-badge, .mvp-number, .mvp-position, h3, .mvp-match, .mvp-stats, blockquote'),
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.055, ease: 'power2.out' }
    );
  }

  window.royalsAnimateRoster = animateRosterCards;
  window.royalsAnimateGames = animateGameCards;
  window.royalsAnimateMvpSwitch = animateMvpSwitch;

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */
  function start() {
    if (!window.gsap) return;

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);

    initTrails('heroTrails');
    initServe('serveScene');
    initSectionAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
