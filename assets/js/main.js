// ============================================================
//  DADOS — edite aqui para personalizar o site
// ============================================================

const positionGroups = [
    { key: 'Levantador', title: 'Levantadores', icon: 'fa-hands' },
    { key: 'Ponteiro',    title: 'Ponteiros',    icon: 'fa-person-running' },
    { key: 'Oposto',      title: 'Oposto',       icon: 'fa-bolt' },
    { key: 'Central',     title: 'Central',      icon: 'fa-volleyball' },
    { key: 'Líbero',      title: 'Líbero',       icon: 'fa-shield-halved' },
];

// ============================================================
//  O CONTEÚDO (elenco, MVPs, jogos, galeria) NÃO fica mais aqui.
//  Ele está em:
//    content/misto.json      -> Royals Misto (tema roxo)
//    content/masculino.json  -> Royals Masculino (tema vermelho)
//  Edite pelo painel do Pages CMS (app.pagescms.org) ou direto no JSON.
// ============================================================

const CONTENT_FILES = {
    roxo: 'content/misto.json',
    vermelho: 'content/masculino.json',
};

function emptyTeam() {
    return {
        temporadas: 0,
        estatisticasManuais: { jogos: 0, vitorias: 0 },
        players: [],
        mvpHighlights: [],
        games: { proximos: [], resultados: [] },
        galleryImages: [],
    };
}

// Começa vazio; é preenchido quando os JSON carregam (loadContent, no INIT).
const TEAMS = { roxo: emptyTeam(), vermelho: emptyTeam() };

// Garante que campos faltando no JSON não quebrem o site.
function normalizeTeam(data) {
    const base = emptyTeam();
    const t = Object.assign(base, data || {});
    t.players = Array.isArray(t.players) ? t.players : [];
    t.mvpHighlights = Array.isArray(t.mvpHighlights) ? t.mvpHighlights : [];
    t.games = Object.assign({ proximos: [], resultados: [] }, t.games || {});
    t.games.proximos = Array.isArray(t.games.proximos) ? t.games.proximos : [];
    t.games.resultados = Array.isArray(t.games.resultados) ? t.games.resultados : [];
    t.galleryImages = (Array.isArray(t.galleryImages) ? t.galleryImages : []).filter(Boolean);
    t.estatisticasManuais = Object.assign({ jogos: 0, vitorias: 0 }, t.estatisticasManuais || {});
    return t;
}

async function loadContent() {
    const entries = await Promise.all(Object.entries(CONTENT_FILES).map(async ([key, url]) => {
        try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error(res.status);
            return [key, normalizeTeam(await res.json())];
        } catch (err) {
            console.error(`[Royals] Não consegui carregar ${url}:`, err);
            return [key, emptyTeam()];
        }
    }));
    entries.forEach(([key, team]) => { TEAMS[key] = team; });
}

// Dados do time ativo (trocados pelo botão de tema).
let players, mvpHighlights, games, galleryImages, currentTeam;

function loadTeam(key) {
    const team = TEAMS[key] || TEAMS.roxo;
    players = team.players;
    mvpHighlights = team.mvpHighlights;
    games = team.games;
    galleryImages = team.galleryImages;
    currentTeam = team;
}
loadTeam(document.documentElement.getAttribute('data-theme') === 'vermelho' ? 'vermelho' : 'roxo');

// ============================================================
//  TEMA — roxo (time misto) / vermelho
//  Para usar arquivos próprios do tema vermelho, salve:
//    assets/logo-vermelho.png              (logo + ícone da aba)
//    assets/gallery/Background-vermelho.png (fundo do hero)
//  Se não existirem, o site usa o logo e o fundo atuais.
// ============================================================

const THEMES = {
    roxo: {
        label: 'Misto',
        logo: 'assets/logo.png',
        heroImage: null
    },
    vermelho: {
        label: 'Masculino',
        logo: 'assets/logo-vermelho.png',
        heroImage: 'assets/gallery/Background-vermelho.png'
    }
};
const DEFAULT_LOGO = 'assets/logo.png';

