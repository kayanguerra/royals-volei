// ============================================================
//  VÔLEI DE PRAIA — lê content/praia.json (duplas + pódios).
//  Mostra Misto e Masculino juntos; o filtro no topo da página
//  vale para as duplas e para os pódios ao mesmo tempo.
//  Edite pelo painel do Pages CMS: "Vôlei de Praia".
// ============================================================

(function () {
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const MEDALHAS = {
        1: { classe: 'gold', icone: 'fa-trophy' },
        2: { classe: 'silver', icone: 'fa-medal' },
        3: { classe: 'bronze', icone: 'fa-medal' },
    };
    const CATEGORIAS = ['Todas', 'Misto', 'Masculino'];

    let duplas = [];
    let podios = [];
    let filtro = 'Todas';

    const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const numeroPosicao = p => parseInt(String(p || '').match(/\d+/)?.[0] || '0', 10);
    const categoriaDe = item => (item.categoria === 'Masculino' ? 'Masculino' : 'Misto');
    const passa = item => filtro === 'Todas' || categoriaDe(item) === filtro;

    // ---------- Ligação pódio -> dupla ----------
    // O campo "dupla" do pódio é texto livre. Ele conta para o card se for:
    //  - igual ao nome da dupla, ou
    //  - os dois nomes dos atletas, em qualquer ordem, separados por
    //    "e", "&", "+", "/" ou vírgula ("Ana e Bruno" = "bruno & ana").
    // Maiúsculas, acentos e espaços extras são ignorados.
    const norm = str => String(str || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/\s+/g, ' ').trim();
    const chaveNomes = str => norm(str)
        .split(/\s*(?:&|\+|,|\/|\be\b)\s*/)
        .filter(Boolean).sort().join('|');

    function podiosDaDupla(d) {
        const nomeDupla = norm(d.nome);
        const chaveAtletas = [d.atleta1?.nome, d.atleta2?.nome].map(norm).filter(Boolean).sort().join('|');
        return podios.filter(p => {
            if (!p.dupla) return false;
            if (nomeDupla && norm(p.dupla) === nomeDupla) return true;
            return chaveAtletas.includes('|') && chaveNomes(p.dupla) === chaveAtletas;
        });
    }

    function medalhasHtml(d) {
        const lista = podiosDaDupla(d);
        if (!lista.length) return '';
        const conta = n => lista.filter(p => numeroPosicao(p.posicao) === n).length;
        const chips = [1, 2, 3]
            .filter(n => conta(n) > 0)
            .map(n => `<span class="pair-medal pair-medal-${MEDALHAS[n].classe}" title="${conta(n)}× ${n}º lugar"><i class="fa-solid ${MEDALHAS[n].icone}"></i> ${conta(n)}</span>`)
            .join('');
        const total = lista.length;
        return `
            <a class="pair-medals" href="#podios-praia" aria-label="${total} ${total === 1 ? 'pódio' : 'pódios'} — ver pódios">
                ${chips}
                <span class="pair-medals-total">${total} ${total === 1 ? 'pódio' : 'pódios'}</span>
            </a>`;
    }

    function formatarData(iso) {
        const m = String(iso || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
        if (!m) return iso || '';
        const mes = MESES[parseInt(m[2], 10) - 1] || '';
        return m[3] ? `${parseInt(m[3], 10)} ${mes} ${m[1]}` : `${mes} ${m[1]}`;
    }

    // ---------- Filtro ----------
    function renderFiltros() {
        const box = document.getElementById('beachFilters');
        if (!box) return;
        const conta = cat => cat === 'Todas'
            ? duplas.length
            : duplas.filter(d => categoriaDe(d) === cat).length;
        box.innerHTML = CATEGORIAS.map(cat => `
            <button class="filter-btn${cat === filtro ? ' active' : ''}" type="button" data-cat="${cat}" aria-pressed="${cat === filtro}">
                ${cat} <span class="filter-count">(${conta(cat)})</span>
            </button>`).join('');
        box.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filtro = btn.dataset.cat;
                render();
            });
        });
    }

    // ---------- Duplas ----------
    function atletaHtml(a) {
        const nome = (a && a.nome) || 'Atleta';
        const foto = a && a.foto
            ? `<img src="${esc(a.foto)}" alt="${esc(nome)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-user'}))">`
            : `<i class="fa-solid fa-user"></i>`;
        return `
            <div class="pair-athlete">
                <div class="pair-photo">${foto}</div>
                <strong>${esc(nome)}</strong>
                ${a && a.funcao ? `<span>${esc(a.funcao)}</span>` : ''}
            </div>`;
    }

    function cardDupla(d) {
        const cat = categoriaDe(d);
        const n1 = d.atleta1?.nome || 'Atleta';
        const n2 = d.atleta2?.nome || 'Atleta';
        const titulo = d.nome && d.nome.trim() ? d.nome : `${n1} & ${n2}`;
        return `
            <article class="pair-card pair-${cat.toLowerCase()} fade-in">
                <span class="pair-badge">${cat}</span>
                <div class="pair-athletes">
                    ${atletaHtml(d.atleta1)}
                    <span class="pair-amp" aria-hidden="true">&amp;</span>
                    ${atletaHtml(d.atleta2)}
                </div>
                <h3>${esc(titulo)}</h3>
                ${d.descricao ? `<p>${esc(d.descricao)}</p>` : ''}
                ${medalhasHtml(d)}
            </article>`;
    }

    function renderDuplas() {
        const grid = document.getElementById('pairsGrid');
        if (!grid) return;
        const lista = duplas.filter(passa);
        grid.innerHTML = lista.length
            ? lista.map(cardDupla).join('')
            : `<div class="podium-empty"><i class="fa-solid fa-user-group"></i><p>Nenhuma dupla ${filtro === 'Todas' ? '' : filtro.toLowerCase() + ' '}cadastrada ainda.</p></div>`;
    }

    // ---------- Pódios ----------
    function renderBoard(lista) {
        const board = document.getElementById('beachBoard');
        if (!board) return;
        const conta = n => lista.filter(p => numeroPosicao(p.posicao) === n).length;
        board.innerHTML = [2, 1, 3].map(n => `
            <div class="podium-step podium-step-${MEDALHAS[n].classe}">
                <i class="fa-solid ${MEDALHAS[n].icone}"></i>
                <span class="podium-step-count">${conta(n)}</span>
                <span class="podium-step-label">${n}º lugar</span>
                <div class="podium-step-block"><span>${n}</span></div>
            </div>`).join('');
    }

    function cardPodio(p, idx) {
        const medalha = MEDALHAS[numeroPosicao(p.posicao)] || { classe: 'other', icone: 'fa-medal' };
        const fotos = (Array.isArray(p.fotos) ? p.fotos : []).filter(Boolean);
        const meta = [formatarData(p.data), p.local].filter(Boolean).map(esc).join(' • ');
        const fotosHtml = fotos.length
            ? `<div class="podium-photos podium-photos-${Math.min(fotos.length, 3)}">
                    ${fotos.slice(0, 3).map((src, i) => `
                        <button class="podium-photo" type="button" data-card="${idx}" data-index="${i}" aria-label="Ampliar foto ${i + 1}">
                            <img src="${esc(src)}" alt="${esc(p.torneio)} — foto ${i + 1}" loading="lazy">
                            ${i === 2 && fotos.length > 3 ? `<span class="podium-photo-more">+${fotos.length - 3}</span>` : ''}
                        </button>`).join('')}
               </div>`
            : `<div class="podium-photos podium-photos-empty"><i class="fa-solid fa-umbrella-beach"></i><span>Sem fotos</span></div>`;

        return `
            <article class="podium-card podium-${medalha.classe} fade-in">
                ${fotosHtml}
                <div class="podium-info">
                    <div class="podium-tags">
                        <span class="podium-medal"><i class="fa-solid ${medalha.icone}"></i> ${esc(p.posicao || '')}</span>
                        <span class="pair-badge pair-badge-inline pair-badge-${categoriaDe(p).toLowerCase()}">${categoriaDe(p)}</span>
                    </div>
                    <h3>${esc(p.torneio || 'Torneio')}</h3>
                    ${meta ? `<p class="podium-meta"><i class="fa-regular fa-calendar"></i> ${meta}</p>` : ''}
                    ${p.descricao ? `<p class="podium-desc">${esc(p.descricao)}</p>` : ''}
                    ${p.dupla ? `
                    <div class="podium-highlight">
                        <i class="fa-solid fa-user-group"></i>
                        <div>
                            <span>Dupla</span>
                            <strong>${esc(p.dupla)}</strong>
                        </div>
                    </div>` : ''}
                </div>
            </article>`;
    }

    function renderPodios() {
        const lista = podios
            .filter(passa)
            .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
        renderBoard(lista);

        const box = document.getElementById('beachPodiumList');
        if (!box) return;
        if (!lista.length) {
            box.innerHTML = `<div class="podium-empty"><i class="fa-solid fa-trophy"></i><p>Os pódios na praia aparecem aqui em breve.</p></div>`;
            return;
        }
        box.innerHTML = lista.map(cardPodio).join('');
        box.querySelectorAll('.podium-photo').forEach(btn => {
            btn.addEventListener('click', () => {
                const fotos = (lista[+btn.dataset.card].fotos || []).filter(Boolean);
                if (window.royalsOpenLightbox) window.royalsOpenLightbox(+btn.dataset.index, fotos);
            });
        });
    }

    function render() {
        renderFiltros();
        renderDuplas();
        renderPodios();
        if (typeof observeFadeIns === 'function') observeFadeIns();
        else document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }

    // Barra de filtro: ganha fundo de vidro só quando gruda embaixo do menu
    const barra = document.querySelector('.beach-filter-bar');
    if (barra) {
        const checaPresa = () => {
            const topo = parseFloat(getComputedStyle(barra).top) || 0;
            barra.classList.toggle('is-stuck', barra.getBoundingClientRect().top <= topo + 0.5);
        };
        window.addEventListener('scroll', checaPresa, { passive: true });
        window.addEventListener('resize', checaPresa);
        checaPresa();
    }

    fetch('content/praia.json', { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            duplas = Array.isArray(data.duplas) ? data.duplas : [];
            podios = Array.isArray(data.podios) ? data.podios : [];
        })
        .catch(err => console.error('[Royals] Não consegui carregar content/praia.json:', err))
        .finally(render);
})();
