// ============================================================
// DarkFlix - Premium TMDB API & MyEmbed Iframe Player Client
// ============================================================

(function () {
  'use strict';

  // ---------- State ----------
  const STATE = {
    currentPage: 'home',
    favorites: JSON.parse(localStorage.getItem('darkflix_favorites') || '[]'),
    currentMovieDetail: null,
    searchDebounce: null,
    tmdbApiKey: '1084015975402c8b0a0b81e807d2f7c8',
    featuredId: localStorage.getItem('darkflix_featured_id') || '157336', // Interstellar default
    featuredType: localStorage.getItem('darkflix_featured_type') || 'movie',
    heroTrailerTimeout: null,
    modalTrailerTimeout: null,
    heroTrailerPlaying: true,
    heroTrailerMuted: false,
    modalTrailerPlaying: true,
    modalTrailerMuted: false
  };

  // ---------- Genre Maps ----------
  const GENRE_MAP = {
    28: "Ação",
    12: "Aventura",
    16: "Animação",
    35: "Comédia",
    80: "Crime",
    99: "Documentário",
    18: "Drama",
    10751: "Família",
    14: "Fantasia",
    36: "História",
    27: "Terror",
    10402: "Música",
    9648: "Mistério",
    10749: "Romance",
    878: "Ficção Científica",
    10770: "Cinema TV",
    53: "Thriller",
    10752: "Guerra",
    37: "Faroeste",
    10759: "Ação & Aventura",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics"
  };

  const PORTUGUESE_GENRES = {
    "Ação": 28,
    "Aventura": 12,
    "Animação": 16,
    "Comédia": 35,
    "Crime": 80,
    "Drama": 18,
    "Fantasia": 14,
    "Terror": 27,
    "Ficção Científica": 878,
    "Thriller": 53
  };

  // ---------- DOM Elements Cache ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    header: $('#header'),
    navMenu: $('#nav-menu'),
    menuToggle: $('#menu-toggle'),
    searchInput: $('#search-input'),
    logoHome: $('#logo-home'),
    
    // Hero
    heroBackdrop: $('#hero-backdrop'),
    heroBadge: $('#hero-badge'),
    heroTitle: $('#hero-title'),
    heroRating: $('#hero-rating'),
    heroYear: $('#hero-year'),
    heroDuration: $('#hero-duration'),
    heroGenres: $('#hero-genres'),
    heroMeta: $('#hero-meta'),
    heroDescription: $('#hero-description'),
    heroWatchBtn: $('#hero-watch-btn'),
    heroInfoBtn: $('#hero-info-btn'),
    heroTrailer: $('#hero-trailer'),
    heroTrailerIframe: $('#hero-trailer-iframe'),
    heroTrailerControls: $('#hero-trailer-controls'),
    heroTrailerPlayPause: $('#hero-trailer-play-pause'),
    heroTrailerMuteUnmute: $('#hero-trailer-mute-unmute'),
    
    // Pages wrapper
    homeContent: $('#home-content'),
    pages: {
      home: $('#page-home'),
      movies: $('#page-movies'),
      series: $('#page-series'),
      search: $('#page-search'),
      admin: $('#page-admin'),
    },
    
    // Grid lists
    moviesGridAll: $('#movies-grid-all'),
    seriesGridAll: $('#series-grid-all'),
    moviesFilterBar: $('#movies-filter-bar'),
    seriesFilterBar: $('#series-filter-bar'),
    
    // Search page
    searchResultsTitle: $('#search-results-title'),
    searchResultsGrid: $('#search-results-grid'),
    noResults: $('#no-results'),
    
    // Detail Modal
    detailModal: $('#detail-modal'),
    modalHero: $('#modal-hero'),
    modalTitle: $('#modal-title'),
    modalRating: $('#modal-rating'),
    modalYear: $('#modal-year'),
    modalDuration: $('#modal-duration'),
    modalTypeBadge: $('#modal-type-badge'),
    modalGenres: $('#modal-genres'),
    modalDescription: $('#modal-description'),
    modalWatchBtn: $('#modal-watch-btn'),
    modalFavoriteBtn: $('#modal-favorite-btn'),
    modalFavoriteText: $('#modal-favorite-text'),
    modalCloseBtn: $('#modal-close-btn'),
    modalHeroTrailer: $('#modal-hero-trailer'),
    modalTrailerIframe: $('#modal-trailer-iframe'),
    modalTrailerControls: $('#modal-trailer-controls'),
    modalTrailerPlayPause: $('#modal-trailer-play-pause'),
    modalTrailerMuteUnmute: $('#modal-trailer-mute-unmute'),
    modalSeriesSelector: $('#modal-series-selector'),
    modalSeasonSelect: $('#modal-season-select'),
    modalEpisodesList: $('#modal-episodes-list'),
    
    // Cinema mode
    cinemaMode: $('#cinema-mode'),
    cinemaIframe: $('#cinema-iframe'),
    cinemaVideo: $('#cinema-video'),
    cinemaTitle: $('#cinema-title'),
    cinemaCloseBtn: $('#cinema-close-btn'),
    cinemaExternalBtn: $('#cinema-external-btn'),
    cinemaRewindBtn: $('#cinema-rewind-btn'),
    cinemaForwardBtn: $('#cinema-forward-btn'),
    
    // Admin config inputs & stats
    tmdbConfigForm: $('#tmdb-config-form'),
    tmdbApiKey: $('#tmdb-api-key'),
    btnSaveKey: $('#btn-save-key'),
    tmdbStatusWrapper: $('#tmdb-status-wrapper'),
    tmdbStatusIcon: $('#tmdb-status-icon'),
    tmdbStatusText: $('#tmdb-status-text'),
    
    featuredConfigForm: $('#featured-config-form'),
    featuredId: $('#featured-id'),
    featuredType: $('#featured-type'),
    
    adminFavoritesContainer: $('#admin-favorites-container'),
    statFavorites: $('#stat-favorites'),
    statCached: $('#stat-cached'),
    btnClearCache: $('#btn-clear-cache'),
    
    toastContainer: $('#toast-container'),
    footer: $('#main-footer')
  };

  // ---------- TMDB API Layer ----------
  async function tmdbFetch(endpoint, params = {}) {
    if (!STATE.tmdbApiKey) {
      throw new Error('API Key não configurada');
    }

    const queryParams = new URLSearchParams({
      api_key: STATE.tmdbApiKey,
      language: 'pt-BR',
      ...params
    });

    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;
    const cacheKey = `tmdb_cache_${url}`;
    
    // Try to get from session cache
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na chamada TMDB API: ${response.status}`);
    }

    const data = await response.json();
    
    // Save to session cache
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {}

    return data;
  }

  async function fetchTrailerUrl(id, type) {
    try {
      const data = await tmdbFetch(`/${type}/${id}/videos`);
      const videos = data.results || [];
      const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
      if (trailer) {
        return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&enablejsapi=1`;
      }
    } catch (e) {
      console.warn("Falha ao buscar trailer do vídeo", e);
    }
    return '';
  }

  // ---------- YouTube Player Controls via PostMessage ----------
  const ICONS = {
    play: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    muted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
    unmuted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
  };

  function sendTrailerCommand(iframe, func, args = []) {
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: func,
          args: args
        }), '*');
      } catch (e) {
        console.error("Error sending postMessage to YouTube player:", e);
      }
    }
  }

  function updateTrailerControlsUI(prefix, isPlaying, isMuted) {
    const playPauseBtn = DOM[`${prefix}TrailerPlayPause`];
    const muteUnmuteBtn = DOM[`${prefix}TrailerMuteUnmute`];
    
    if (playPauseBtn) {
      playPauseBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
      playPauseBtn.title = isPlaying ? 'Pausar Trailer' : 'Reproduzir Trailer';
    }
    if (muteUnmuteBtn) {
      muteUnmuteBtn.innerHTML = isMuted ? ICONS.muted : ICONS.unmuted;
      muteUnmuteBtn.title = isMuted ? 'Ativar Som' : 'Silenciar';
    }
  }

  // ---------- Navigation ----------
  function navigateTo(page) {
    STATE.currentPage = page;
    
    // Reset page visibility
    Object.keys(DOM.pages).forEach((key) => {
      DOM.pages[key].classList.toggle('active', key === page);
    });

    // Update active nav link
    $$('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Mobile menu reset
    DOM.navMenu.classList.remove('open');
    DOM.menuToggle.classList.remove('active');
    
    // Trailers stop
    stopMainHeroTrailer();
    closeDetail();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render contents
    if (page === 'home') renderHome();
    else if (page === 'movies') renderMoviesPage();
    else if (page === 'series') renderSeriesPage();
    else if (page === 'admin') renderAdmin();
  }

  // ---------- Toast Notifications ----------
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
    };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---------- Loading & Error Helpers ----------
  function showLoadingSkeletons(container) {
    container.innerHTML = Array.from({ length: 12 }).map(() => `
      <div class="movie-card skeleton-card" style="aspect-ratio: 2/3; background: var(--bg-card); border-radius: var(--radius-lg); position: relative; overflow: hidden; border: 1px solid var(--border);">
        <div class="skeleton" style="width: 100%; height: 100%;"></div>
      </div>
    `).join('');
  }

  function showErrorState(container, message) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-secondary);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); margin-bottom: 16px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style="font-size: 0.95rem;">${message}</p>
      </div>
    `;
  }

  function showTMDBSetupMessage() {
    DOM.homeContent.innerHTML = `
      <div class="no-results" style="padding: 100px 20px; max-width: 600px; margin: 0 auto; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); margin-bottom: 24px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h2 style="font-size: 1.8rem; margin-bottom: 12px; font-weight: 800;">Configuração Necessária</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
          Para navegar pelo catálogo infinito do TMDB e assistir a filmes e séries via MyEmbed, você precisa configurar sua chave de API nas configurações do painel admin.
        </p>
        <button class="btn btn-primary" id="btn-goto-admin">
          ⚙ Ir para o Painel Admin
        </button>
      </div>
    `;

    const btnGo = $('#btn-goto-admin');
    if (btnGo) {
      btnGo.onclick = () => navigateTo('admin');
    }

    DOM.heroBackdrop.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221000%22 height=%22500%22><rect fill=%22%2312121a%22 width=%221000%22 height=%22500%22/></svg>')`;
    DOM.heroTitle.textContent = "Bem-vindo ao DarkFlix";
    DOM.heroDescription.textContent = "Conecte sua chave de API do TMDB para desbloquear milhares de títulos instantaneamente.";
    DOM.heroBadge.style.display = 'none';
    DOM.heroMeta.style.display = 'none';
    DOM.heroGenres.style.display = 'none';
    DOM.heroWatchBtn.style.display = 'none';
    DOM.heroInfoBtn.style.display = 'none';
  }

  // ---------- Card HTML Helper ----------
  function createCardHTML(item, index, defaultMediaType = 'movie') {
    const title = item.title || item.name || 'Sem Título';
    const mediaType = item.media_type || defaultMediaType;
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const year = (item.release_date || item.first_air_date || '').substring(0, 4) || 'N/A';

    const posterSrc = item.poster_path 
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}` 
      : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22><rect fill=%22%2312121a%22 width=%22300%22 height=%22450%22/><text fill=%22%236a6a7a%22 font-family=%22sans-serif%22 font-size=%2216%22 x=%22150%22 y=%22225%22 text-anchor=%22middle%22>Sem Poster</text></svg>';

    const typeLabel = mediaType === 'movie' ? 'Filme' : 'Série';

    // Watch progress indicator
    const progressKey = `darkflix_progress_${item.id}`;
    const progress = localStorage.getItem(progressKey);
    let progressIndicatorHTML = '';

    if (progress) {
      try {
        const prog = JSON.parse(progress);
        if (prog && prog.percent) {
          progressIndicatorHTML = `
            <div class="card-progress-bar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255, 255, 255, 0.3); z-index: 5;">
              <div style="height: 100%; width: ${prog.percent}%; background: var(--accent); transition: width 0.3s ease;"></div>
            </div>
          `;
        } else if (prog && prog.season) {
          progressIndicatorHTML = `
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(229, 9, 20, 0.9); padding: 3px 8px; font-size: 0.65rem; color: white; text-align: right; font-weight: 700; z-index: 5; border-bottom-left-radius: var(--radius-sm); border-bottom-right-radius: var(--radius-sm);">
              T${prog.season}:E${prog.episode}
            </div>
          `;
        }
      } catch (e) {}
    }

    return `
      <div class="movie-card" data-id="${item.id}" data-type="${mediaType}" style="animation-delay: ${index * 0.05}s">
        <img class="movie-card-poster" src="${posterSrc}" alt="${title}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22><rect fill=%22%2312121a%22 width=%22300%22 height=%22450%22/><text fill=%22%236a6a7a%22 font-family=%22sans-serif%22 font-size=%2216%22 x=%22150%22 y=%22225%22 text-anchor=%22middle%22>Sem Imagem</text></svg>'">
        <div class="movie-card-overlay">
          <div class="movie-card-play">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <div class="movie-card-info">
          <h3 class="movie-card-title">${title}</h3>
          <div class="movie-card-meta">
            <span class="card-rating">★ ${rating}</span>
            <span>${year}</span>
            <span>${typeLabel}</span>
          </div>
        </div>
        ${progressIndicatorHTML}
      </div>
    `;
  }

  function attachCardEvents(container) {
    container.querySelectorAll('.movie-card').forEach((card) => {
      card.addEventListener('click', async () => {
        const id = card.dataset.id;
        const type = card.dataset.type;
        try {
          showToast('Carregando detalhes...', 'info');
          const details = await tmdbFetch(`/${type}/${id}`);
          details.media_type = type;
          openDetail(details);
        } catch (err) {
          console.error("Erro ao carregar detalhes:", err);
          showToast('Erro ao carregar os detalhes do título.', 'error');
        }
      });
    });
  }

  // ---------- Render Home ----------
  async function renderHome() {
    if (!STATE.tmdbApiKey) {
      showTMDBSetupMessage();
      return;
    }

    showLoadingSkeletons(DOM.homeContent);

    try {
      // Categorias por gênero (cada uma puxa 20 filmes da API)
      const homeCategories = [
        { title: 'Terror e Suspense', id: '27,53' },
        { title: 'Comédias', id: '35' },
        { title: 'Ação e Aventura', id: '28,12' },
        { title: 'Românticos', id: '10749' },
        { title: 'Para Toda a Família', id: '10751' },
        { title: 'Dramas', id: '18' },
        { title: 'Animação', id: '16' },
        { title: 'Ficção Científica', id: '878' },
        { title: 'Infantil', id: '16,10751' },
        { title: 'Filmes de Guerra', id: '10752' },
        { title: 'Faroeste', id: '37' },
        { title: 'Música e Musicais', id: '10402' },
        { title: 'Mistérios', id: '9648' },
        { title: 'Históricos', id: '36' },
        { title: 'Documentários', id: '99' },
        { title: 'Crime', id: '80' },
        { title: 'Fantasia', id: '14' }
      ];

      // Requests base
      const requests = [
        tmdbFetch('/movie/now_playing').catch(() => ({ results: [] })),
        tmdbFetch('/movie/now_playing', { page: 2 }).catch(() => ({ results: [] })),
        tmdbFetch('/trending/movie/week').catch(() => ({ results: [] })),
        tmdbFetch('/trending/tv/week').catch(() => ({ results: [] })),
        tmdbFetch('/movie/top_rated').catch(() => ({ results: [] })),
        tmdbFetch('/movie/upcoming').catch(() => ({ results: [] })),
        tmdbFetch('/movie/popular').catch(() => ({ results: [] })),
        tmdbFetch('/movie/popular', { page: 2 }).catch(() => ({ results: [] })),
        tmdbFetch('/trending/tv/day').catch(() => ({ results: [] })),
        fetchFeaturedItem().catch(() => null)
      ];

      // Requests das categorias por gênero
      homeCategories.forEach(cat => {
        requests.push(tmdbFetch('/discover/movie', { with_genres: cat.id, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })));
      });

      const responses = await Promise.all(requests);

      const nowPlaying1 = responses[0];
      const nowPlaying2 = responses[1];
      const trendingMovies = responses[2];
      const trendingSeries = responses[3];
      const topRated = responses[4];
      const upcoming = responses[5];
      const popular1 = responses[6];
      const popular2 = responses[7];
      const trendingSeriesDay = responses[8];
      const featuredDetails = responses[9];
      const categoryResults = responses.slice(10);

      // Combinar páginas
      const nowPlayingAll = [...(nowPlaying1.results || []), ...(nowPlaying2.results || [])];
      const popularAll = [...(popular1.results || []), ...(popular2.results || [])];

      // Set featured on banner
      const heroItem = featuredDetails || trendingMovies.results[0];
      renderHero(heroItem);

      let html = '';

      // Helper para gerar seção
      function buildSection(title, items, mediaType) {
        if (!items || items.length === 0) return '';
        return `
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">${title}</h2>
            </div>
            <div class="movies-row">
              ${items.map((item, i) => createCardHTML(item, i, mediaType)).join('')}
            </div>
          </section>
        `;
      }

      // 1. Lançamentos no Cinema (40 filmes)
      html += buildSection('Lançamentos no Cinema', nowPlayingAll, 'movie');

      // 2. Minha Lista
      if (STATE.favorites.length > 0) {
        html += buildSection('Minha Lista', STATE.favorites, 'movie');
      }

      // 3. Filmes em Destaque (trending semana)
      html += buildSection('Filmes em Destaque', trendingMovies.results, 'movie');

      // 4. Séries Populares (trending semana)
      html += buildSection('Séries Populares', trendingSeries.results, 'tv');

      // 5. Mais Bem Avaliados de Todos os Tempos
      html += buildSection('Mais Bem Avaliados', topRated.results, 'movie');

      // 6. Em Breve nos Cinemas
      html += buildSection('Em Breve nos Cinemas', upcoming.results, 'movie');

      // 7. Populares Agora (40 filmes)
      html += buildSection('Populares Agora', popularAll, 'movie');

      // 8. Séries em Alta Hoje
      html += buildSection('Séries em Alta Hoje', trendingSeriesDay.results, 'tv');

      // 9. Todas as categorias por gênero
      homeCategories.forEach((cat, index) => {
        const results = categoryResults[index].results || [];
        html += buildSection(cat.title, results, 'movie');
      });

      DOM.homeContent.innerHTML = html || `
        <div class="no-results">
          <h3>Nenhum conteúdo carregado</h3>
          <p>Verifique sua chave ou tente novamente mais tarde.</p>
        </div>
      `;

      attachCardEvents(DOM.homeContent);

    } catch (err) {
      console.error("Erro renderizando home:", err);
      showErrorState(DOM.homeContent, "Erro ao conectar-se com o TMDB API. Verifique sua conexão.");
    }
  }

  async function fetchFeaturedItem() {
    if (!STATE.featuredId) return null;
    try {
      const details = await tmdbFetch(`/${STATE.featuredType}/${STATE.featuredId}`);
      details.media_type = STATE.featuredType;
      return details;
    } catch (e) {
      console.warn("Featured item fetch failed", e);
      return null;
    }
  }

  async function renderHero(item) {
    if (!item) return;

    const title = item.title || item.name || 'Sem Título';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const year = (item.release_date || item.first_air_date || '').substring(0, 4) || 'N/A';
    const type = item.media_type || (item.title ? 'movie' : 'tv');

    const backdropUrl = item.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` 
      : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221000%22 height=%22500%22><rect fill=%22%2312121a%22 width=%221000%22 height=%22500%22/></svg>';

    DOM.heroBackdrop.style.backgroundImage = `url("${backdropUrl}")`;
    DOM.heroTitle.textContent = title;
    DOM.heroRating.textContent = rating;
    DOM.heroYear.textContent = year;
    DOM.heroDuration.textContent = type === 'movie' ? 'Filme' : 'Série';

    const genreNames = item.genres 
      ? item.genres.map(g => g.name) 
      : (item.genre_ids ? item.genre_ids.map(id => GENRE_MAP[id] || '').filter(Boolean) : []);
    
    DOM.heroGenres.innerHTML = genreNames.map(g => `<span>${g}</span>`).join('');
    DOM.heroDescription.textContent = item.overview || 'Sinopse indisponível.';

    DOM.heroWatchBtn.style.display = 'inline-flex';
    DOM.heroInfoBtn.style.display = 'inline-flex';
    DOM.heroBadge.style.display = 'inline-flex';
    DOM.heroMeta.style.display = 'flex';
    DOM.heroGenres.style.display = 'flex';

    DOM.heroWatchBtn.onclick = () => {
      if (type === 'movie') {
        openCinema(item.id, title, type);
      } else {
        showToast('Escolha uma temporada e episódio na seção de detalhes!', 'info');
        openDetail(item);
      }
    };

    DOM.heroInfoBtn.onclick = () => openDetail(item);

    // Auto-play trailer after 5 seconds
    stopMainHeroTrailer();
    STATE.heroTrailerTimeout = setTimeout(async () => {
      const trailer = await fetchTrailerUrl(item.id, type);
      if (trailer && STATE.currentPage === 'home') {
        DOM.heroTrailerIframe.src = trailer;
        DOM.heroTrailerIframe.style.display = 'block';
        DOM.heroTrailer.classList.add('active');
        STATE.heroTrailerPlaying = true;
        STATE.heroTrailerMuted = false;
        updateTrailerControlsUI('hero', true, false);
        if (DOM.heroTrailerControls) DOM.heroTrailerControls.style.display = 'flex';
      }
    }, 5000);
  }

  function stopMainHeroTrailer() {
    if (STATE.heroTrailerTimeout) {
      clearTimeout(STATE.heroTrailerTimeout);
      STATE.heroTrailerTimeout = null;
    }
    DOM.heroTrailer.classList.remove('active');
    DOM.heroTrailerIframe.src = '';
    DOM.heroTrailerIframe.style.display = 'none';
    if (DOM.heroTrailerControls) DOM.heroTrailerControls.style.display = 'none';
  }

  // ---------- Render List Pages ----------
  async function renderMoviesPage(genreId = null) {
    if (!STATE.tmdbApiKey) {
      showTMDBSetupMessage();
      return;
    }

    showLoadingSkeletons(DOM.moviesGridAll);

    // Refresh filter bar buttons
    const activeBtn = DOM.moviesFilterBar.querySelector('.filter-btn.active');
    const currentGenre = activeBtn ? activeBtn.dataset.genre : 'all';

    DOM.moviesFilterBar.innerHTML = `
      <button class="filter-btn ${currentGenre === 'all' ? 'active' : ''}" data-genre="all">Todos</button>
      ${Object.keys(PORTUGUESE_GENRES).map(name => `
        <button class="filter-btn ${currentGenre === name ? 'active' : ''}" data-genre="${name}">${name}</button>
      `).join('')}
    `;

    DOM.moviesFilterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        DOM.moviesFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const genre = btn.dataset.genre;
        const id = PORTUGUESE_GENRES[genre] || null;
        renderMoviesPage(id);
      };
    });

    try {
      const params = {};
      if (genreId) {
        params.with_genres = genreId;
      }

      const data = await tmdbFetch('/discover/movie', params);
      const results = data.results || [];

      if (results.length === 0) {
        DOM.moviesGridAll.innerHTML = `<div class="no-results">Nenhum filme encontrado para essa categoria.</div>`;
        return;
      }

      DOM.moviesGridAll.innerHTML = results.map((item, i) => createCardHTML(item, i, 'movie')).join('');
      attachCardEvents(DOM.moviesGridAll);

    } catch (err) {
      console.error("Erro ao carregar filmes:", err);
      showErrorState(DOM.moviesGridAll, "Erro ao conectar com o TMDB e puxar os filmes.");
    }
  }

  async function renderSeriesPage(genreId = null) {
    if (!STATE.tmdbApiKey) {
      showTMDBSetupMessage();
      return;
    }

    showLoadingSkeletons(DOM.seriesGridAll);

    // Refresh filter bar buttons
    const activeBtn = DOM.seriesFilterBar.querySelector('.filter-btn.active');
    const currentGenre = activeBtn ? activeBtn.dataset.genre : 'all';

    DOM.seriesFilterBar.innerHTML = `
      <button class="filter-btn ${currentGenre === 'all' ? 'active' : ''}" data-genre="all">Todas</button>
      ${Object.keys(PORTUGUESE_GENRES).map(name => `
        <button class="filter-btn ${currentGenre === name ? 'active' : ''}" data-genre="${name}">${name}</button>
      `).join('')}
    `;

    DOM.seriesFilterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        DOM.seriesFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const genre = btn.dataset.genre;
        const id = PORTUGUESE_GENRES[genre] || null;
        renderSeriesPage(id);
      };
    });

    try {
      const params = {};
      if (genreId) {
        params.with_genres = genreId;
      }

      const data = await tmdbFetch('/discover/tv', params);
      const results = data.results || [];

      if (results.length === 0) {
        DOM.seriesGridAll.innerHTML = `<div class="no-results">Nenhuma série encontrada para essa categoria.</div>`;
        return;
      }

      DOM.seriesGridAll.innerHTML = results.map((item, i) => createCardHTML(item, i, 'tv')).join('');
      attachCardEvents(DOM.seriesGridAll);

    } catch (err) {
      console.error("Erro ao carregar séries:", err);
      showErrorState(DOM.seriesGridAll, "Erro ao conectar com o TMDB e carregar as séries.");
    }
  }

  // ---------- Search ----------
  async function performSearch(query) {
    const q = query.trim();
    if (!q) {
      navigateTo('home');
      return;
    }

    navigateTo('search');
    DOM.searchResultsTitle.innerHTML = `Buscando por: <strong>"${q}"</strong>...`;
    showLoadingSkeletons(DOM.searchResultsGrid);

    try {
      const data = await tmdbFetch('/search/multi', { query: q });
      const results = (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');

      DOM.searchResultsTitle.innerHTML = `Resultados para: <strong>"${q}"</strong> (${results.length})`;

      if (results.length === 0) {
        DOM.searchResultsGrid.innerHTML = '';
        DOM.noResults.style.display = 'block';
      } else {
        DOM.noResults.style.display = 'none';
        DOM.searchResultsGrid.innerHTML = results.map((item, i) => createCardHTML(item, i)).join('');
        attachCardEvents(DOM.searchResultsGrid);
      }

    } catch (err) {
      console.error("Erro ao efetuar busca:", err);
      showErrorState(DOM.searchResultsGrid, "Erro ao efetuar busca. Verifique sua conexão.");
    }
  }

  // ---------- Details Modal ----------
  async function openDetail(movie) {
    STATE.currentMovieDetail = movie;

    stopMainHeroTrailer();

    const title = movie.title || movie.name || 'Sem Título';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = (movie.release_date || movie.first_air_date || '').substring(0, 4) || 'N/A';
    const type = movie.media_type || (movie.title ? 'movie' : 'tv');

    const backdropUrl = movie.backdrop_path 
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` 
      : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221000%22 height=%22500%22><rect fill=%22%2312121a%22 width=%221000%22 height=%22500%22/></svg>';

    DOM.modalHero.style.backgroundImage = `url("${backdropUrl}")`;
    DOM.modalTitle.textContent = title;
    DOM.modalRating.textContent = rating;
    DOM.modalYear.textContent = year;

    let durationLabel = '';
    if (type === 'movie') {
      durationLabel = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'Filme';
      DOM.modalWatchBtn.style.display = 'inline-flex';
      DOM.modalSeriesSelector.style.display = 'none';
    } else {
      durationLabel = movie.number_of_seasons ? `${movie.number_of_seasons} Temporada(s)` : 'Série';
      DOM.modalWatchBtn.style.display = 'none';
      DOM.modalSeriesSelector.style.display = 'block';

      loadSeasonsDropdown(movie);
    }

    DOM.modalDuration.textContent = durationLabel;
    DOM.modalTypeBadge.textContent = type === 'movie' ? 'Filme' : 'Série';

    const genreNames = movie.genres 
      ? movie.genres.map(g => g.name) 
      : (movie.genre_ids ? movie.genre_ids.map(id => GENRE_MAP[id] || '').filter(Boolean) : []);
    
    DOM.modalGenres.innerHTML = genreNames.map(g => `<span>${g}</span>`).join('');
    DOM.modalDescription.textContent = movie.overview || 'Sinopse indisponível em português.';

    updateFavoriteBtnState(movie.id);

    DOM.modalWatchBtn.onclick = () => {
      closeDetail();
      setTimeout(() => openCinema(movie.id, title, 'movie'), 300);
    };

    DOM.modalFavoriteBtn.onclick = () => {
      toggleFavorite(movie);
    };

    DOM.detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-play trailer in modal after 5 seconds
    stopModalTrailer();
    STATE.modalTrailerTimeout = setTimeout(async () => {
      const trailer = await fetchTrailerUrl(movie.id, type);
      if (trailer && DOM.detailModal.classList.contains('active')) {
        DOM.modalTrailerIframe.src = trailer;
        DOM.modalTrailerIframe.style.display = 'block';
        DOM.modalHeroTrailer.classList.add('active');
        STATE.modalTrailerPlaying = true;
        STATE.modalTrailerMuted = false;
        updateTrailerControlsUI('modal', true, false);
        if (DOM.modalTrailerControls) DOM.modalTrailerControls.style.display = 'flex';
      }
    }, 5000);
  }

  function closeDetail() {
    stopModalTrailer();
    DOM.detailModal.classList.remove('active');
    document.body.style.overflow = '';
    STATE.currentMovieDetail = null;

    DOM.modalSeasonSelect.innerHTML = '';
    DOM.modalEpisodesList.innerHTML = '';
    DOM.modalSeriesSelector.style.display = 'none';
  }

  function stopModalTrailer() {
    if (STATE.modalTrailerTimeout) {
      clearTimeout(STATE.modalTrailerTimeout);
      STATE.modalTrailerTimeout = null;
    }
    DOM.modalHeroTrailer.classList.remove('active');
    DOM.modalTrailerIframe.src = '';
    DOM.modalTrailerIframe.style.display = 'none';
    if (DOM.modalTrailerControls) DOM.modalTrailerControls.style.display = 'none';
  }

  // ---------- Seasons & Episodes Loading ----------
  function loadSeasonsDropdown(movie) {
    const seasons = movie.seasons || [];
    if (seasons.length === 0) {
      DOM.modalSeasonSelect.innerHTML = '<option value="">Nenhuma temporada</option>';
      DOM.modalEpisodesList.innerHTML = '<div class="no-results">Nenhum episódio disponível</div>';
      return;
    }

    const regularSeasons = seasons.filter(s => s.season_number > 0);
    const displaySeasons = regularSeasons.length > 0 ? regularSeasons : seasons;

    DOM.modalSeasonSelect.innerHTML = displaySeasons.map(s => `
      <option value="${s.season_number}">${s.name || `Temporada ${s.season_number}`} (${s.episode_count} eps)</option>
    `).join('');

    DOM.modalSeasonSelect.onchange = (e) => {
      const seasonNum = parseInt(e.target.value);
      loadEpisodesList(movie.id, seasonNum);
    };

    // Load first season by default
    const firstSeasonNum = displaySeasons[0].season_number;
    loadEpisodesList(movie.id, firstSeasonNum);
  }

  async function loadEpisodesList(seriesId, seasonNumber) {
    DOM.modalEpisodesList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <div style="margin: 0 auto 12px; width: 30px; height: 30px; border: 3px solid var(--accent-soft); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        Buscando episódios...
      </div>
    `;

    try {
      const data = await tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`);
      const episodes = data.episodes || [];

      if (episodes.length === 0) {
        DOM.modalEpisodesList.innerHTML = '<div class="no-results" style="grid-column:1/-1;">Nenhum episódio lançado nesta temporada.</div>';
        return;
      }

      DOM.modalEpisodesList.innerHTML = episodes.map(ep => {
        const stillPath = ep.still_path 
          ? `https://image.tmdb.org/t/p/w300${ep.still_path}` 
          : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22168%22><rect fill=%22%2312121a%22 width=%22300%22 height=%22168%22/><text fill=%22%236a6a7a%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%22150%22 y=%2284%22 text-anchor=%22middle%22>Sem Imagem</text></svg>';
        
        const epTitle = ep.name || `Episódio ${ep.episode_number}`;
        const epOverview = ep.overview || 'Descrição indisponível.';
        const airDate = ep.air_date ? new Date(ep.air_date).toLocaleDateString('pt-BR') : '';

        return `
          <div class="episode-item" data-episode="${ep.episode_number}" data-season="${seasonNumber}">
            <div class="episode-thumb-wrapper">
              <img class="episode-thumb" src="${stillPath}" alt="${epTitle}" loading="lazy">
              <div class="episode-play-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div class="episode-info">
              <div class="episode-header">
                <div class="episode-title">
                  <span class="episode-number">${ep.episode_number}.</span> ${epTitle}
                </div>
                ${airDate ? `<span class="episode-airdate">${airDate}</span>` : ''}
              </div>
              <p class="episode-overview">${epOverview}</p>
            </div>
          </div>
        `;
      }).join('');

      // Click event
      DOM.modalEpisodesList.querySelectorAll('.episode-item').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const epNum = item.dataset.episode;
          const sNum = item.dataset.season;
          const seriesName = STATE.currentMovieDetail ? (STATE.currentMovieDetail.name || STATE.currentMovieDetail.title) : 'Série';
          
          setTimeout(() => {
            openCinema(seriesId, `${seriesName} — T${sNum}:E${epNum}`, 'tv', sNum, epNum);
          }, 300);
        };
      });

    } catch (err) {
      console.error("Erro carregando episódios:", err);
      DOM.modalEpisodesList.innerHTML = '<div class="no-results" style="grid-column:1/-1;">Erro ao carregar episódios do TMDB.</div>';
    }
  }

  // ---------- Cinema Player Mode ----------
  function openCinema(tmdbId, title, type, season = null, episode = null) {
    stopMainHeroTrailer();
    closeDetail();

    DOM.cinemaTitle.textContent = title;
    
    let embedUrl = '';
    const progressKey = `darkflix_progress_${tmdbId}`;

    if (type === 'movie') {
      embedUrl = `https://myembed.biz/filme/${tmdbId}`;
      localStorage.setItem(progressKey, JSON.stringify({
        timestamp: Date.now(),
        type: 'movie',
        percent: 60 // Mock progress bar representation
      }));
    } else {
      embedUrl = `https://myembed.biz/serie/${tmdbId}/${season}/${episode}`;
      localStorage.setItem(progressKey, JSON.stringify({
        timestamp: Date.now(),
        type: 'tv',
        season: parseInt(season),
        episode: parseInt(episode)
      }));
    }

    DOM.cinemaVideo.style.display = 'none';
    DOM.cinemaVideo.src = '';
    
    DOM.cinemaIframe.src = embedUrl;
    DOM.cinemaIframe.style.display = 'block';

    DOM.cinemaExternalBtn.href = embedUrl;

    DOM.cinemaMode.classList.add('active');
    document.body.style.overflow = 'hidden';

    showToast('Iniciando player via MyEmbed.biz...', 'success');
  }

  function closeCinema() {
    DOM.cinemaMode.classList.remove('active');
    DOM.cinemaIframe.src = '';
    DOM.cinemaIframe.style.display = 'none';
    document.body.style.overflow = '';

    // Refresh indicators
    if (STATE.currentPage === 'home') renderHome();
    else if (STATE.currentPage === 'movies') renderMoviesPage();
    else if (STATE.currentPage === 'series') renderSeriesPage();
  }

  // ---------- Watchlist / Favorites Management ----------
  function toggleFavorite(movie) {
    const idx = STATE.favorites.findIndex(item => Number(item.id) === Number(movie.id));
    const title = movie.title || movie.name;

    if (idx > -1) {
      STATE.favorites.splice(idx, 1);
      showToast(`"${title}" removido da Minha Lista.`, 'info');
    } else {
      STATE.favorites.push({
        id: movie.id,
        title: title,
        name: movie.name || movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
        first_air_date: movie.first_air_date || movie.release_date,
        media_type: movie.media_type || (movie.title ? 'movie' : 'tv')
      });
      showToast(`"${title}" adicionado à Minha Lista!`, 'success');
    }

    localStorage.setItem('darkflix_favorites', JSON.stringify(STATE.favorites));
    updateFavoriteBtnState(movie.id);

    if (STATE.currentPage === 'home') renderHome();
  }

  function updateFavoriteBtnState(movieId) {
    const isFavorite = STATE.favorites.some(item => Number(item.id) === Number(movieId));
    const heart = DOM.modalFavoriteBtn.querySelector('.heart-icon');
    
    if (isFavorite) {
      DOM.modalFavoriteBtn.classList.add('btn-primary');
      DOM.modalFavoriteBtn.classList.remove('btn-secondary');
      DOM.modalFavoriteText.textContent = 'Na Minha Lista';
      if (heart) heart.setAttribute('fill', 'currentColor');
    } else {
      DOM.modalFavoriteBtn.classList.remove('btn-primary');
      DOM.modalFavoriteBtn.classList.add('btn-secondary');
      DOM.modalFavoriteText.textContent = 'Minha Lista';
      if (heart) heart.setAttribute('fill', 'none');
    }
  }



  // ---------- Setup Core Event Bindings ----------
  function initApp() {
    // Window header scroll glass effect
    window.addEventListener('scroll', () => {
      DOM.header.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Navigation bindings
    $$('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });

    // Logo home click
    DOM.logoHome.addEventListener('click', () => {
      navigateTo('home');
    });

    // Menu Mobile toggle
    DOM.menuToggle.addEventListener('click', () => {
      DOM.menuToggle.classList.toggle('active');
      DOM.navMenu.classList.toggle('open');
    });

    // Search input bounce
    DOM.searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (STATE.searchDebounce) clearTimeout(STATE.searchDebounce);
      STATE.searchDebounce = setTimeout(() => {
        performSearch(val);
      }, 600);
    });

    // Close buttons modal & cinema
    DOM.modalCloseBtn.onclick = () => closeDetail();
    DOM.cinemaCloseBtn.onclick = () => closeCinema();

    // Modals backdrop clicks to close
    DOM.detailModal.onclick = (e) => {
      if (e.target === DOM.detailModal) closeDetail();
    };
    DOM.cinemaMode.onclick = (e) => {
      if (e.target === DOM.cinemaMode) closeCinema();
    };

    // Keyboard ESC to close active overlays
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDetail();
        closeCinema();
      }
    });

    // Bind Hero Trailer controls
    if (DOM.heroTrailerPlayPause) {
      DOM.heroTrailerPlayPause.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        STATE.heroTrailerPlaying = !STATE.heroTrailerPlaying;
        sendTrailerCommand(DOM.heroTrailerIframe, STATE.heroTrailerPlaying ? 'playVideo' : 'pauseVideo');
        updateTrailerControlsUI('hero', STATE.heroTrailerPlaying, STATE.heroTrailerMuted);
      };
    }
    if (DOM.heroTrailerMuteUnmute) {
      DOM.heroTrailerMuteUnmute.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        STATE.heroTrailerMuted = !STATE.heroTrailerMuted;
        sendTrailerCommand(DOM.heroTrailerIframe, STATE.heroTrailerMuted ? 'mute' : 'unMute');
        updateTrailerControlsUI('hero', STATE.heroTrailerPlaying, STATE.heroTrailerMuted);
      };
    }

    // Bind Modal Trailer controls
    if (DOM.modalTrailerPlayPause) {
      DOM.modalTrailerPlayPause.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        STATE.modalTrailerPlaying = !STATE.modalTrailerPlaying;
        sendTrailerCommand(DOM.modalTrailerIframe, STATE.modalTrailerPlaying ? 'playVideo' : 'pauseVideo');
        updateTrailerControlsUI('modal', STATE.modalTrailerPlaying, STATE.modalTrailerMuted);
      };
    }
    if (DOM.modalTrailerMuteUnmute) {
      DOM.modalTrailerMuteUnmute.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        STATE.modalTrailerMuted = !STATE.modalTrailerMuted;
        sendTrailerCommand(DOM.modalTrailerIframe, STATE.modalTrailerMuted ? 'mute' : 'unMute');
        updateTrailerControlsUI('modal', STATE.modalTrailerPlaying, STATE.modalTrailerMuted);
      };
    }

    // Bind Cinema Rewind/Forward buttons
    if (DOM.cinemaRewindBtn) {
      DOM.cinemaRewindBtn.onclick = (e) => {
        e.preventDefault();
        if (DOM.cinemaVideo.style.display !== 'none') {
          DOM.cinemaVideo.currentTime = Math.max(0, DOM.cinemaVideo.currentTime - 15);
        } else {
          try {
            const iframeWindow = DOM.cinemaIframe.contentWindow;
            if (iframeWindow) {
              iframeWindow.postMessage(JSON.stringify({ event: 'seek', value: -15 }), '*');
              iframeWindow.postMessage(JSON.stringify({ method: 'seek', value: -15 }), '*');
            }
          } catch (err) {}
          showToast("Tentando voltar 15s... Use os controles na tela se necessário.", "info");
        }
      };
    }
    if (DOM.cinemaForwardBtn) {
      DOM.cinemaForwardBtn.onclick = (e) => {
        e.preventDefault();
        if (DOM.cinemaVideo.style.display !== 'none') {
          DOM.cinemaVideo.currentTime = Math.min(DOM.cinemaVideo.duration || 0, DOM.cinemaVideo.currentTime + 15);
        } else {
          try {
            const iframeWindow = DOM.cinemaIframe.contentWindow;
            if (iframeWindow) {
              iframeWindow.postMessage(JSON.stringify({ event: 'seek', value: 15 }), '*');
              iframeWindow.postMessage(JSON.stringify({ method: 'seek', value: 15 }), '*');
            }
          } catch (err) {}
          showToast("Tentando avançar 15s... Use os controles na tela se necessário.", "info");
        }
      };
    }

    // First load
    navigateTo('home');
  }

  // Run initial setup on load
  window.addEventListener('DOMContentLoaded', initApp);

})();
