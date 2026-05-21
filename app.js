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

  // Anime-specific genre map (TMDB TV genre IDs relevant to anime)
  const ANIME_GENRES = {
    "Ação & Aventura": 10759,
    "Comédia": 35,
    "Drama": 18,
    "Fantasia": 14,
    "Ficção Científica": 10765,
    "Romance": 10749,
    "Terror": 27,
    "Mistério": 9648,
    "Slice of Life": 18,
    "Animação": 16
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
      animes: $('#page-animes'),
      search: $('#page-search')
    },
    
    // Grid lists
    moviesGridAll: $('#movies-grid-all'),
    seriesGridAll: $('#series-grid-all'),
    moviesFilterBar: $('#movies-filter-bar'),
    seriesFilterBar: $('#series-filter-bar'),
    animesGridAll: $('#animes-grid-all'),
    animesFilterBar: $('#animes-filter-bar'),
    
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
    
    // Mobile categories accordion
    mobileMoviesTrigger: $('#mobile-movies-trigger'),
    mobileMoviesList: $('#mobile-movies-list'),
    mobileSeriesTrigger: $('#mobile-series-trigger'),
    mobileSeriesList: $('#mobile-series-list'),
    mobileAnimesTrigger: $('#mobile-animes-trigger'),
    mobileAnimesList: $('#mobile-animes-list'),

    // Desktop categories dropdown
    categoriesWrapper: $('#nav-categories-wrapper'),
    categoriesBtn: $('#nav-categories-btn'),
    categoriesDropdown: $('#categories-dropdown'),
    
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
        return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&enablejsapi=1&playsinline=1`;
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

  function saveWatchProgress(id, title, type, details = {}) {
    let inProgress = JSON.parse(localStorage.getItem('darkflix_in_progress') || '[]');
    
    // Obter metadados do item de STATE.currentMovieDetail ou criar fallback
    const movie = STATE.currentMovieDetail || {};
    
    // Remover item anterior com mesmo ID se existir para colocar no topo (mais recente)
    inProgress = inProgress.filter(x => Number(x.id) !== Number(id));
    
    const progressItem = {
      id: Number(id),
      title: movie.title || movie.name || title,
      name: movie.name || movie.title || title,
      poster_path: movie.poster_path || '',
      backdrop_path: movie.backdrop_path || '',
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || '',
      first_air_date: movie.first_air_date || movie.release_date || '',
      media_type: type,
      timestamp: Date.now(),
      ...details
    };
    
    inProgress.unshift(progressItem);
    
    // Limitar para os últimos 12 itens
    if (inProgress.length > 12) {
      inProgress.pop();
    }
    
    localStorage.setItem('darkflix_in_progress', JSON.stringify(inProgress));
    
    // Também manter compatibilidade com o progresso individual
    localStorage.setItem(`darkflix_progress_${id}`, JSON.stringify(details));
  }

  // ---------- Navigation ----------
  function navigateTo(page) {
    STATE.currentPage = page;
    
    // Force solid blurred dark header background on inner pages to prevent clashing content
    if (DOM.header) {
      if (page !== 'home') {
        DOM.header.classList.add('scrolled');
      } else {
        DOM.header.classList.toggle('scrolled', window.scrollY > 20);
      }
    }
    
    // Reset page visibility
    Object.keys(DOM.pages).forEach((key) => {
      if (DOM.pages[key]) DOM.pages[key].classList.toggle('active', key === page);
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
    else if (page === 'animes') renderAnimesPage();
  }

  function navigateToGenre(type, genreName) {
    const genreId = type === 'animes' ? (ANIME_GENRES[genreName] || null) : (PORTUGUESE_GENRES[genreName] || null);
    STATE.currentPage = type;
    
    // Reset page visibility
    Object.keys(DOM.pages).forEach((key) => {
      if (DOM.pages[key]) DOM.pages[key].classList.toggle('active', key === type);
    });

    // Update active nav link
    $$('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === type);
    });

    // Mobile menu reset
    DOM.navMenu.classList.remove('open');
    DOM.menuToggle.classList.remove('active');
    
    // Stop trailers
    stopMainHeroTrailer();
    closeDetail();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render with genre pre-filtered
    if (type === 'movies') {
      renderMoviesPage(genreId);
      // Wait for rendering to complete, then update filter bar active button
      setTimeout(() => {
        const filterBar = DOM.moviesFilterBar;
        if (filterBar) {
          filterBar.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.genre === (genreName || 'all'));
          });
        }
      }, 50);
    } else if (type === 'series') {
      renderSeriesPage(genreId);
      // Wait for rendering to complete, then update filter bar active button
      setTimeout(() => {
        const filterBar = DOM.seriesFilterBar;
        if (filterBar) {
          filterBar.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.genre === (genreName || 'all'));
          });
        }
      }, 50);
    } else if (type === 'animes') {
      renderAnimesPage(genreId);
      setTimeout(() => {
        const filterBar = DOM.animesFilterBar;
        if (filterBar) {
          filterBar.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.genre === (genreName || 'all'));
          });
        }
      }, 50);
    }
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
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); margin-bottom: 24px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h2 style="font-size: 1.8rem; margin-bottom: 12px; font-weight: 800;">Erro de Conexão</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
          Não foi possível conectar ao catálogo do TMDB. Verifique sua conexão com a internet e tente novamente.
        </p>
        <button class="btn btn-primary" onclick="location.reload()">
          Tentar Novamente
        </button>
      </div>
    `;

    DOM.heroBackdrop.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221000%22 height=%22500%22><rect fill=%22%2312121a%22 width=%221000%22 height=%22500%22/></svg>')`;
    DOM.heroTitle.textContent = "Bem-vindo ao DarkFlix";
    DOM.heroDescription.textContent = "Carregando catálogo...";
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
      // Categorias por gênero de FILMES
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
        { title: 'Fantasia', id: '14' },
        { title: 'Thrillers Psicológicos', id: '53,9648' },
        { title: 'Cinema Independente', id: '18,10770' }
      ];

      // Categorias por gênero de SÉRIES
      const seriesCategories = [
        { title: 'Séries de Drama', id: '18' },
        { title: 'Séries de Comédia', id: '35' },
        { title: 'Séries de Ação e Aventura', id: '10759' },
        { title: 'Séries de Crime', id: '80' },
        { title: 'Séries de Ficção Científica e Fantasia', id: '10765' },
        { title: 'Séries de Mistério', id: '9648' },
        { title: 'Séries de Animação', id: '16' },
        { title: 'Séries Documentários', id: '99' },
        { title: 'Séries de Romance', id: '10749' },
        { title: 'Séries de Terror', id: '27' },
        { title: 'Reality Shows', id: '10764' },
        { title: 'Séries de Guerra e Política', id: '10768' }
      ];

      // Requests base (índices 0-12)
      const requests = [
        tmdbFetch('/movie/now_playing').catch(() => ({ results: [] })),                   // 0
        tmdbFetch('/movie/now_playing', { page: 2 }).catch(() => ({ results: [] })),       // 1
        tmdbFetch('/trending/movie/week').catch(() => ({ results: [] })),                  // 2
        tmdbFetch('/trending/tv/week').catch(() => ({ results: [] })),                     // 3
        tmdbFetch('/movie/top_rated').catch(() => ({ results: [] })),                      // 4
        tmdbFetch('/movie/upcoming').catch(() => ({ results: [] })),                       // 5
        tmdbFetch('/movie/popular').catch(() => ({ results: [] })),                        // 6
        tmdbFetch('/movie/popular', { page: 2 }).catch(() => ({ results: [] })),           // 7
        tmdbFetch('/trending/tv/day').catch(() => ({ results: [] })),                      // 8
        Promise.resolve(null),                                                             // 9
        tmdbFetch('/tv/top_rated').catch(() => ({ results: [] })),                         // 10
        tmdbFetch('/tv/on_the_air').catch(() => ({ results: [] })),                        // 11
        tmdbFetch('/tv/popular').catch(() => ({ results: [] }))                            // 12
      ];

      const baseRequestCount = requests.length; // 13

      // Requests das categorias por gênero de FILMES
      homeCategories.forEach(cat => {
        requests.push(tmdbFetch('/discover/movie', { with_genres: cat.id, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })));
      });

      const afterMovieCats = requests.length;

      // Requests das categorias por gênero de SÉRIES
      seriesCategories.forEach(cat => {
        requests.push(tmdbFetch('/discover/tv', { with_genres: cat.id, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })));
      });

      // Request especial para Animes (Animações com idioma original Japonês 'ja')
      requests.push(tmdbFetch('/discover/tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })));

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
      const tvTopRated = responses[10];
      const tvOnTheAir = responses[11];
      const tvPopular = responses[12];
      const movieCategoryResults = responses.slice(baseRequestCount, afterMovieCats);
      const seriesCategoryResults = responses.slice(afterMovieCats, responses.length - 1);
      const animeResults = responses[responses.length - 1];

      // Combinar páginas
      const nowPlayingAll = [...(nowPlaying1.results || []), ...(nowPlaying2.results || [])];
      const popularAll = [...(popular1.results || []), ...(popular2.results || [])];

      // Set featured on banner (daily rotating movie/series)
      const heroItem = await selectDailyFeaturedItem(nowPlayingAll, trendingSeries.results);
      renderHero(heroItem || trendingMovies.results[0]);

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

      // ======= CONTINUE ASSISTINDO =======
      let inProgressList = JSON.parse(localStorage.getItem('darkflix_in_progress') || '[]');
      
      // Asynchronously repair missing metadata in history
      let repairedAny = false;
      for (let i = 0; i < inProgressList.length; i++) {
        const item = inProgressList[i];
        if (!item.poster_path && item.id) {
          try {
            const details = await tmdbFetch(`/${item.media_type || 'movie'}/${item.id}`);
            if (details && details.poster_path) {
              item.poster_path = details.poster_path;
              item.backdrop_path = item.backdrop_path || details.backdrop_path;
              item.title = details.title || details.name || item.title;
              item.name = details.name || details.title || item.name;
              item.vote_average = details.vote_average || item.vote_average;
              item.release_date = details.release_date || details.first_air_date || item.release_date;
              item.first_air_date = details.first_air_date || details.release_date || item.first_air_date;
              repairedAny = true;
            }
          } catch (e) {
            console.warn(`Erro reparando metadados do item ${item.id}`, e);
          }
        }
      }
      if (repairedAny) {
        localStorage.setItem('darkflix_in_progress', JSON.stringify(inProgressList));
      }

      html += `
        <section class="section section-continue-watching">
          <div class="section-header">
            <h2 class="section-title">▶ Continuar Assistindo</h2>
            ${inProgressList.length > 0 ? '<button class="btn-clear-history" id="btn-clear-history">Limpar Histórico</button>' : ''}
          </div>
          <div class="movies-row">
            ${inProgressList.length > 0 ? 
              inProgressList.map((item, i) => createCardHTML(item, i, item.media_type || 'movie')).join('') :
              `<div class="empty-continue-watching" style="grid-column: 1 / -1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: var(--radius-lg); text-align: center; gap: 12px; min-height: 150px; margin-bottom: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 4px;"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">Nenhum título em andamento</div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); max-width: 320px;">Os filmes e séries que você começar a assistir aparecerão aqui para você continuar de onde parou.</div>
              </div>`
            }
          </div>
        </section>
      `;

      // 1. Lançamentos no Cinema
      html += buildSection('Lançamentos no Cinema', nowPlayingAll, 'movie');

      // 2. Minha Lista
      if (STATE.favorites.length > 0) {
        html += buildSection('Minha Lista', STATE.favorites, 'movie');
      }

      // 3. Filmes em Destaque (trending semana)
      html += buildSection('Filmes em Destaque', trendingMovies.results, 'movie');

      // 4. Séries Populares (trending semana)
      html += buildSection('Séries Populares', trendingSeries.results, 'tv');

      // 5. Séries no Ar Agora
      html += buildSection('Séries no Ar Agora', tvOnTheAir.results, 'tv');

      // 6. Mais Bem Avaliados de Todos os Tempos
      html += buildSection('Mais Bem Avaliados', topRated.results, 'movie');

      // 7. Séries Mais Bem Avaliadas
      html += buildSection('Séries Mais Bem Avaliadas', tvTopRated.results, 'tv');

      // 9. Populares Agora
      html += buildSection('Populares Agora', popularAll, 'movie');

      // 10. Séries Populares Agora
      html += buildSection('Séries Populares Agora', tvPopular.results, 'tv');

      // 11. Séries em Alta Hoje
      html += buildSection('Séries em Alta Hoje', trendingSeriesDay.results, 'tv');

      // 11.5 Animes
      const animeShows = animeResults.results || [];
      html += buildSection('Animes de Sucesso', animeShows, 'tv');

      // 12. Categorias de séries por gênero
      seriesCategories.forEach((cat, index) => {
        const results = seriesCategoryResults[index].results || [];
        html += buildSection(cat.title, results, 'tv');
      });

      // 13. Categorias de filmes por gênero
      homeCategories.forEach((cat, index) => {
        const results = movieCategoryResults[index].results || [];
        html += buildSection(cat.title, results, 'movie');
      });

      DOM.homeContent.innerHTML = html || `
        <div class="no-results">
          <h3>Nenhum conteúdo carregado</h3>
          <p>Verifique sua chave ou tente novamente mais tarde.</p>
        </div>
      `;

      attachCardEvents(DOM.homeContent);

      // Bind "Limpar Histórico" button
      const clearBtn = document.getElementById('btn-clear-history');
      if (clearBtn) {
        clearBtn.onclick = () => {
          // Remover lista global
          const oldList = JSON.parse(localStorage.getItem('darkflix_in_progress') || '[]');
          oldList.forEach(item => {
            localStorage.removeItem(`darkflix_progress_${item.id}`);
          });
          localStorage.removeItem('darkflix_in_progress');
          showToast('Histórico de "Continuar Assistindo" limpo!', 'info');
          renderHome();
        };
      }

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

  async function selectDailyFeaturedItem(nowPlayingMovies, trendingSeriesList) {
    // Curated list of classic highly requested series/movies to mix in
    const curatedClassics = [
      { id: 71446, media_type: 'tv' },   // La Casa de Papel
      { id: 210815, media_type: 'tv' },  // Berlim
      { id: 66732, media_type: 'tv' },   // Stranger Things
      { id: 1396, media_type: 'tv' },    // Breaking Bad
      { id: 70523, media_type: 'tv' },   // Dark
      { id: 119051, media_type: 'tv' },  // Wandinha (Wednesday)
      { id: 157336, media_type: 'movie' } // Interstellar
    ];

    const candidates = [];

    // Add curated hits
    curatedClassics.forEach(item => {
      candidates.push({ id: item.id, media_type: item.media_type });
    });

    // Add cinema releases
    if (nowPlayingMovies && nowPlayingMovies.length > 0) {
      nowPlayingMovies.forEach(item => {
        candidates.push({ id: item.id, media_type: 'movie', data: item });
      });
    }

    // Add trending series
    if (trendingSeriesList && trendingSeriesList.length > 0) {
      trendingSeriesList.forEach(item => {
        candidates.push({ id: item.id, media_type: 'tv', data: item });
      });
    }

    // Deduplicate candidates by key (media_type + id)
    const uniqueCandidates = [];
    const seen = new Set();
    candidates.forEach(item => {
      const key = `${item.media_type}_${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCandidates.push(item);
      }
    });

    if (uniqueCandidates.length === 0) return null;

    // Sort candidates by ID to ensure deterministic order regardless of TMDB response order
    uniqueCandidates.sort((a, b) => a.id - b.id);

    // Use current date to pick a deterministic index
    const today = new Date();
    // Deterministic hash based on year, month, and day
    const dateHash = today.getFullYear() * 1000 + (today.getMonth() + 1) * 31 + today.getDate();
    const index = dateHash % uniqueCandidates.length;
    const selected = uniqueCandidates[index];

    // If we already have the full data object, return it
    if (selected.data) {
      return selected.data;
    }

    // Otherwise, fetch the full details for the curated classic
    try {
      const details = await tmdbFetch(`/${selected.media_type}/${selected.id}`);
      details.media_type = selected.media_type;
      return details;
    } catch (e) {
      console.warn("Error fetching curated classic details, falling back", e);
      return nowPlayingMovies[0] || null;
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
        STATE.currentMovieDetail = item;
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
        STATE.heroTrailerMuted = true;
        updateTrailerControlsUI('hero', true, true);
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

  // ---------- Render Animes Page ----------
  async function renderAnimesPage(genreId = null) {
    if (!STATE.tmdbApiKey) {
      showTMDBSetupMessage();
      return;
    }

    showLoadingSkeletons(DOM.animesGridAll);

    // Refresh filter bar buttons
    const activeBtn = DOM.animesFilterBar.querySelector('.filter-btn.active');
    const currentGenre = activeBtn ? activeBtn.dataset.genre : 'all';

    DOM.animesFilterBar.innerHTML = `
      <button class="filter-btn ${currentGenre === 'all' ? 'active' : ''}" data-genre="all">Todos</button>
      ${Object.keys(ANIME_GENRES).map(name => `
        <button class="filter-btn ${currentGenre === name ? 'active' : ''}" data-genre="${name}">${name}</button>
      `).join('')}
    `;

    DOM.animesFilterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        DOM.animesFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const genre = btn.dataset.genre;
        const id = ANIME_GENRES[genre] || null;
        renderAnimesPage(id);
      };
    });

    try {
      // Mapeamento de gêneros de filmes para equivalentes de TV em caso de gêneros não nativos de TV no TMDB
      let tvGenreId = genreId;
      if (genreId === 10749) { // Romance (filme) -> Drama (TV 18)
        tvGenreId = 18;
      } else if (genreId === 27) { // Terror (filme) -> Mistério (TV 9648)
        tvGenreId = 9648;
      }

      const tvParams = {
        with_genres: tvGenreId ? `16,${tvGenreId}` : '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc'
      };

      const movieParams = {
        with_genres: genreId ? `16,${genreId}` : '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc'
      };

      // Fazer buscas paralelas de séries de TV e filmes para juntar tudo na mesma página
      const [tvPage1, tvPage2, moviePage1, moviePage2] = await Promise.all([
        tmdbFetch('/discover/tv', { ...tvParams, page: 1 }),
        tmdbFetch('/discover/tv', { ...tvParams, page: 2 }),
        tmdbFetch('/discover/movie', { ...movieParams, page: 1 }),
        tmdbFetch('/discover/movie', { ...movieParams, page: 2 })
      ]);

      const tvResults = [
        ...(tvPage1.results || []),
        ...(tvPage2.results || [])
      ].map(item => ({ ...item, media_type: 'tv' }));

      const movieResults = [
        ...(moviePage1.results || []),
        ...(moviePage2.results || [])
      ].map(item => ({ ...item, media_type: 'movie' }));

      // Mesclar e ordenar os animes por popularidade (garante os mais famosos no início)
      const results = [...tvResults, ...movieResults].sort((a, b) => b.popularity - a.popularity);

      if (results.length === 0) {
        DOM.animesGridAll.innerHTML = `<div class="no-results">Nenhum anime encontrado para essa categoria.</div>`;
        return;
      }

      DOM.animesGridAll.innerHTML = results.map((item, i) => createCardHTML(item, i)).join('');
      attachCardEvents(DOM.animesGridAll);

    } catch (err) {
      console.error("Erro ao carregar animes:", err);
      showErrorState(DOM.animesGridAll, "Erro ao conectar com o TMDB e carregar os animes.");
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
        STATE.modalTrailerMuted = true;
        updateTrailerControlsUI('modal', true, true);
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

    const progressKey = `darkflix_progress_${movie.id}`;
    const progressData = localStorage.getItem(progressKey);
    let savedSeason = null;
    let savedEpisode = null;

    if (progressData) {
      try {
        const prog = JSON.parse(progressData);
        if (prog && prog.season) {
          savedSeason = parseInt(prog.season);
          savedEpisode = parseInt(prog.episode);
        }
      } catch (e) {}
    }

    DOM.modalSeasonSelect.onchange = (e) => {
      const seasonNum = parseInt(e.target.value);
      const highlightEp = (savedSeason === seasonNum) ? savedEpisode : null;
      loadEpisodesList(movie.id, seasonNum, highlightEp);
    };

    if (savedSeason && displaySeasons.some(s => parseInt(s.season_number) === savedSeason)) {
      DOM.modalSeasonSelect.value = savedSeason;
      loadEpisodesList(movie.id, savedSeason, savedEpisode);
    } else {
      const firstSeasonNum = displaySeasons[0].season_number;
      loadEpisodesList(movie.id, firstSeasonNum);
    }
  }

  async function loadEpisodesList(seriesId, seasonNumber, lastWatchedEpisode = null) {
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

        const isLastWatched = lastWatchedEpisode && parseInt(ep.episode_number) === parseInt(lastWatchedEpisode);
        const extraClass = isLastWatched ? ' last-watched' : '';

        return `
          <div class="episode-item${extraClass}" data-episode="${ep.episode_number}" data-season="${seasonNumber}">
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

      if (lastWatchedEpisode) {
        setTimeout(() => {
          const activeEp = DOM.modalEpisodesList.querySelector('.episode-item.last-watched');
          if (activeEp) {
            activeEp.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }

    } catch (err) {
      console.error("Erro carregando episódios:", err);
      DOM.modalEpisodesList.innerHTML = '<div class="no-results" style="grid-column:1/-1;">Erro ao carregar episódios do TMDB.</div>';
    }
  }

  // ---------- Cinema Player Mode ----------
  function openCinema(tmdbId, title, type, season = null, episode = null) {
    // Salvar progresso com metadados completos de STATE.currentMovieDetail antes de fechar o modal
    if (type === 'movie') {
      saveWatchProgress(tmdbId, title, 'movie', {
        timestamp: Date.now(),
        type: 'movie',
        percent: 60 // Mock progress bar representation
      });
    } else {
      saveWatchProgress(tmdbId, title, 'tv', {
        timestamp: Date.now(),
        type: 'tv',
        season: parseInt(season),
        episode: parseInt(episode)
      });
    }

    stopMainHeroTrailer();
    closeDetail(); // closeDetail limpa com segurança STATE.currentMovieDetail agora!

    DOM.cinemaTitle.textContent = title;
    
    let embedUrl = '';

    if (type === 'movie') {
      embedUrl = `https://myembed.biz/filme/${tmdbId}`;
    } else {
      embedUrl = `https://myembed.biz/serie/${tmdbId}/${season}/${episode}`;
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
    // Render and bind Mobile categories accordion
    if (DOM.mobileMoviesList && DOM.mobileSeriesList) {
      // 1. Populate Lists
      const genresList = Object.keys(PORTUGUESE_GENRES);
      
      DOM.mobileMoviesList.innerHTML = genresList.map(name => `
        <button class="mobile-category-item" data-genre="${name}">${name}</button>
      `).join('');
      
      DOM.mobileSeriesList.innerHTML = genresList.map(name => `
        <button class="mobile-category-item" data-genre="${name}">${name}</button>
      `).join('');

      // 2. Bind Triggers (Accordion Toggle)
      DOM.mobileMoviesTrigger.onclick = (e) => {
        e.preventDefault();
        DOM.mobileMoviesTrigger.classList.toggle('active');
        DOM.mobileMoviesList.classList.toggle('open');
        
        // Auto-close other accordion for a premium accordion feel
        DOM.mobileSeriesTrigger.classList.remove('active');
        DOM.mobileSeriesList.classList.remove('open');
      };

      DOM.mobileSeriesTrigger.onclick = (e) => {
        e.preventDefault();
        DOM.mobileSeriesTrigger.classList.toggle('active');
        DOM.mobileSeriesList.classList.toggle('open');
        
        // Auto-close other accordion for a premium accordion feel
        DOM.mobileMoviesTrigger.classList.remove('active');
        DOM.mobileMoviesList.classList.remove('open');
      };

      // 3. Bind Item Click Navigation
      DOM.mobileMoviesList.querySelectorAll('.mobile-category-item').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          const genre = item.dataset.genre;
          navigateToGenre('movies', genre);
        };
      });

      DOM.mobileSeriesList.querySelectorAll('.mobile-category-item').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          const genre = item.dataset.genre;
          navigateToGenre('series', genre);
        };
      });
    }

    // Render and bind Mobile Animes categories accordion
    if (DOM.mobileAnimesList && DOM.mobileAnimesTrigger) {
      const animeGenresList = Object.keys(ANIME_GENRES);
      
      DOM.mobileAnimesList.innerHTML = animeGenresList.map(name => `
        <button class="mobile-category-item" data-genre="${name}">${name}</button>
      `).join('');

      DOM.mobileAnimesTrigger.onclick = (e) => {
        e.preventDefault();
        DOM.mobileAnimesTrigger.classList.toggle('active');
        DOM.mobileAnimesList.classList.toggle('open');
        
        // Auto-close other accordions
        DOM.mobileMoviesTrigger.classList.remove('active');
        DOM.mobileMoviesList.classList.remove('open');
        DOM.mobileSeriesTrigger.classList.remove('active');
        DOM.mobileSeriesList.classList.remove('open');
      };

      // Also close anime accordion when opening movies or series
      const origMoviesTrigger = DOM.mobileMoviesTrigger.onclick;
      DOM.mobileMoviesTrigger.onclick = (e) => {
        e.preventDefault();
        DOM.mobileMoviesTrigger.classList.toggle('active');
        DOM.mobileMoviesList.classList.toggle('open');
        DOM.mobileSeriesTrigger.classList.remove('active');
        DOM.mobileSeriesList.classList.remove('open');
        DOM.mobileAnimesTrigger.classList.remove('active');
        DOM.mobileAnimesList.classList.remove('open');
      };

      DOM.mobileSeriesTrigger.onclick = (e) => {
        e.preventDefault();
        DOM.mobileSeriesTrigger.classList.toggle('active');
        DOM.mobileSeriesList.classList.toggle('open');
        DOM.mobileMoviesTrigger.classList.remove('active');
        DOM.mobileMoviesList.classList.remove('open');
        DOM.mobileAnimesTrigger.classList.remove('active');
        DOM.mobileAnimesList.classList.remove('open');
      };

      DOM.mobileAnimesList.querySelectorAll('.mobile-category-item').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          const genre = item.dataset.genre;
          navigateToGenre('animes', genre);
        };
      });
    }

    // Window header scroll glass effect
    window.addEventListener('scroll', () => {
      if (STATE.currentPage !== 'home') {
        DOM.header.classList.add('scrolled');
      } else {
        DOM.header.classList.toggle('scrolled', window.scrollY > 20);
      }
    });

    // Navigation bindings
    $$('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        // Prevent "Categorias" button from triggering page navigation since it's a dropdown toggle
        if (link.id === 'nav-categories-btn') return;
        
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

    // ---------- Desktop Categories Dropdown ----------
    if (DOM.categoriesBtn && DOM.categoriesDropdown) {
      // Populate dropdown with genre sections
      const filmIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>';
      const tvIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>';
      const animeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

      const movieGenres = Object.keys(PORTUGUESE_GENRES);
      const seriesGenreNames = ['Drama', 'Comédia', 'Ação', 'Crime', 'Ficção Científica', 'Mistério', 'Animação', 'Documentário', 'Romance', 'Terror'];
      const animeGenreNames = Object.keys(ANIME_GENRES);

      DOM.categoriesDropdown.innerHTML = `
        <div class="categories-section">
          <div class="categories-section-title">${filmIcon} Filmes</div>
          <div class="categories-grid">
            ${movieGenres.map(name => `<button class="category-pill" data-type="movies" data-genre="${name}">${name}</button>`).join('')}
          </div>
        </div>
        <div class="categories-section">
          <div class="categories-section-title">${tvIcon} Séries</div>
          <div class="categories-grid">
            ${seriesGenreNames.map(name => `<button class="category-pill" data-type="series" data-genre="${name}">${name}</button>`).join('')}
          </div>
        </div>
        <div class="categories-section">
          <div class="categories-section-title">${animeIcon} Animes</div>
          <div class="categories-grid">
            ${animeGenreNames.map(name => `<button class="category-pill" data-type="animes" data-genre="${name}">${name}</button>`).join('')}
          </div>
        </div>
      `;

      // Toggle dropdown
      DOM.categoriesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.categoriesWrapper.classList.toggle('open');
      });

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!DOM.categoriesWrapper.contains(e.target)) {
          DOM.categoriesWrapper.classList.remove('open');
        }
      });

      // Navigate on pill click
      DOM.categoriesDropdown.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          const type = pill.dataset.type;
          const genre = pill.dataset.genre;
          DOM.categoriesWrapper.classList.remove('open');
          navigateToGenre(type, genre);
        });
      });
    }

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