function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'vermelho' ? 'vermelho' : 'roxo';
}

function applyThemeAssets(themeKey) {
    const theme = THEMES[themeKey];

    // Logo (menu, hero, rodapé) e ícone da aba do navegador.
    // Testa o arquivo do tema antes; se não existir, usa o logo padrão.
    const useLogo = src => {
        if (getTheme() !== themeKey) return;
        document.querySelectorAll('.logo-img, .hero-logo, .footer-logo img').forEach(img => {
            img.style.display = '';
            img.src = src;
        });
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.type = 'image/png';
        favicon.href = src;
    };
    const logoProbe = new Image();
    logoProbe.onload = () => useLogo(theme.logo);
    logoProbe.onerror = () => useLogo(DEFAULT_LOGO);
    logoProbe.src = theme.logo;

    // Fundo do hero: só troca se o arquivo do tema carregar.
    const root = document.documentElement;
    root.style.removeProperty('--hero-image');
    root.style.removeProperty('--hero-image-filter');
    if (theme.heroImage) {
        const probe = new Image();
        probe.onload = () => {
            if (getTheme() !== themeKey) return;
            root.style.setProperty('--hero-image', `url('${theme.heroImage}')`);
            root.style.setProperty('--hero-image-filter', 'none');
        };
        probe.src = theme.heroImage;
    }
}

function setTheme(themeKey) {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeKey);
    try { localStorage.setItem('royals-theme', themeKey); } catch (e) {}

    const toggle = document.getElementById('themeToggle');
    const label = document.getElementById('themeLabel');
    if (toggle) {
        toggle.setAttribute('aria-pressed', themeKey === 'vermelho' ? 'true' : 'false');
        toggle.title = `Tema atual: ${THEMES[themeKey].label}. Clique para trocar`;
    }
    if (label) label.textContent = THEMES[themeKey].label;

    applyThemeAssets(themeKey);
    document.dispatchEvent(new CustomEvent('royals:themechange', { detail: { theme: themeKey } }));
}

(function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    setTheme(getTheme());
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        setTheme(getTheme() === 'roxo' ? 'vermelho' : 'roxo');
    });
})();

// ============================================================
//  NAVBAR
// ============================================================

const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
});

navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// ============================================================
//  PRÓXIMO JOGO EM DESTAQUE
// ============================================================

// Números da seção "Sobre". Jogos/vitórias são calculados pelos resultados,
// a não ser que "estatisticasManuais" no JSON tenha um valor maior que 0.
function renderAboutStats() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    const resultados = games.resultados || [];
    const manual = (currentTeam && currentTeam.estatisticasManuais) || {};
    const jogos = Number(manual.jogos) > 0 ? manual.jogos : resultados.length;
    const vitorias = Number(manual.vitorias) > 0 ? manual.vitorias : resultados.filter(g => g.type === 'win').length;
    set('statAtletas', players.length);
    set('statTemporadas', (currentTeam && currentTeam.temporadas) || 0);
    set('statJogos', jogos);
    set('statVitorias', vitorias);
}

function renderNextMatchHighlight() {
    const next = games.proximos[0];
    const opponent = document.getElementById('highlightOpponent');
    const info = document.getElementById('highlightInfo');

    if (!opponent || !info) return;

    if (!next) {
        opponent.textContent = 'A definir';
        info.textContent = 'Próximo jogo será divulgado em breve';
        return;
    }

    opponent.textContent = next.opponent;
    info.textContent = `${next.day} ${next.month} • ${next.time || 'Horário a definir'} • ${next.location}`;
}

// ============================================================
//  ELENCO
// ============================================================

// Converte "1,90 m" em 1.90 para calcular a barra de altura.
function heightToMeters(str) {
    if (!str) return null;
    const match = String(str).match(/(\d+)[,.](\d+)/);
    return match ? parseFloat(`${match[1]}.${match[2]}`) : null;
}

