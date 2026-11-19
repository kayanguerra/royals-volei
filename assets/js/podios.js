// ============================================================
//  PÓDIOS — lê content/podios.json e mostra os torneios do time
//  ativo (Misto = tema roxo, Masculino = tema vermelho).
//  Edite pelo painel do Pages CMS: "Pódios".
// ============================================================

(function () {
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const MEDALHAS = {
        1: { classe: 'gold', nome: 'Ouro', icone: 'fa-trophy' },
        2: { classe: 'silver', nome: 'Prata', icone: 'fa-medal' },
        3: { classe: 'bronze', nome: 'Bronze', icone: 'fa-medal' },
    };

    let podios = [];

    const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const timeAtual = () =>
        document.documentElement.getAttribute('data-theme') === 'vermelho' ? 'Masculino' : 'Misto';

    // "1º lugar" -> 1
    const numeroPosicao = p => parseInt(String(p || '').match(/\d+/)?.[0] || '0', 10);

    function formatarData(iso) {
        const m = String(iso || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
        if (!m) return iso || '';
        const mes = MESES[parseInt(m[2], 10) - 1] || '';
        return m[3] ? `${parseInt(m[3], 10)} ${mes} ${m[1]}` : `${mes} ${m[1]}`;
    }

    function doTime() {
        const time = timeAtual();
        return podios
            .filter(p => (p.time || 'Misto') === time)
            .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
    }

    function renderBoard(lista) {
        const board = document.getElementById('podiumBoard');
        if (!board) return;
        const conta = n => lista.filter(p => numeroPosicao(p.posicao) === n).length;
        // Ordem visual de pódio: 2º, 1º, 3º
        board.innerHTML = [2, 1, 3].map(n => `
            <div class="podium-step podium-step-${MEDALHAS[n].classe}">
                <i class="fa-solid ${MEDALHAS[n].icone}"></i>
                <span class="podium-step-count">${conta(n)}</span>
                <span class="podium-step-label">${n}º lugar</span>
                <div class="podium-step-block"><span>${n}</span></div>
            </div>`).join('');
    }

    function cardPodio(p, idx) {
        const n = numeroPosicao(p.posicao);
        const medalha = MEDALHAS[n] || { classe: 'other', nome: '', icone: 'fa-medal' };
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
            : `<div class="podium-photos podium-photos-empty"><i class="fa-solid fa-image"></i><span>Sem fotos</span></div>`;

        return `
            <article class="podium-card podium-${medalha.classe} fade-in">
                ${fotosHtml}
                <div class="podium-info">
                    <span class="podium-medal"><i class="fa-solid ${medalha.icone}"></i> ${esc(p.posicao || '')}</span>
                    <h3>${esc(p.torneio || 'Torneio')}</h3>
                    ${meta ? `<p class="podium-meta"><i class="fa-regular fa-calendar"></i> ${meta}</p>` : ''}
                    ${p.descricao ? `<p class="podium-desc">${esc(p.descricao)}</p>` : ''}
                    ${p.destaque ? `
                    <div class="podium-highlight">
                        <i class="fa-solid fa-crown"></i>
                        <div>
                            <span>Destaque do torneio</span>
                            <strong>${esc(p.destaque)}</strong>
                        </div>
                    </div>` : ''}
                </div>
            </article>`;
    }

    function render() {
        const lista = doTime();
        const nome = document.getElementById('podiumTeamName');
        if (nome) nome.textContent = `Royals ${timeAtual()}`;
        renderBoard(lista);

        const container = document.getElementById('podiumList');
        if (!container) return;
        if (!lista.length) {
            container.innerHTML = `
                <div class="podium-empty">
                    <i class="fa-solid fa-trophy"></i>
                    <p>Os pódios do Royals ${timeAtual()} aparecem aqui em breve.</p>
                </div>`;
            return;
        }
        container.innerHTML = lista.map(cardPodio).join('');

        container.querySelectorAll('.podium-photo').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = lista[+btn.dataset.card];
                const fotos = (p.fotos || []).filter(Boolean);
                if (window.royalsOpenLightbox) window.royalsOpenLightbox(+btn.dataset.index, fotos);
            });
        });

        if (typeof observeFadeIns === 'function') observeFadeIns();
        else container.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }

    document.addEventListener('royals:themechange', render);

    fetch('content/podios.json', { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => { podios = Array.isArray(data.podios) ? data.podios : []; })
        .catch(err => console.error('[Royals] Não consegui carregar content/podios.json:', err))
        .finally(render);
})();