// Normaliza a altura numa faixa realista de vôlei (1,55m–2,05m) para uma barra de 0–100%.
function heightBarPercent(str) {
    const meters = heightToMeters(str);
    if (meters === null) return 0;
    const MIN_H = 1.55, MAX_H = 2.05;
    const pct = ((meters - MIN_H) / (MAX_H - MIN_H)) * 100;
    return Math.min(100, Math.max(6, Math.round(pct)));
}

function createPlayerCard(p, i) {
    const heightPct = heightBarPercent(p.height);
    return `
        <article class="player-card fade-in" data-number="${p.number}" data-position="${p.position}" style="transition-delay:${i * 0.04}s">
            <div class="player-card-inner">
                <div class="player-card-front">
                    ${p.photo
                        ? `<img src="${p.photo}" alt="${p.name}" class="player-photo">`
                        : `<div class="player-photo-placeholder"><i class="fas fa-user"></i></div>`
                    }
                    <div class="player-front-scrim">
                        <div class="player-name">${p.name}</div>
                    </div>
                </div>
                <div class="player-card-back">
                    <div class="player-back-header">
                        <div class="player-number">#${p.number}</div>
                        <div class="player-name">${p.name}</div>
                    </div>
                    <div class="player-stats">
                        <div class="stat-item">
                            <span class="stat-item-label"><i class="fa-solid fa-volleyball"></i> Posição</span>
                            <span class="stat-item-value">${p.position}</span>
                        </div>
                        ${p.height ? `
                        <div class="stat-item">
                            <span class="stat-item-label"><i class="fas fa-ruler-vertical"></i> Altura</span>
                            <span class="stat-item-value">${p.height}</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width:${heightPct}%"></div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </article>`;
}

// Toque/clique alterna o flip em telas sem hover confiável (mobile).
function setupCardFlipOnTap() {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;

    grid.addEventListener('click', event => {
        const card = event.target.closest('.player-card');
        if (!card) return;
        card.classList.toggle('flipped');
    });
}

function renderRosterFilters() {
    const filters = document.getElementById('rosterFilters');
    if (!filters) return;

    const totalLabel = `Todos (${players.length})`;
    const buttons = [
        { key: 'Todos', title: totalLabel, icon: 'fa-crown' },
        ...positionGroups.map(group => ({
            key: group.key,
            title: `${group.title} (${players.filter(p => p.position === group.key).length})`,
            icon: group.icon
        }))
    ];

    filters.innerHTML = buttons.map((button, index) => `
        <button class="filter-btn${index === 0 ? ' active' : ''}" type="button" data-filter="${button.key}" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}">
            <i class="fa-solid ${button.icon}"></i> ${button.title}
        </button>
    `).join('');
}

function updateFilterSummary(filter, count) {
    const summary = document.getElementById('filterSummary');
    if (!summary) return;

    const group = positionGroups.find(item => item.key === filter);

    summary.innerHTML = filter === 'Todos'
        ? `Mostrando <strong>todos</strong> os atletas`
        : `Mostrando <strong>${count}</strong> atleta${count !== 1 ? 's' : ''} em <strong>${group ? group.title : filter}</strong>`;
}

function renderPlayers(filter = 'Todos') {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;

    const filteredPlayers = filter === 'Todos'
        ? players
        : players.filter(player => player.position === filter);

    grid.className = 'players-grid players-grid-fixed';

    if (filteredPlayers.length === 0) {
        grid.innerHTML = `
            <div class="empty-role-card">
                <i class="fa-solid fa-user-plus"></i>
                Nenhum atleta nesta posição por enquanto.
            </div>`;
        updateFilterSummary(filter, 0);
        observeFadeIns();
        if (window.royalsAnimateRoster) window.royalsAnimateRoster();
        return;
    }

    grid.innerHTML = filteredPlayers.map((p, i) => createPlayerCard(p, i)).join('');
    updateFilterSummary(filter, filteredPlayers.length);
    observeFadeIns();
    if (window.royalsAnimateRoster) window.royalsAnimateRoster();
}

function setupRosterFilters() {
    renderRosterFilters();

    const filters = document.getElementById('rosterFilters');
    if (!filters) return;

    filters.addEventListener('click', event => {
        const btn = event.target.closest('.filter-btn');
        if (!btn) return;

        filters.querySelectorAll('.filter-btn').forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        renderPlayers(btn.dataset.filter);
    });
}

// ============================================================
//  MVP ROYALS
// ============================================================

let mvpSwipe = null;

function renderMvpCarousel() {
    const wrapper = document.getElementById('mvpCarousel');
    if (!wrapper) return;
    mvpSwipe = null;

    if (mvpHighlights.length === 0) {
        wrapper.innerHTML = `
            <div class="mvp-empty">
                <i class="fa-solid fa-crown"></i>
                <p>Os destaques MVP deste time aparecem aqui em breve.</p>
            </div>`;
        return;
    }

    wrapper.innerHTML = `
        <button class="mvp-btn mvp-prev" id="mvpPrev" type="button" aria-label="MVP anterior">
            <i class="fa-solid fa-chevron-left"></i>
        </button>

        <div class="mvp-stage">
            ${mvpHighlights.map((mvp, i) => `
                <article class="mvp-card${i === 0 ? ' active' : ''}" data-index="${i}">
                    <div class="mvp-photo-wrap">
                        ${mvp.photo
                            ? `<img src="${mvp.photo}" alt="${mvp.name}" class="mvp-photo">`
                            : `<div class="mvp-photo-placeholder"><i class="fa-solid fa-crown"></i></div>`
                        }
                        <span class="mvp-badge"><i class="fa-solid fa-star"></i> MVP</span>
                        <span class="mvp-number">#${mvp.number}</span>
                    </div>
                    <div class="mvp-info">
                        <span class="mvp-position">${mvp.position}</span>
                        <h3>${mvp.name}</h3>
                        <p class="mvp-match">${mvp.match}</p>
                        <p class="mvp-stats">${mvp.stats}</p>
                        <blockquote>${mvp.quote}</blockquote>
                    </div>
                </article>
            `).join('')}
        </div>

        <button class="mvp-btn mvp-next" id="mvpNext" type="button" aria-label="Próxima MVP">
            <i class="fa-solid fa-chevron-right"></i>
        </button>

        <div class="mvp-dots" id="mvpDots">
            ${mvpHighlights.map((_, i) => `<button class="mvp-dot${i === 0 ? ' active' : ''}" data-index="${i}" type="button" aria-label="MVP ${i + 1}"></button>`).join('')}
        </div>`;

    let current = 0;
    const cards = wrapper.querySelectorAll('.mvp-card');
    const dots = wrapper.querySelectorAll('.mvp-dot');

    function goTo(index) {
        current = (index + mvpHighlights.length) % mvpHighlights.length;
        cards.forEach((card, i) => card.classList.toggle('active', i === current));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
        if (window.royalsAnimateMvpSwitch) window.royalsAnimateMvpSwitch();
    }

    document.getElementById('mvpPrev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('mvpNext').addEventListener('click', () => goTo(current + 1));
    dots.forEach(dot => dot.addEventListener('click', () => goTo(+dot.dataset.index)));

    // Swipe registrado uma vez só (o carrossel é redesenhado ao trocar de time).
    mvpSwipe = dir => goTo(current + dir);
    if (!wrapper.dataset.swipeBound) {
        wrapper.dataset.swipeBound = 'true';
        let touchStartX = 0;
        wrapper.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        wrapper.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50 && mvpSwipe) mvpSwipe(diff > 0 ? 1 : -1);
        });
    }

    observeFadeIns();
}

// ============================================================
//  JOGOS
// ============================================================

function renderGames(tab) {
    const data = games[tab] || [];
    const list = document.getElementById('gamesList');

    if (data.length === 0) {
        list.innerHTML = `
            <div class="games-empty">
                <i class="fa-regular fa-calendar"></i>
                <p>${tab === 'proximos' ? 'Nenhum jogo marcado por enquanto.' : 'Nenhum resultado registrado ainda.'}</p>
            </div>`;
        return;
    }

    list.innerHTML = data.map((g, i) => `
        <article class="game-card fade-in" style="transition-delay:${i * 0.08}s">
            <div class="game-date">
                <div class="day">${g.day}</div>
                <div class="month">${g.month}</div>
            </div>
            <div class="game-info">
                <div class="opponent">
                    ${g.opponent}
                    ${g.score ? `<span class="score">${g.score}</span>` : ''}
                </div>
                <div class="location"><i class="fas fa-map-marker-alt"></i>${g.time ? `${g.time} • ` : ''}${g.location}</div>
            </div>
            <span class="game-badge badge-${g.type}">
                ${{ home: 'Casa', away: 'Fora', win: 'Vitória', loss: 'Derrota' }[g.type] || 'Jogo'}
            </span>
        </article>
    `).join('');

    observeFadeIns();
    if (window.royalsAnimateGames) window.royalsAnimateGames();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGames(btn.dataset.tab);
    });
});

// ============================================================
//  GALERIA
// ============================================================

function renderGallery() {
    const grid = document.getElementById('galleryGrid');

    if (galleryImages.length === 0) {
        grid.innerHTML = `
            <div class="gallery-placeholder">
                <i class="fas fa-images"></i>
                <p>As fotos deste time aparecem aqui em breve.</p>
            </div>`;
        return;
    }

    grid.innerHTML = `
        <div class="carousel-wrapper">
            <button class="carousel-btn carousel-prev" id="carouselPrev" aria-label="Foto anterior">
                <i class="fas fa-chevron-left"></i>
            </button>

            <div class="carousel-track-container">
                <span class="carousel-counter" id="carouselCounter">1 / ${galleryImages.length}</span>
                <div class="carousel-track" id="carouselTrack">
                    ${galleryImages.map((src, i) => `
                        <div class="carousel-slide" data-index="${i}">
                            <img src="${src}" alt="Foto ${i + 1}" loading="lazy">
                            <div class="carousel-slide-overlay">
                                <i class="fas fa-expand-alt"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <button class="carousel-btn carousel-next" id="carouselNext" aria-label="Próxima foto">
                <i class="fas fa-chevron-right"></i>
            </button>

            <div class="carousel-thumbs" id="carouselThumbs">
                ${galleryImages.map((src, i) => `
                    <div class="carousel-thumb${i === 0 ? ' active' : ''}" data-index="${i}">
                        <img src="${src}" alt="Miniatura ${i + 1}" loading="lazy">
                    </div>
                `).join('')}
            </div>

            <div class="carousel-dots" id="carouselDots">
                ${galleryImages.map((_, i) => `
                    <button class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Foto ${i + 1}"></button>
                `).join('')}
            </div>
        </div>`;

    let current = 0;
    const track    = document.getElementById('carouselTrack');
    const counter  = document.getElementById('carouselCounter');
    const dots     = document.querySelectorAll('.carousel-dot');
    const thumbs   = document.querySelectorAll('.carousel-thumb');

    function goTo(index) {
        current = (index + galleryImages.length) % galleryImages.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        counter.textContent = `${current + 1} / ${galleryImages.length}`;
        dots.forEach((d, i)  => d.classList.toggle('active', i === current));
        thumbs.forEach((t, i) => t.classList.toggle('active', i === current));
        thumbs[current].scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }

    document.getElementById('carouselPrev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('carouselNext').addEventListener('click', () => goTo(current + 1));
    dots.forEach(d   => d.addEventListener('click', () => goTo(+d.dataset.index)));
    thumbs.forEach(t => t.addEventListener('click', () => goTo(+t.dataset.index)));

    document.querySelectorAll('.carousel-slide').forEach(slide => {
        slide.addEventListener('click', () => openLightbox(+slide.dataset.index));
    });

    // swipe no celular
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    });

    observeFadeIns();
}

// ============================================================
//  LIGHTBOX
// ============================================================

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
let currentIndex = 0;

function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = galleryImages[currentIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigate(dir) {
    if (galleryImages.length === 0) return;
    currentIndex = (currentIndex + dir + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex];
}

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', () => navigate(-1));
document.getElementById('lightboxNext').addEventListener('click', () => navigate(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
});

// ============================================================
//  SCROLL ANIMATIONS
// ============================================================

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function observeFadeIns() {
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
}

// ============================================================
//  INIT
// ============================================================

// Redesenha tudo que muda de um time para o outro.
function renderTeam() {
    renderAboutStats();
    renderNextMatchHighlight();
    renderRosterFilters();
    renderPlayers();
    renderMvpCarousel();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'proximos'));
    renderGames('proximos');
    renderGallery();
    observeFadeIns();
}

document.addEventListener('royals:themechange', e => {
    loadTeam(e.detail.theme);
    renderTeam();
});

setupRosterFilters();
setupCardFlipOnTap();

// Carrega os JSON e redesenha com o conteúdo real.
loadContent().then(() => {
    loadTeam(getTheme());
    renderTeam();
});

// ============================================================
//  CURSOR GLOW — orbe dourado que segue o mouse suavemente
//  (mesmo efeito usado no Pegasus, recolorido pro Royals).
// ============================================================

const cursorGlow = document.querySelector('.cursor-glow');

if (cursorGlow) {
    window.addEventListener('pointermove', event => {
        if (window.gsap) {
            gsap.to(cursorGlow, {
                x: event.clientX,
                y: event.clientY,
                duration: 0.45,
                ease: 'power3.out'
            });
        } else {
            cursorGlow.style.left = `${event.clientX}px`;
            cursorGlow.style.top = `${event.clientY}px`;
        }
    });
}

// ============================================================
//  FUNDO DE PARTÍCULAS — canvas próprio (mesmo efeito do Pegasus:
//  partículas fogem do cursor e se conectam a ele), recolorido
//  em tons dourados/roxos do Royals.
// ============================================================

function setupParticlesBackground() {
    const canvas = document.getElementById('particles-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Cores das partículas vêm do tema (variáveis CSS *-rgb).
    function readThemeColors() {
        const css = getComputedStyle(document.documentElement);
        return ['--accent-pale-rgb', '--accent-light-rgb', '--accent-rgb']
            .map(name => `rgba(${css.getPropertyValue(name).trim()},`);
    }
    let COLORS = readThemeColors();
    const LINK_DISTANCE = 150;
    const MOUSE_DISTANCE = 180;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let rafId = null;

    function particleCount() {
        const area = width * height;
        return Math.min(90, Math.max(28, Math.round(area / 16000)));
    }

    function createParticles() {
        const count = particleCount();
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 1.8 + 1,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        createParticles();
    }

    function step() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > height) particle.vy *= -1;
            particle.x = Math.min(Math.max(particle.x, 0), width);
            particle.y = Math.min(Math.max(particle.y, 0), height);

            const dxMouse = particle.x - mouse.x;
            const dyMouse = particle.y - mouse.y;
            const mouseDistance = Math.hypot(dxMouse, dyMouse);
            if (mouseDistance < MOUSE_DISTANCE) {
                const force = (1 - mouseDistance / MOUSE_DISTANCE) * 0.6;
                particle.x += (dxMouse / (mouseDistance || 1)) * force;
                particle.y += (dyMouse / (mouseDistance || 1)) * force;
            }
        });

        for (let i = 0; i < particles.length; i += 1) {
            const a = particles[i];

            for (let j = i + 1; j < particles.length; j += 1) {
                const b = particles[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < LINK_DISTANCE) {
                    ctx.strokeStyle = `${a.color} ${0.16 * (1 - dist / LINK_DISTANCE)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            const mouseDist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
            if (mouseDist < MOUSE_DISTANCE) {
                ctx.strokeStyle = `${a.color} ${0.28 * (1 - mouseDist / MOUSE_DISTANCE)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }

            ctx.fillStyle = `${a.color} 0.75)`;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function loop() {
        step();
        rafId = requestAnimationFrame(loop);
    }

    resize();

    document.addEventListener('royals:themechange', () => {
        COLORS = readThemeColors();
        particles.forEach(p => { p.color = COLORS[Math.floor(Math.random() * COLORS.length)]; });
        if (prefersReducedMotion) step();
    });

    if (prefersReducedMotion) {
        step();
    } else {
        loop();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(rafId);
            } else {
                loop();
            }
        });
    }

    window.addEventListener('pointermove', event => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    window.addEventListener('pointerleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 150);
    });
}

setupParticlesBackground();

// ============================================================
//  CLIQUE = EXPLOSÃO — feedback visual garantido no ponto do clique,
//  além do burst de partículas (push) configurado acima.
// ============================================================

(function initClickBurst() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    document.addEventListener('click', e => {
        const burst = document.createElement('span');
        burst.className = 'click-burst';
        burst.style.left = e.clientX + 'px';
        burst.style.top = e.clientY + 'px';
        document.body.appendChild(burst);
        burst.addEventListener('animationend', () => burst.remove());
    });
})();

// ============================================================
//  MICRO-INTERAÇÕES DE MOUSE
//  Só ativa em dispositivos com ponteiro fino (mouse) e sem
//  preferência por menos animação.
// ============================================================

(function initMouseInteractions() {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduceMotion) return;

    // ---- Botões magnéticos ----
    const magneticEls = document.querySelectorAll('.btn, .footer-social a');
    const MAGNETIC_RADIUS = 70;
    const MAGNETIC_STRENGTH = 0.35;

    document.addEventListener('mousemove', e => {
        magneticEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);

            if (dist < MAGNETIC_RADIUS) {
                const pull = (1 - dist / MAGNETIC_RADIUS) * MAGNETIC_STRENGTH;
                el.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`;
            } else if (el.style.transform) {
                el.style.transform = '';
            }
        });
    });

    magneticEls.forEach(el => {
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    // ---- Tilt 3D nos cards ----
    const TILT_MAX = 9;

    function attachTilt(el) {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(700px) rotateX(${-py * TILT_MAX}deg) rotateY(${px * TILT_MAX}deg) scale3d(1.02,1.02,1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    }

    function attachTiltToAll(selector) {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset.tiltBound) return;
            el.dataset.tiltBound = 'true';
            attachTilt(el);
        });
    }

    attachTiltToAll('.player-card');
    attachTiltToAll('.mvp-card');

    // Elenco e MVP são re-renderizados dinamicamente (filtros, troca de destaque)
    const rosterGrid = document.getElementById('playersGrid');
    const mvpCarousel = document.getElementById('mvpCarousel');
    if (rosterGrid) new MutationObserver(() => attachTiltToAll('.player-card')).observe(rosterGrid, { childList: true });
    if (mvpCarousel) new MutationObserver(() => attachTiltToAll('.mvp-card')).observe(mvpCarousel, { childList: true });
})();

// ============================================================
//  PARALLAX SUAVE NO SCROLL — orbs do hero
// ============================================================

(function initParallax() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.to('.hero-orb-left', {
        y: 120,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-orb-right', {
        y: 180,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
})();

// ============================================================
//  PARTÍCULAS — TEMA POR SEÇÃO
//  Seções claras deixam as partículas mais discretas;
//  seções escuras mostram o efeito em intensidade máxima.
// ============================================================

(function initParticlesThemeSwitch() {
    const particlesEl = document.getElementById('particles-bg');
    if (!particlesEl) return;

    const lightSections = document.querySelectorAll('.section-about, .section-games');
    if (lightSections.length === 0) return;

    const themeObserver = new IntersectionObserver(() => {
        const anyLightVisible = Array.from(lightSections).some(section => {
            const rect = section.getBoundingClientRect();
            return rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
        });

        particlesEl.classList.toggle('theme-light', anyLightVisible);
        particlesEl.classList.toggle('theme-dark', !anyLightVisible);
    }, { threshold: 0.35 });

    lightSections.forEach(section => themeObserver.observe(section));
})();
