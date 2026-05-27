// ============================================================
// DarkFlix - Premium TMDB API & MyEmbed Iframe Player Client
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, child, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8-QC4CiWHU_lXuAPE1It68iEupLP-pRY",
  authDomain: "darkflix-e7a8d.firebaseapp.com",
  databaseURL: "https://darkflix-e7a8d-default-rtdb.firebaseio.com",
  projectId: "darkflix-e7a8d",
  storageBucket: "darkflix-e7a8d.firebasestorage.app",
  messagingSenderId: "136265036172",
  appId: "1:136265036172:web:d407505cdd85e9becea6a9",
  measurementId: "G-RETWHJEYT0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Avatares Predefinidos Categorizados
const AVATAR_CATEGORIES = [
  {
    title: 'La Casa de Papel & Berlim',
    avatars: [
      { id: 'nairobi', name: 'Nairobi', url: 'assets/avatars/nairobi.svg' },
      { id: 'rio', name: 'Rio', url: 'assets/avatars/rio.svg' },
      { id: 'alicia_sierra', name: 'Alicia Sierra', url: 'assets/avatars/alicia_sierra.jpg' },
      { id: 'berlin', name: 'Berlin', url: 'assets/avatars/berlin.jpg' },
      { id: 'the_professor', name: 'O Professor', url: 'assets/avatars/the_professor.jpg' },
      { id: 'the_girl', name: 'Keila', url: 'assets/avatars/the_girl.jpg' },
      { id: 'cameron', name: 'Cameron', url: 'assets/avatars/cameron.jpg' },
      { id: 'bruce', name: 'Bruce', url: 'assets/avatars/bruce.jpg' },
      { id: 'money_heist', name: 'Máscara Dalí', url: 'assets/avatars/money_heist.svg' }
    ]
  },
  {
    title: '(Des)encanto',
    avatars: [
      { id: 'bean', name: 'Bean', url: 'assets/avatars/bean.svg' },
      { id: 'luci', name: 'Luci', url: 'assets/avatars/luci.svg' },
      { id: 'elfo', name: 'Elfo', url: 'assets/avatars/elfo.svg' },
      { id: 'king_zog', name: 'Rei Zøg', url: 'assets/avatars/king_zog.svg' },
      { id: 'queen_oona', name: 'Rainha Oona', url: 'assets/avatars/queen_oona.svg' },
      { id: 'stan_executioner', name: 'Stan o Algoz', url: 'assets/avatars/stan_executioner.svg' }
    ]
  },
  {
    title: 'Big Mouth',
    avatars: [
      { id: 'andrew', name: 'Andrew', url: 'assets/avatars/andrew.svg' },
      { id: 'connie', name: 'Connie', url: 'assets/avatars/connie.svg' },
      { id: 'maury', name: 'Maury', url: 'assets/avatars/maury.svg' },
      { id: 'jessi', name: 'Jessi', url: 'assets/avatars/jessi.svg' },
      { id: 'jay', name: 'Jay', url: 'assets/avatars/jay.svg' },
      { id: 'pillow', name: 'Cherry (Travesseiro)', url: 'assets/avatars/pillow.svg' }
    ]
  },
  {
    title: 'Arcane',
    avatars: [
      { id: 'jinx', name: 'Jinx', url: 'assets/avatars/jinx.svg' },
      { id: 'vi', name: 'Vi', url: 'assets/avatars/vi.svg' },
      { id: 'caitlyn', name: 'Caitlyn', url: 'assets/avatars/caitlyn.svg' },
      { id: 'ekko', name: 'Ekko', url: 'assets/avatars/ekko.svg' },
      { id: 'viktor', name: 'Viktor', url: 'assets/avatars/viktor.svg' },
      { id: 'mel_medarda', name: 'Mel Medarda', url: 'assets/avatars/mel_medarda.svg' }
    ]
  },
  {
    title: 'Peaky Blinders: O Homem Imortal',
    avatars: [
      { id: 'tommy_shelby', name: 'Tommy Shelby', url: 'assets/avatars/tommy_shelby.svg' },
      { id: 'arthur_shelby', name: 'Arthur Shelby', url: 'assets/avatars/arthur_shelby.svg' },
      { id: 'grace_shelby', name: 'Grace Shelby', url: 'assets/avatars/grace_shelby.svg' },
      { id: 'polly_gray', name: 'Polly Gray', url: 'assets/avatars/polly_gray.svg' }
    ]
  },
  {
    title: 'Lucifer',
    avatars: [
      { id: 'amenadiel', name: 'Amenadiel', url: 'assets/avatars/amenadiel.svg' },
      { id: 'chloe_decker', name: 'Chloe Decker', url: 'assets/avatars/chloe_decker.svg' },
      { id: 'dan_espinoza', name: 'Dan Espinoza', url: 'assets/avatars/dan_espinoza.svg' }
    ]
  },
  {
    title: 'Lupin',
    avatars: [
      { id: 'lupin_beard', name: 'Assane Diop (Barba)', url: 'assets/avatars/lupin_beard.svg' },
      { id: 'lupin_glasses', name: 'Assane Diop (Óculos)', url: 'assets/avatars/lupin_glasses.svg' },
      { id: 'lupin_hat', name: 'Assane Diop (Chapéu)', url: 'assets/avatars/lupin_hat.svg' }
    ]
  },
  {
    title: 'The Witcher',
    avatars: [
      { id: 'jaskier', name: 'Jaskier', url: 'assets/avatars/jaskier.svg' },
      { id: 'roach', name: 'Carpeado (Roach)', url: 'assets/avatars/roach.svg' },
      { id: 'witcher_creature', name: 'Criatura', url: 'assets/avatars/witcher_creature.svg' }
    ]
  },
  {
    title: 'Destaques e Clássicos',
    avatars: [
      { id: 'wednesday', name: 'Wandinha', url: 'assets/avatars/wednesday.svg' },
      { id: 'breaking_bad', name: 'Heisenberg', url: 'assets/avatars/walter_white.svg' },
      { id: 'stranger_things', name: 'Eleven', url: 'assets/avatars/eleven.svg' },
      { id: 'interstellar', name: 'Cooper', url: 'assets/avatars/cooper.svg' },
      { id: 'avengers', name: 'Iron Man', url: 'assets/avatars/iron_man.svg' },
      { id: 'matrix', name: 'Neo', url: 'assets/avatars/neo.svg' }
    ]
  },
  {
    title: 'Animes',
    avatars: [
      { id: 'naruto', name: 'Naruto', url: 'assets/avatars/naruto.svg' },
      { id: 'one_piece', name: 'Luffy', url: 'assets/avatars/luffy.svg' },
      { id: 'death_note', name: 'L', url: 'assets/avatars/l_deathnote.svg' },
      { id: 'demon_slayer', name: 'Tanjirou', url: 'assets/avatars/tanjirou.svg' }
    ]
  }
];

const PRESET_AVATARS = AVATAR_CATEGORIES.flatMap(cat => cat.avatars);

const COLOR_AVATARS = [
  { id: 'color_blue', name: 'Azul', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%232b90d9"/><text x="50" y="55" font-size="30" fill="white" font-family="sans-serif" text-anchor="middle">👤</text></svg>' },
  { id: 'color_green', name: 'Verde', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%233ebd5c"/><text x="50" y="55" font-size="30" fill="white" font-family="sans-serif" text-anchor="middle">👤</text></svg>' },
  { id: 'color_yellow', name: 'Amarelo', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23e3b31a"/><text x="50" y="55" font-size="30" fill="white" font-family="sans-serif" text-anchor="middle">👤</text></svg>' },
  { id: 'color_purple', name: 'Roxo', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23943ebd"/><text x="50" y="55" font-size="30" fill="white" font-family="sans-serif" text-anchor="middle">👤</text></svg>' },
  { id: 'color_red', name: 'Vermelho', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23e50914"/><text x="50" y="55" font-size="30" fill="white" font-family="sans-serif" text-anchor="middle">👤</text></svg>' }
];

// ---------- State ----------
const STATE = {
  currentPage: 'auth',
  currentUser: null,
  currentProfile: null,
  allProfiles: {},
  manageProfilesMode: false,
  selectedAvatarUrl: PRESET_AVATARS[0].url,
  
  // Auth state
  authMode: 'login',
  
  // PIN pad state
  pinTargetProfileId: null,
  pinAccumulator: '',

  favorites: [],
  inProgress: [],
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
  modalTrailerMuted: false,
  selectedCanalCategory: 'aberto',
  maintenanceChannels: {},
  hiddenChannels: {},
  watchStart: null,
  watchInterval: null,
  currentWatchItem: null
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
      auth: $('#page-auth'),
      profiles: $('#page-profiles'),
      home: $('#page-home'),
      movies: $('#page-movies'),
      series: $('#page-series'),
      animes: $('#page-animes'),
      canais: $('#page-canais'),
      search: $('#page-search'),
      admin: $('#page-admin')
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
    cinemaBlockerTop: $('#cinema-blocker-top'),
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
    
    // Auth and profile UI
    authForm: $('#auth-form'),
    authEmail: $('#auth-email'),
    authPassword: $('#auth-password'),
    authConfirmGroup: $('#confirm-password-group'),
    authConfirmPassword: $('#auth-confirm-password'),
    btnAuthSubmit: $('#btn-auth-submit'),
    authTitle: $('#auth-title'),
    authSwitchText: $('#auth-switch-text'),
    btnAuthSwitch: $('#btn-auth-switch'),
    headerProfileWrapper: $('#header-profile-wrapper'),
    headerAvatar: $('#header-avatar'),
    profileMenuBtn: $('#profile-menu-btn'),
    profileDropdown: $('#profile-dropdown'),
    profileDropdownList: $('#profile-dropdown-list'),
    btnDropdownManage: $('#btn-dropdown-manage'),
    btnDropdownLogout: $('#btn-dropdown-logout'),
    profilesGrid: $('#profiles-grid'),
    btnManageProfiles: $('#btn-manage-profiles'),
    pinModal: $('#pin-modal'),
    pinCloseBtn: $('#pin-close-btn'),
    profileEditModal: $('#profile-edit-modal'),
    avatarPickerModal: $('#avatar-picker-modal'),
    editProfileAvatarImg: $('#edit-profile-avatar-img'),
    btnChangeAvatar: $('#btn-change-avatar'),
    editProfileName: $('#edit-profile-name'),
    editProfilePin: $('#edit-profile-pin'),
    btnProfileSave: $('#btn-profile-save'),
    btnProfileCancel: $('#btn-profile-cancel'),
    btnProfileDelete: $('#btn-profile-delete'),
    avatarPickerCloseBtn: $('#avatar-picker-close-btn'),
    avatarPickerSectionsContainer: $('#avatar-picker-sections-container'),
    
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
      // Prefer official Trailer, then any Teaser, then any YouTube video
      const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
        || videos.find(v => v.type === 'Teaser' && v.site === 'YouTube')
        || videos.find(v => v.site === 'YouTube');
      if (trailer) {
        // Use youtube-nocookie.com to avoid Error 153 (player configuration error)
        // This domain is YouTube's official solution for privacy-safe embeds and avoids referrer blocks
        return `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`;
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

  async function saveWatchProgress(id, title, type, details = {}) {
    if (!STATE.currentUser || !STATE.currentProfile) return;

    // Try to find the item in STATE.inProgress to preserve existing metadata
    const existing = STATE.inProgress.find(x => Number(x.id) === Number(id));
    const movie = STATE.currentMovieDetail || existing || {};

    const progressItem = {
      id: Number(id),
      title: movie.title || movie.name || title,
      name: movie.name || movie.title || title,
      poster_path: movie.poster_path || details.poster_path || '',
      backdrop_path: movie.backdrop_path || details.backdrop_path || '',
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || '',
      first_air_date: movie.first_air_date || movie.release_date || '',
      media_type: type,
      timestamp: Date.now(),
      ...details
    };

    try {
      const itemRef = ref(db, `users/${STATE.currentUser.uid}/profiles/${STATE.currentProfile.id}/in_progress/${id}`);
      await set(itemRef, progressItem);
      
      STATE.inProgress = STATE.inProgress.filter(x => Number(x.id) !== Number(id));
      STATE.inProgress.unshift(progressItem);
      if (STATE.inProgress.length > 12) {
        STATE.inProgress.pop();
      }
    } catch (err) {
      console.error("Error saving progress to Firebase:", err);
    }
  }

  // ---------- Navigation ----------
  function navigateTo(page) {
    STATE.currentPage = page;
    
    // Hide header links & search if on auth or profiles page
    const hideHeaderNav = (page === 'auth' || page === 'profiles');
    if (DOM.navMenu) {
      DOM.navMenu.style.visibility = hideHeaderNav ? 'hidden' : 'visible';
    }
    if (DOM.menuToggle) {
      DOM.menuToggle.style.display = hideHeaderNav ? 'none' : '';
    }
    if (DOM.logoHome) {
      DOM.logoHome.style.pointerEvents = (page === 'auth') ? 'none' : 'auto';
    }
    
    // Force solid blurred dark header background on inner pages to prevent clashing content
    if (DOM.header) {
      if (page !== 'home' && page !== 'auth' && page !== 'profiles') {
        DOM.header.classList.add('scrolled');
      } else {
        DOM.header.classList.toggle('scrolled', window.scrollY > 20 || page === 'auth' || page === 'profiles');
      }
    }
    
    // Toggle footer visibility: hide on auth and profiles pages
    if (DOM.footer) {
      DOM.footer.style.display = (page === 'auth' || page === 'profiles') ? 'none' : 'block';
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
    stopCanalPlayer();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render contents
    if (page === 'home') renderHome();
    else if (page === 'movies') renderMoviesPage();
    else if (page === 'series') renderSeriesPage();
    else if (page === 'animes') renderAnimesPage();
    else if (page === 'canais') renderCanaisPage();
    else if (page === 'profiles') renderProfilesPage();
    else if (page === 'admin') renderAdminDashboard();
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

    // Ensure footer is visible on genre pages
    if (DOM.footer) {
      DOM.footer.style.display = 'block';
    }

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

    // Watch progress indicator from synced STATE.inProgress
    const prog = STATE.inProgress.find(x => Number(x.id) === Number(item.id));
    let progressIndicatorHTML = '';

    if (prog) {
      if (mediaType === 'movie' && prog.percent) {
        progressIndicatorHTML = `
          <div class="card-progress-bar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255, 255, 255, 0.3); z-index: 5;">
            <div style="height: 100%; width: ${prog.percent}%; background: var(--accent); transition: width 0.3s ease;"></div>
          </div>
        `;
      } else if (prog.season) {
        progressIndicatorHTML = `
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(229, 9, 20, 0.9); padding: 3px 8px; font-size: 0.65rem; color: white; text-align: right; font-weight: 700; z-index: 5; border-bottom-left-radius: var(--radius-sm); border-bottom-right-radius: var(--radius-sm);">
            T${prog.season}:E${prog.episode}
          </div>
        `;
      }
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
      let inProgressList = STATE.inProgress;
      
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
              
              if (STATE.currentUser && STATE.currentProfile) {
                await set(ref(db, `users/${STATE.currentUser.uid}/profiles/${STATE.currentProfile.id}/in_progress/${item.id}`), item);
              }
              repairedAny = true;
            }
          } catch (e) {
            console.warn(`Erro reparando metadados do item ${item.id}`, e);
          }
        }
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
        clearBtn.onclick = async () => {
          if (!STATE.currentUser || !STATE.currentProfile) return;
          try {
            showToast("Limpando histórico...", "info");
            await remove(ref(db, `users/${STATE.currentUser.uid}/profiles/${STATE.currentProfile.id}/in_progress`));
            STATE.inProgress = [];
            showToast('Histórico de "Continuar Assistindo" limpo!', 'info');
            renderHome();
          } catch (err) {
            console.error("Error clearing progress:", err);
          }
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

    // Use UTC date to ensure PC and mobile devices are perfectly synchronized globally
    const today = new Date();
    const dateStr = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;

    // Simple hash function to score candidates independently
    function hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    }

    // Find the candidate with the highest hash value for today
    let selected = null;
    let maxHash = -Infinity;

    uniqueCandidates.forEach(c => {
      const hashKey = `${dateStr}_${c.media_type}_${c.id}`;
      const hashVal = hashString(hashKey);
      if (hashVal > maxHash) {
        maxHash = hashVal;
        selected = c;
      }
    });

    if (!selected) return null;

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

  const listaCanais = [
    {
      id: "nicktoons",
      nome: "NickToons",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Nicktoons_2023_logo.png",
      url: "https://stmv2.srvif.com/nicktoons/nicktoons/playlist.m3u8"
    },
    {
      id: "nickelodeon",
      nome: "Nickelodeon",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/Nickelodeon_2023_logo.svg",
      url: "https://x1co.com.br/hls/stream.m3u8"
    },
    {
      id: "novo-canal",
      nome: "NOVO CANAL",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/NOVO_CANAL_-_LOGO.jpg",
      url: "http://189.86.89.116/hls-live/livenc/_definst_/liveevent/livestream.m3u8"
    },
    {
      id: "sbt",
      nome: "SBT",
      categoria: "aberto",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFkL6YgXliqq5tf35NK2b8VFk4b-NGErBH1w&s",
      url: "https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8"
    },
    {
      id: "record-tv",
      nome: "Record TV",
      categoria: "aberto",
      logo: "https://logodownload.org/wp-content/uploads/2013/12/record-tv-logo.png",
      url: "https://cdn.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/playlist.m3u8"
    },
    {
      id: "tv-cultura",
      nome: "TV Cultura",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Cultura_logo_2013.svg",
      url: "https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8"
    },
    {
      id: "band",
      nome: "Band",
      categoria: "aberto",
      logo: "https://e7.pngegg.com/pngimages/1008/95/png-clipart-tv-bandeirantes-campinas-logo-tv-bandeirantes-rio-de-janeiro-band-logo-band.png",
      url: "https://5b7f3c45ab7c2.streamlock.net/arapuan/ngrp:arapuan_all/chunklist.m3u8"
    },
    {
      id: "boas-novas",
      nome: "Boas Novas",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/pt/3/39/Rede_Boas_Novas.png",
      url: "https://cdn.jmvstream.com/w/LVW-9375/LVW9375_6i0wPBCHYc/playlist.m3u8?checkedby:iptvcat.com"
    },
    {
      id: "bob-leponge-uk",
      nome: "Bob L'eponge UK",
      categoria: "fechado",
      logo: "https://toppng.com/uploads/preview/spongebob-squarepants-image-bob-esponja-logo-115629249569phjmqytif.png",
      url: "https://jmp2.uk/stvp-FRAJ3800010QO"
    },
    {
      id: "discovery-turbo",
      nome: "Discovery Turbo",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Discovery_Turbo_logo.svg/1280px-Discovery_Turbo_logo.svg.png",
      url: "https://cdn-5.nxplay.com.br/DISCOVERY_TURBO_NX/index.m3u8"
    },
    {
      id: "discovery-channel",
      nome: "Discovery Channel",
      categoria: "fechado",
      logo: "https://toppng.com/uploads/preview/discovery-channel-logo-vector-11574229905pblh5eesph.png",
      url: "https://cdn-5.nxplay.com.br/DISCOVERY_CHANNEL_NX/index.m3u8"
    },
    {
      id: "lifetime",
      nome: "Lifetime",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkGjad5yikdf-t1f8RTk1gfdEIE3Nvx7f7Cw&s",
      url: "https://cdn-3.nxplay.com.br/LIFE_TIME_TK/index.m3u8"
    },
    {
      id: "rede-brasil",
      nome: "Rede Brasil",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Rede_Brasil_de_Televis%C3%A3o_Logo2023.png",
      url: "https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8"
    },
    {
      id: "playtv",
      nome: "PlayTV",
      categoria: "fechado",
      logo: "https://static.wikia.nocookie.net/logofic/images/f/f9/Playtv.png/revision/latest/scale-to-width-down/785?cb=20200518115119&path-prefix=pt-br",
      url: "https://isaocorp.cloudecast.com/playtv/index.m3u8"
    },
    {
      id: "gospel-cartoon",
      nome: "Gospel Cartoon",
      categoria: "fechado",
      logo: "https://www.cxtv.com.br/img/Tvs/Logo/webp-l/f0a3c3c7b9a651e847d86dd71bbb5551.webp",
      url: "https://stmv1.srvif.com/gospelcartoon/gospelcartoon/playlist.m3u8"
    },
    {
      id: "gospel-movies-television",
      nome: "Gospel Movies Television",
      categoria: "fechado",
      logo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM_jxvdheT60ZpD3nThvOsVJgZ6LCnU8X1iX8l1OW544agWFu5pFUr8pnDzwjrh5VfiYPMrP-Lc-xkuFRjkt4HpLYhStsS-KbUFoW-5ptE_yrbh9dXLkcCj_AiK_DKcJ9YlV4Zj7-VKNnQ5hj9fDykTEn3tCrKGjbsohC2nkLmZXyrqEjOWTZVCzdcaTw/w1200-h630-p-k-no-nu/GOSPEL%20MOVIES%20TELEVISION.webp",
      url: "https://stmv1.srvif.com/gospelf/gospelf/playlist.m3u8"
    },
    {
      id: "kuriakakos-kids",
      nome: "Kuriakakos Kids",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtlQdZuh4ehWK6jV38JyJ1ERiivxWS2Rw_9A&s",
      url: "https://w2.manasat.com/kkids/smil:kkids.smil/playlist.m3u8"
    },
    {
      id: "loading-tv",
      nome: "Loading TV",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Logo_loading.png",
      url: "https://stmv1.srvif.com/loadingtv/loadingtv/playlist.m3u8"
    },
    {
      id: "tv-serie",
      nome: "TV Serie",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Logo_Canal%2B_S%C3%A9ries_2013.svg",
      url: "https://stmv1.srvif.com/tvserie/tvserie/playlist.m3u8"
    },
    {
      id: "tv-nbn",
      nome: "TV NBN",
      categoria: "aberto",
      logo: "https://www.tvnbn.com.br/wp-content/uploads/2018/08/logo-TVNBN-300-100.png",
      url: "https://cdn.jmvstream.com/w/LVW-8410/LVW8410_uiZOVm6vz1/playlist.m3u8"
    },
    {
      id: "mr-bean-animated",
      nome: "Mr. Bean Animated",
      categoria: "fechado",
      logo: "https://e7.pngegg.com/pngimages/618/786/png-clipart-video-youtube-animated-cartoon-animated-series-mr-bean-dance.png",
      url: "https://amg00627-banijay-amg00627c35-tcl-us-4282.playouts.now.amagi.tv/playlist/amg00627-banijayfast-mrbeanbr-tclus/playlist.m3u8?ROGERIOTORRES"
    },
    {
      id: "moranguinho-hd",
      nome: "Moranguinho ᴴᴰ",
      categoria: "fechado",
      logo: "https://i.pinimg.com/originals/7e/a7/45/7ea745bd319c3ac14646a8d3b2d95b21.png",
      url: "https://ssai-ads.api.leiniao.com/global-adinsertion-api/hls/live/v2/15d2d4a8f740492cb0f81cbb1feb5123/playlist.m3u8?ROGERIOTORRES"
    },
    {
      id: "ministerio-infantil-hd",
      nome: "Ministério Infantil ᴴᴰ",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkNKPvTYobDU-Uu73q07GSR4yPc4uucTHmPA&s",
      url: "https://stmv4.voxtvhd.com.br/1990/1990/playlist.m3u8?ROGERIOTORRES"
    },
    {
      id: "jetsons-tv",
      nome: "Jetsons TV",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/The_Jetsons_%28television_series_logo%29.png",
      url: "https://stmv1.srvif.com/jetsontv/jetsontv/playlist.m3u8"
    },
    {
      id: "medo-tv-hd",
      nome: "Medo TV ᴴᴰ",
      categoria: "fechado",
      logo: "https://png.pngtree.com/png-vector/20250825/ourmid/pngtree-ghostface-scream-movie-night-retro-1980s-horror-comic-cover-art-png-image_17207103.webp",
      url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4865"
    },
    {
      id: "runtime-crime-hd",
      nome: "Run:Time Crime ᴴᴰ",
      categoria: "fechado",
      logo: "https://images.seeklogo.com/logo-png/20/2/crime-rock-band-logo-png_seeklogo-209741.png",
      url: "https://stream.ads.ottera.tv/playlist.m3u8?network_id=4864"
    },
    {
      id: "anime-tv",
      nome: "Anime TV",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/e2/AnimeCentral.PNG",
      url: "https://stmv2.painelvideocast.com.br/animetv/animetv/chunklist.m3u8?ROGERIOTORRES"
    },
    {
      id: "hallo-anime-hd",
      nome: "Hallo Anime ᴴᴰ",
      categoria: "fechado",
      logo: "https://image.pngaaa.com/352/1697352-middle.png",
      url: "https://cdn-3.nxplay.com.br/HALLOANIME/index.m3u8?ROGERIOTORRES"
    },
    {
      id: "otaku-sign-tv-hd",
      nome: "Otaku Sign TV ᴴᴰ",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_dbjREOJ8G0HpLjXRiBoYyAB5Kphb3y12Sw&s",
      url: "https://stmv1.srvif.com/anime/anime/playlist.m3u8?hls_ctx=9o6p063n"
    },
    {
      id: "mojitv-hd",
      nome: "MojiTV ᴴᴰ",
      categoria: "fechado",
      logo: "https://logowik.com/content/uploads/images/moji9857.logowik.com.webp",
      url: "https://d29h829bjuxghm.cloudfront.net/hls/master.m3u8?ads.xumo_channelId=99992140&ads.xumo_streamId=99992140&ads.channelId=99992140&ads.csid=lgchannels_br_odmediabrazil_ssai&ads.channelName=odmediabrazil_br&ads.xumo_contentName=ODMediaBrazil&ads.xumo_contentId=3193&ads.xumo_providerName=ODMediaBrazil&ads.xumo_providerId=3193&ads.content_category=IAB6&ads.content_genre=kids&ads.content_language=pt&ads.content_rating=tv-g&ads.coppa=1&ads.did=[IFA]&ads.is_lat=[LMT]&ads.us_privacy=[US_PRIVACY]&ads.gdpr=[GDPR]&ads.gdpr_consent=[GDPR_CONSENT]&ads.devicemake=[DEVICE_MAKE]&ads.appName=[APP_NAME]&ads.app_bundle=[APP_BUNDLE]&ads.app_version=[APP_VERSION]&ads.fck=[FCK]&ads.viewsize=[VIEWSIZE]&ads.givn=[NONCE]&ads.app_storeurl=[APP_STOREURL]"
    },
    {
      id: "sonic",
      nome: "Sonic",
      categoria: "fechado",
      logo: "https://www.citypng.com/public/uploads/preview/sonic-logo-word-art-free-png-701751694708949q5sudrfmc1.png",
      url: "https://d1si3n1st4nkgb.cloudfront.net/10000/88876021/hls/master.m3u8?ads.xumo_channelId=88876021"
    },
    {
      id: "tv-max",
      nome: "Tv Max",
      categoria: "fechado",
      logo: "https://static.wixstatic.com/media/0f057e_8a28dc905a0949ecaeba9368cd313d0d~mv2.png/v1/fill/w_289,h_289,al_c/0f057e_8a28dc905a0949ecaeba9368cd313d0d~mv2.png",
      url: "https://video09.logicahost.com.br/tvmax/tvmax/chunklist.m3u8?ROGERIOTORRES"
    },
    {
      id: "the-walking-dead-hd",
      nome: "The Walking Dead ᴴᴰ",
      categoria: "fechado",
      logo: "https://e1.pngegg.com/pngimages/364/48/png-clipart-the-walking-dead-serie-folders-the-walking-dead-logo.png",
      url: "https://amg01822-amc-amg01822c1-lg-br-8375.playouts.now.amagi.tv/playlist/amg01822-amcnetworkslatinamericallcfast-thewalkingdeadbyamcbr-lgbr/playlist.m3u8?ROGERIOTORRES"
    },
    {
      id: "top-tv",
      nome: "Top tv",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/9/94/LOGO_TOP_TV_HD.png",
      url: "https://isaocorp.cloudecast.com/toptv/tracks-v1a1/mono.m3u8?ROGERIOTORRES"
    },
    {
      id: "filmes-top-mix",
      nome: "Filmes top mix",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU8Sw_OY0ty-j2lLRlDf5mv-GjQBxH-t_MAA&s",
      url: "https://video03.logicahost.com.br/filmestopmixtv/filmestopmixtv/chunklist.m3u8?ROGERIOTORRES"
    },
    {
      id: "fifa-plus-hispanic",
      nome: "FIFA+ Hispanic America (720p)",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/01/FIFA%2B.svg",
      url: "https://6c849fb3.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctbXhfRklGQVBsdXNTcGFuaXNoLTFfSExT/playlist.m3u8?checkedby:iptvcat.com"
    },
    {
      id: "classics-hd",
      nome: "Classics ᴴᴰ",
      categoria: "fechado",
      logo: "https://thumbs.dreamstime.com/b/carimbo-de-borracha-cl%C3%A1ssico-dos-filmes-12384807.jpg",
      url: "https://spt-sonyoneclassicas-1-br.samsung.wurl.tv/playlist.m3u8?ROGERIOTORRES"
    },
    {
      id: "xumo-filmes-hd",
      nome: "Xumo Filmes ᴴᴰ",
      categoria: "fechado",
      logo: "https://images.seeklogo.com/logo-png/31/2/hd-filmes-logo-png_seeklogo-316948.png",
      url: "https://d29h829bjuxghm.cloudfront.net/hls/master.m3u8?ads.xumo_channelId=99992307&ads.xumo_streamId=99992307&ads.channelId=99992307&ads.csid=lgchannels_br_xumofreemoviesbrazil_ssai&ads.channelName=xumofreemoviesbrazil_br&ads.xumo_contentName=XumoFreeMoviesBrazil&ads.xumo_contentId=5&ads.xumo_providerName=XumoFreeMoviesBrazil&ads.xumo_providerId=5&ads.content_category=IAB1-7&ads.content_genre=Movies&ads.content_language=en&ads.content_rating=tv-ma&ads.coppa=0&ads.did=[IFA]&ads.is_lat=[LMT]&ads.us_privacy=[US_PRIVACY]&ads.gdpr=[GDPR]&ads.gdpr_consent=[GDPR_CONSENT]&ads.devicemake=[DEVICE_MAKE]&ads.appName=[APP_NAME]&ads.app_bundle=[APP_BUNDLE]&ads.app_version=[APP_VERSION]&ads.fck=[FCK]&ads.viewsize=[VIEWSIZE]&ads.givn=[NONCE]&ads.app_storeurl=[APP_STOREURL]"
    },
    {
      id: "spark-tv-hd",
      nome: "Spark TV ᴴᴰ",
      categoria: "fechado",
      logo: "https://play-lh.googleusercontent.com/jPdDehFaN04fiUdh_rlBYu1ft_j1Qv5X7L1AfWGbZwO-F8bvd6XGOCd50nOBF8m_04abe_AgIObgvUZOUjMEXA",
      url: "https://d25usgadhphvwi.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-sr15nxkp06uk9/playlist.m3u8?ROGERIOTORRES"
    },
    {
      id: "teletubbies",
      nome: "Teletubbies",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/pt/5/57/Teletubbies_logo.png",
      url: "https://dv8lsrd8fecw9.cloudfront.net/master.m3u8"
    },
    {
      id: "telemax",
      nome: "Telemax",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Telemax.png",
      url: "https://stream-gtlc.telecentro.net.ar/hls/telemaxhls/main.m3u8?checkedby:iptvcat.com"
    },
    {
      id: "happykids",
      nome: "HappyKids",
      categoria: "fechado",
      logo: "https://static.wikia.nocookie.net/logosfake/images/9/90/Happy_Kids_logo_2004.png/revision/latest?cb=20140525234116",
      url: "https://dil9xdvretp0f.cloudfront.net/index.m3u8"
    },
    {
      id: "icarly-uk",
      nome: "iCarly UK",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/3/31/ICarly_2021_logo.png",
      url: "https://jmp2.uk/stvp-FRAJ38000061J"
    },
    {
      id: "disney-xd",
      nome: "Disney XD",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/2009_Disney_XD_logo.svg/3840px-2009_Disney_XD_logo.svg.png",
      url: "http://23.237.104.106:8080/USA_DISNEY_XD/index.m3u8"
    },
    {
      id: "boomerang-eua",
      nome: "Boomerang EUA",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/Boomerang_tv_logo.png",
      url: "http://23.237.104.106:8080/USA_BOOMERANG/index.m3u8"
    },
    {
      id: "the-lego-channel",
      nome: "The LEGO Channel",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/960px-LEGO_logo.svg.png",
      url: "https://dltiqboxjw21d.cloudfront.net/index.m3u8"
    },
    {
      id: "tom-and-jerry",
      nome: "Tom And Jerry",
      categoria: "fechado",
      logo: "https://pngimg.com/uploads/tom_and_jerry/tom_and_jerry_PNG42.png",
      url: "https://live20.bozztv.com/giatvplayout7/giatv-208314/playlist.m3u8"
    },
    {
      id: "tortues-ninja-uk",
      nome: "Tortues Ninja UK",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/fr/b/b6/Tortues_Ninja.png",
      url: "https://jmp2.uk/stvp-FRBA3300046W4"
    },
    {
      id: "minimax",
      nome: "Minimax",
      categoria: "fechado",
      logo: "https://images.seeklogo.com/logo-png/52/2/minimax-logo-png_seeklogo-522746.png",
      url: "https://vodzong.mjunoon.tv:8087/streamtest/disckids-157-1/playlist.m3u8"
    },
    {
      id: "disney-junior",
      nome: "Disney Junior",
      categoria: "fechado",
      logo: "https://logosmarcas.net/wp-content/uploads/2022/02/Disney-Junior-Logo.png",
      url: "http://23.237.104.106:8080/USA_DISNEY_JUNIOR/index.m3u8"
    },
    {
      id: "baby-shark",
      nome: "Baby Shark",
      categoria: "fechado",
      logo: "https://w7.pngwing.com/pngs/290/842/png-transparent-baby-shark-typography-texts-thumbnail.png",
      url: "https://c0c65b821b3542c3a4dca92702f59944.mediatailor.us-east-1.amazonaws.com/v1/master/04fd913bb278d8775298c26fdca9d9841f37601f/RakutenTV-eu_BabySharkTV/playlist.m3u8"
    },
    {
      id: "pbs-kids",
      nome: "PBS Kids",
      categoria: "fechado",
      logo: "https://static.wikia.nocookie.net/logopedia/images/1/15/PBS_Kids_Dash_%281999%29.svg/revision/latest?cb=20170814134849",
      url: "https://2-fss-2.streamhoster.com/pl_140/amlst:200914-1298290/playlist.m3u8"
    },
    {
      id: "pocoyo-uk",
      nome: "Pocoyo UK",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Pocoyo_2024_logo.svg/1280px-Pocoyo_2024_logo.svg.png",
      url: "https://jmp2.uk/stvp-FR700001VJ"
    },
    {
      id: "record-news",
      nome: "Record News",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Record_News_logo_2022.svg/3840px-Record_News_logo_2022.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail",
      url: "https://5cf4a2c2512a2.streamlock.net/8016/8016/playlist.m3u8"
    },
    {
      id: "cartoon-network-eua",
      nome: "Cartoon Network EUA",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg03tGdzwFGhIq7SRC3sV5Bq7NlnGooNe9RQ&s",
      url: "http://23.237.104.106:8080/USA_CARTOON_NETWORK/index.m3u8"
    },
    {
      id: "mtv-eua",
      nome: "MTV EUA",
      categoria: "fechado",
      logo: "https://logospng.org/wp-content/uploads/mtv.png",
      url: "http://23.237.104.106:8080/USA_MTV/index.m3u8"
    },
    {
      id: "fx-eua",
      nome: "FX EUA",
      categoria: "fechado",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyOIIGva_5J-a3YoeT0zh4LhqQ9fwzGPB6Jw&s",
      url: "http://23.237.104.106:8080/USA_FX/index.m3u8"
    },
    {
      id: "espn-eua",
      nome: "ESPN EUA",
      categoria: "fechado",
      logo: "https://logosmarcas.net/wp-content/uploads/2020/12/ESPN-Logo-650x366.png",
      url: "http://23.237.104.106:8080/USA_ESPNU/index.m3u8"
    },
    {
      id: "cinemax-eua",
      nome: "Cinemax EUA",
      categoria: "fechado",
      logo: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Cinemax_LA.png?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original",
      url: "http://23.237.104.106:8080/USA_CINEMAX/index.m3u8"
    },
    {
      id: "tv-sao-luis",
      nome: "TV São Luís",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/pt/9/97/Logotipo_da_TV_S%C3%A3o_Lu%C3%ADs.png",
      url: "https://stmv1.srvif.com/tvsaoluis8/tvsaoluis8/playlist.m3u8"
    },
    {
      id: "redetv-mais",
      nome: "RedeTV! Mais",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/pt/0/05/Logotipo_da_RedeTV%21_%282015%E2%80%932019%29.png",
      url: "https://cdn.live.br1.jmvstream.com/webtv/AVJ-15235/playlist/playlist.m3u8"
    },
    {
      id: "tv-pampa",
      nome: "TV Pampa",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Logotipo_da_TV_Pampa.png",
      url: "https://video04.logicahost.com.br/tvpampa/tvpampa/playlist.m3u8"
    },
    {
      id: "tv-rio-preto",
      nome: "TV Rio Preto",
      categoria: "aberto",
      logo: "https://play-lh.googleusercontent.com/1NDgTUBpCw1aBImap_fq1u0mgBQMqQaAiZQw1G9RCNmy5QcoHW1Ki4jY15MInVayuM8Tca0O3woDcXTd6vXd2Q",
      url: "https://video02.logicahost.com.br/tvriopreto/tvriopreto/playlist.m3u8?checkedby:iptvcat.com"
    },
    {
      id: "sic-tv",
      nome: "SIC TV",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/pt/f/f9/Logotipo_da_SIC_TV.png",
      url: "https://parecisfmlive.brasilstream.com.br/hls/parecisfmlive/index.m3u8"
    },
    {
      id: "tv-catve",
      nome: "TV CATVE (PR)",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Catve.png",
      url: "http://wowza4.catve.com.br:1935/live/livestream/chunklist_w529672192.m3u8"
    },
    {
      id: "master-tv",
      nome: "MASTER TV (PR)",
      categoria: "aberto",
      logo: "https://lh6.googleusercontent.com/proxy/pbyreWhPyFcni4oTIK8oQImzEx4-Tg13fm5BvYgZUlDycQAppweNBChD5LDuZP-FqYw8_hOoQrAqEqGp2E63_Do8TCPoMM6qvR6BIap2Xg0",
      url: "http://wowza4.catve.com.br:1935/mastertv/livestream/chunklist_w1821412394.m3u8"
    },
    {
      id: "tv-brasil-hd",
      nome: "TV Brasil HD",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/TV_Brasil_logo_2009.png?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original",
      url: "http://streaming.procergs.com.br:1935/tve/stve/playlist.m3u8"
    },
    {
      id: "tv-camara-1",
      nome: "TV Câmara 1",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Marca_TV_C%C3%A2mara_-_2018.png?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original",
      url: "https://stream3.camara.gov.br/tv1/manifest.m3u8"
    },
    {
      id: "tv-assembleia-mg",
      nome: "TV Assembleia (MG)",
      categoria: "aberto",
      logo: "https://cdn.mitvstatic.com/channels/br_tv-assembleia-de-minas-gerais_m.png",
      url: "http://streaming.almg.gov.br:80/live/tvalmg.m3u8"
    },
    {
      id: "tv-litoral-panorama",
      nome: "TV Litoral Panorama",
      categoria: "aberto",
      logo: "https://www.panorama.tv.br/wp-content/uploads/sites/15/2021/03/tv-litoral-panorama.png",
      url: "http://streaming03.zas.media:1935/panorama/panorama/live.m3u8"
    },
    {
      id: "tv-terceiro-anjo",
      nome: "TV Terceiro Anjo",
      categoria: "aberto",
      logo: "https://yt3.googleusercontent.com/YgN2a0uoD1DKJjS0hmojDlvuxFHvBF99_a2EkiMw-l-oo_ylmfszdWeA6A65_uK83oqVjwrGPjs=s900-c-k-c0x00ffffff-no-rj",
      url: "http://streamer1.streamhost.org:1935/salive/GMI3anjoh/livestream.m3u8"
    },
    {
      id: "canal-38",
      nome: "Canal 38",
      categoria: "aberto",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJRm9-US3lIPLmQG3poj-mgQ-VPsk1ilGL1g&s",
      url: "https://cdn.jmvstream.com/w/LVW-8503/LVW8503_d0V5oduFlK/playlist.m3u8?checkedby:iptvcat.com"
    },
    {
      id: "canale-7-italia",
      nome: "Canale 7 [Italia]",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Canale_7.png",
      url: "http://wms.shared.streamshow.it:1935/canale7/canale7/live.m3u8"
    },
    {
      id: "tv-guarapari",
      nome: "TV Guarapari",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/pt/d/d3/Logotipo_da_TV_Guararapes.png",
      url: "http://video.welltecnologia.com.br:1935/tvguarapari/tvguarapari/live.m3u8"
    },
    {
      id: "nova-era-tv",
      nome: "Nova Era TV",
      categoria: "aberto",
      logo: "https://upload.wikimedia.org/wikipedia/pt/a/a6/Logotipo_da_TV_Nova_Era.png",
      url: "http://wz3.dnip.com.br:1935/novaeratv/novaeratv.sdp/live.m3u8"
    }
  ];

  let canalPlayer = null;

  function stopCanalPlayer() {
    if (canalPlayer) {
      try {
        canalPlayer.destroy();
      } catch (e) {
        console.warn("Erro ao destruir player de canal:", e);
      }
      canalPlayer = null;
    }
    const playerWrapper = document.getElementById('canal-wrapper-player');
    const infoContainer = document.getElementById('canal-info-container');
    if (playerWrapper) playerWrapper.style.display = 'none';
    if (infoContainer) infoContainer.style.display = 'none';
    const httpTip = document.getElementById('canal-http-tip');
    if (httpTip) httpTip.style.display = 'none';
  }

  function renderCanaisPage() {
    const grid = document.getElementById('grid-canais');
    if (!grid) return;
    
    // Limpar e construir
    grid.innerHTML = '';
    
    // 1. Organizar por ordem alfabética
    const sortedCanais = [...listaCanais].sort((a, b) => a.nome.localeCompare(b.nome));
    
    // 2. Filtrar pela categoria ativa e ocultar canais marcados como invisíveis
    const category = STATE.selectedCanalCategory || 'aberto';
    const filteredCanais = sortedCanais.filter(canal => {
      const isHidden = STATE.hiddenChannels && STATE.hiddenChannels[canal.id] === true;
      return canal.categoria === category && !isHidden;
    });
    
    if (filteredCanais.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum canal nesta categoria.</div>`;
      return;
    }

    filteredCanais.forEach((canal) => {
      const item = document.createElement('div');
      
      const isMaint = STATE.maintenanceChannels && STATE.maintenanceChannels[canal.id] === true;
      item.className = 'canal-item' + (isMaint ? ' manutencao' : '');
      
      // Se este canal já for o canal ativo no player
      if (canalPlayer && canalPlayer.options && canalPlayer.options.source === canal.url) {
        item.className += ' active';
      }
      
      item.onclick = () => carregarCanal(canal.id);
      item.innerHTML = `
        <img src="${canal.logo}" onerror="this.src='https://via.placeholder.com/100x70?text=LOGO'">
        <span>${canal.nome}</span>
      `;
      grid.appendChild(item);
    });
  }

  function carregarCanal(canalId) {
    const canal = listaCanais.find(c => c.id === canalId);
    if (!canal) return;

    // Bloquear reprodução se estiver em manutenção
    if (STATE.maintenanceChannels && STATE.maintenanceChannels[canal.id] === true) {
      showToast(`O canal "${canal.nome}" está em manutenção temporária. Voltaremos em breve!`, 'info');
      return;
    }

    const playerWrapper = document.getElementById('canal-wrapper-player');
    const infoContainer = document.getElementById('canal-info-container');
    const nameEl = document.getElementById('canal-current-name');
    const logoEl = document.getElementById('canal-current-logo');

    // Tornar elementos visíveis
    if (playerWrapper) playerWrapper.style.display = 'block';
    if (infoContainer) infoContainer.style.display = 'flex';

    // Exibir ou ocultar dica de fluxo inseguro (HTTP)
    const httpTip = document.getElementById('canal-http-tip');
    if (httpTip) {
      if (canal.url.startsWith('http://')) {
        httpTip.style.display = 'block';
      } else {
        httpTip.style.display = 'none';
      }
    }

    // Atualizar textos e logos
    if (nameEl) nameEl.innerText = canal.nome;
    if (logoEl) logoEl.src = canal.logo;

    // Atualizar link de transmissão via Web Video Caster (WVC)
    const canalWvcBtn = document.getElementById('canal-wvc-btn');
    if (canalWvcBtn) {
      canalWvcBtn.href = `wvc-x-callback://open?url=${encodeURIComponent(canal.url)}&title=${encodeURIComponent('DarkFlix Live — ' + canal.nome)}`;
    }

    // Destacar item ativo na grade
    const grid = document.getElementById('grid-canais');
    if (grid) {
      grid.querySelectorAll('.canal-item').forEach((item) => {
        const span = item.querySelector('span');
        const isActive = span && span.innerText === canal.nome;
        item.classList.toggle('active', isActive);
      });
    }

    // Instanciação do Clappr Player
    if (typeof Clappr === 'undefined') {
      showToast('Erro: Biblioteca Clappr não foi carregada.', 'error');
      return;
    }

    try {
      if (!canalPlayer) {
        canalPlayer = new Clappr.Player({
          source: canal.url,
          parentId: "#canal-player",
          autoPlay: true,
          width: '100%',
          height: '100%'
        });
      } else {
        // Se já existe, configura apenas a nova fonte
        canalPlayer.configure({ source: canal.url, autoPlay: true });
        canalPlayer.play();
      }

      // Programmatically configure the Clappr video tag attributes for auto PiP
      const configureCanalVideo = () => {
        const vid = document.querySelector('#canal-player video');
        if (vid) {
          vid.setAttribute('playsinline', 'true');
          vid.setAttribute('webkit-playsinline', 'true');
          vid.setAttribute('autopictureinpicture', 'true');
          vid.setAttribute('pip', 'true');
        }
      };
      configureCanalVideo();
      setTimeout(configureCanalVideo, 300);
      setTimeout(configureCanalVideo, 1000);
      setTimeout(configureCanalVideo, 2500);

      // Force display the PiP button if browser supports it
      const canalPipBtn = document.getElementById('canal-pip-btn');
      if (document.pictureInPictureEnabled && canalPipBtn) {
        canalPipBtn.style.display = 'inline-flex';
      }
      
      showToast(`Carregando canal: ${canal.nome}...`, 'success');
      
      // Scroll suave para o player
      const targetScroll = playerWrapper.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      
    } catch (e) {
      console.error("Erro ao sintonizar Clappr player:", e);
      showToast("Erro ao sintonizar o canal.", "error");
    }
  }

  // ---------- Control Panel (Perfil do Site) ----------
  function renderAdminDashboard() {
    // 1. Buscar estatísticas de visitas no Firebase Realtime Database
    const visitsRef = ref(db, 'stats/visitors');
    get(visitsRef).then((snap) => {
      const visitVal = snap.val() || 0;
      const countEl = document.getElementById('admin-visit-count');
      if (countEl) countEl.innerText = visitVal;
    }).catch(err => console.error("Erro ao buscar visitas:", err));

    // 2. Calcular estatísticas de canais ativos/manutenção
    const totalCanais = listaCanais.length;
    let maintCount = 0;
    Object.keys(STATE.maintenanceChannels || {}).forEach(k => {
      if (STATE.maintenanceChannels[k] === true) maintCount++;
    });

    const activeEl = document.getElementById('admin-active-channels');
    const maintEl = document.getElementById('admin-maint-channels');
    if (activeEl) activeEl.innerText = totalCanais - maintCount;
    if (maintEl) maintEl.innerText = maintCount;

    // 3. Renderizar a lista de canais para o painel administrativo
    const listContainer = document.getElementById('admin-channels-list');
    if (listContainer) {
      // Ordenar canais alfabeticamente
      const sortedCanais = [...listaCanais].sort((a, b) => a.nome.localeCompare(b.nome));
      const canaisAbertos = sortedCanais.filter(c => c.categoria === 'aberto');
      const canaisFechados = sortedCanais.filter(c => c.categoria === 'fechado');

      const buildChannelItemHtml = (canal) => {
        const isMaint = STATE.maintenanceChannels && STATE.maintenanceChannels[canal.id] === true;
        const isHidden = STATE.hiddenChannels && STATE.hiddenChannels[canal.id] === true;
        return `
          <div class="channel-control-card">
            <!-- Header part: Logo & Name -->
            <div class="channel-control-header">
              <div class="channel-control-logo-wrapper">
                <img src="${canal.logo}" onerror="this.src='https://via.placeholder.com/80x48?text=NO+LOGO'">
              </div>
              <div class="channel-control-details">
                <h4>${canal.nome}</h4>
                <span class="channel-badge">${canal.categoria === 'aberto' ? '📺 Canal Aberto' : '🔒 Canal Fechado'}</span>
              </div>
            </div>

            <!-- Actions part: Custom Buttons -->
            <div class="channel-control-actions">
              <!-- Maintenance Button -->
              <button class="admin-btn-action admin-btn-maint ${isMaint ? 'maint-active' : ''}" data-id="${canal.id}">
                🛠️ ${isMaint ? 'Em Manutenção' : 'Manutenção'}
              </button>
              <!-- Hidden Button -->
              <button class="admin-btn-action admin-btn-hide ${isHidden ? 'hide-active' : ''}" data-id="${canal.id}">
                👁️ ${isHidden ? 'Escondido' : 'Esconder'}
              </button>
            </div>
          </div>
        `;
      };

      listContainer.innerHTML = `
        <div style="margin-bottom: 25px;">
          <h4 style="margin: 0 0 16px 0; color: var(--accent); border-left: 3px solid var(--accent); padding-left: 8px; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>📺 Canais Abertos</span>
            <span style="font-size: 0.75rem; opacity: 0.8; font-weight: 500; font-family: 'Montserrat', sans-serif;">${canaisAbertos.length} no total</span>
          </h4>
          <div class="channels-sublist-group">
            ${canaisAbertos.map(buildChannelItemHtml).join('')}
          </div>
        </div>
        
        <div>
          <h4 style="margin: 40px 0 16px 0; color: #a855f7; border-left: 3px solid #a855f7; padding-left: 8px; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>🔒 Canais Fechados</span>
            <span style="font-size: 0.75rem; opacity: 0.8; font-weight: 500; font-family: 'Montserrat', sans-serif;">${canaisFechados.length} no total</span>
          </h4>
          <div class="channels-sublist-group">
            ${canaisFechados.map(buildChannelItemHtml).join('')}
          </div>
        </div>
      `;

      // Adicionar listeners para os botões de manutenção
      listContainer.querySelectorAll('.admin-btn-maint').forEach(button => {
        button.onclick = async () => {
          const canalId = button.dataset.id;
          const isCurrentlyMaint = STATE.maintenanceChannels && STATE.maintenanceChannels[canalId] === true;
          const nextState = !isCurrentlyMaint;
          
          try {
            showToast(`${nextState ? 'Colocando em manutenção' : 'Ativando'} canal no banco de dados...`, 'info');
            await set(ref(db, `stats/maintenance_channels/${canalId}`), nextState);
            showToast(`Status do canal atualizado com sucesso!`, 'success');
          } catch (e) {
            console.error("Erro ao atualizar status do canal:", e);
            showToast("Erro ao atualizar o canal.", "error");
          }
        };
      });

      // Adicionar listeners para os botões de ocultação
      listContainer.querySelectorAll('.admin-btn-hide').forEach(button => {
        button.onclick = async () => {
          const canalId = button.dataset.id;
          const isCurrentlyHidden = STATE.hiddenChannels && STATE.hiddenChannels[canalId] === true;
          const nextState = !isCurrentlyHidden;
          
          try {
            showToast(`${nextState ? 'Ocultando' : 'Exibindo'} canal no banco de dados...`, 'info');
            await set(ref(db, `stats/hidden_channels/${canalId}`), nextState);
            showToast(`Visibilidade do canal atualizada com sucesso!`, 'success');
          } catch (e) {
            console.error("Erro ao atualizar visibilidade do canal:", e);
            showToast("Erro ao atualizar o canal.", "error");
          }
        };
      });
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

    const savedProgress = STATE.inProgress.find(x => Number(x.id) === Number(movie.id));
    let savedSeason = null;
    let savedEpisode = null;

    if (savedProgress && savedProgress.season) {
      savedSeason = parseInt(savedProgress.season);
      savedEpisode = parseInt(savedProgress.episode);
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
    if (STATE.watchInterval) {
      clearInterval(STATE.watchInterval);
      STATE.watchInterval = null;
    }

    // Load existing progress from memory
    const existingProgress = STATE.inProgress.find(x => Number(x.id) === Number(tmdbId));
    let initialElapsedTime = 0;
    
    if (existingProgress) {
      if (type === 'tv') {
        if (parseInt(existingProgress.season) === parseInt(season) && parseInt(existingProgress.episode) === parseInt(episode)) {
          initialElapsedTime = existingProgress.elapsedTime || 0;
        }
      } else {
        initialElapsedTime = existingProgress.elapsedTime || 0;
      }
    }

    if (initialElapsedTime > 0) {
      const minutes = Math.floor(initialElapsedTime / 60);
      const seconds = initialElapsedTime % 60;
      showToast(`🍿 Progresso salvo: ${minutes}m ${seconds}s. Se o player iniciar do início, basta arrastar a barra para este ponto!`, 'info');
    }

    // Save initial progress record in Firebase if not existing
    const runtimeMinutes = (type === 'tv') ? 45 : ((STATE.currentMovieDetail && STATE.currentMovieDetail.runtime) || 120);
    const runtimeSeconds = runtimeMinutes * 60;
    const initialPercent = Math.min(95, Math.round((initialElapsedTime / runtimeSeconds) * 100));

    saveWatchProgress(tmdbId, title, type, {
      timestamp: Date.now(),
      type: type,
      elapsedTime: initialElapsedTime,
      percent: initialPercent || 5,
      season: season ? parseInt(season) : null,
      episode: episode ? parseInt(episode) : null
    });

    // Start watch tracker state
    STATE.watchStart = Date.now();
    STATE.currentWatchItem = {
      id: tmdbId,
      title: title,
      type: type,
      season: season ? parseInt(season) : null,
      episode: episode ? parseInt(episode) : null,
      initialElapsedTime: initialElapsedTime,
      runtimeSeconds: runtimeSeconds
    };

    // Track progress every 15 seconds
    STATE.watchInterval = setInterval(() => {
      if (DOM.cinemaMode.classList.contains('active') && STATE.currentWatchItem) {
        const elapsedSeconds = Math.round((Date.now() - STATE.watchStart) / 1000);
        const totalElapsed = STATE.currentWatchItem.initialElapsedTime + elapsedSeconds;
        const cappedElapsed = Math.min(STATE.currentWatchItem.runtimeSeconds - 10, totalElapsed);
        const percent = Math.min(95, Math.round((cappedElapsed / STATE.currentWatchItem.runtimeSeconds) * 100));

        saveWatchProgress(STATE.currentWatchItem.id, STATE.currentWatchItem.title, STATE.currentWatchItem.type, {
          timestamp: Date.now(),
          type: STATE.currentWatchItem.type,
          elapsedTime: cappedElapsed,
          percent: percent,
          season: STATE.currentWatchItem.season,
          episode: STATE.currentWatchItem.episode
        });
      }
    }, 15000);

    stopMainHeroTrailer();
    closeDetail(); // closeDetail limpa com segurança STATE.currentMovieDetail agora!

    DOM.cinemaTitle.textContent = title;
    
    let embedUrl = '';
    const startParam = initialElapsedTime ? `&start=${initialElapsedTime}&t=${initialElapsedTime}&time=${initialElapsedTime}` : '';

    if (type === 'movie') {
      embedUrl = `https://myembed.biz/filme/${tmdbId}?autoplay=1${startParam}`;
    } else {
      embedUrl = `https://myembed.biz/serie/${tmdbId}/${season}/${episode}?autoplay=1${startParam}`;
    }

    DOM.cinemaVideo.style.display = 'none';
    DOM.cinemaVideo.src = '';
    
    DOM.cinemaIframe.src = embedUrl;
    DOM.cinemaIframe.style.display = 'block';
    DOM.cinemaBlockerTop.style.display = 'block';

    if (DOM.cinemaExternalBtn) {
      DOM.cinemaExternalBtn.href = embedUrl;
    }

    // Use a direct embed link (WarezCDN) for Web Video Cast to ensure a clean playback page with zero selector screens
    let wvcUrl = '';
    if (type === 'movie') {
      wvcUrl = `https://embed.warezcdn.link/filme/${tmdbId}?start=${initialElapsedTime}`;
    } else {
      wvcUrl = `https://embed.warezcdn.link/serie/${tmdbId}/${season}/${episode}?start=${initialElapsedTime}`;
    }

    const cinemaWvcBtn = document.getElementById('cinema-wvc-btn');
    if (cinemaWvcBtn) {
      cinemaWvcBtn.href = `wvc-x-callback://open?url=${encodeURIComponent(wvcUrl)}&title=${encodeURIComponent(title)}`;
    }

    DOM.cinemaMode.classList.add('active');
    document.body.style.overflow = 'hidden';

    showToast('Iniciando player via MyEmbed.biz...', 'success');
  }

  function closeCinema() {
    // Save final progress
    if (STATE.watchInterval) {
      clearInterval(STATE.watchInterval);
      STATE.watchInterval = null;
    }

    if (STATE.currentWatchItem) {
      const elapsedSeconds = Math.round((Date.now() - STATE.watchStart) / 1000);
      const totalElapsed = STATE.currentWatchItem.initialElapsedTime + elapsedSeconds;
      const cappedElapsed = Math.min(STATE.currentWatchItem.runtimeSeconds - 10, totalElapsed);
      const percent = Math.min(95, Math.round((cappedElapsed / STATE.currentWatchItem.runtimeSeconds) * 100));

      saveWatchProgress(STATE.currentWatchItem.id, STATE.currentWatchItem.title, STATE.currentWatchItem.type, {
        timestamp: Date.now(),
        type: STATE.currentWatchItem.type,
        elapsedTime: cappedElapsed,
        percent: percent,
        season: STATE.currentWatchItem.season,
        episode: STATE.currentWatchItem.episode
      });
      STATE.currentWatchItem = null;
    }

    DOM.cinemaMode.classList.remove('active');
    DOM.cinemaIframe.src = '';
    DOM.cinemaIframe.style.display = 'none';
    DOM.cinemaBlockerTop.style.display = 'none';
    document.body.style.overflow = '';

    // Refresh indicators
    if (STATE.currentPage === 'home') renderHome();
    else if (STATE.currentPage === 'movies') renderMoviesPage();
    else if (STATE.currentPage === 'series') renderSeriesPage();
  }

  // ---------- Watchlist / Favorites Management ----------
  async function toggleFavorite(movie) {
    if (!STATE.currentUser || !STATE.currentProfile) return;

    const idx = STATE.favorites.findIndex(item => Number(item.id) === Number(movie.id));
    const title = movie.title || movie.name;
    const itemRef = ref(db, `users/${STATE.currentUser.uid}/profiles/${STATE.currentProfile.id}/favorites/${movie.id}`);

    try {
      if (idx > -1) {
        STATE.favorites.splice(idx, 1);
        await remove(itemRef);
        showToast(`"${title}" removido da Minha Lista.`, 'info');
      } else {
        const favItem = {
          id: movie.id,
          title: title,
          name: movie.name || movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date || movie.first_air_date,
          first_air_date: movie.first_air_date || movie.release_date,
          media_type: movie.media_type || (movie.title ? 'movie' : 'tv')
        };
        STATE.favorites.push(favItem);
        await set(itemRef, favItem);
        showToast(`"${title}" adicionado à Minha Lista!`, 'success');
      }

      updateFavoriteBtnState(movie.id);
      if (STATE.currentPage === 'home') renderHome();
    } catch (err) {
      console.error("Error toggling favorite in Firebase:", err);
    }
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


  // Generates Netflix-style movie poster grid in the background of the auth screen
  function generateAuthBackdrop() {
    const backdrop = document.querySelector('.auth-backdrop');
    if (!backdrop) return;

    const posters = [
      "https://image.tmdb.org/t/p/w342/nCbkOyOMTEwlEV0LtCObySSRFhk.jpg", // Interestelar
      "https://image.tmdb.org/t/p/w342/oJagOzBu9Rdd9BrciseCm3U3MCU.jpg", // O Poderoso Chefão
      "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911BytUESw3KFkt.jpg", // Batman: O Cavaleiro das Trevas
      "https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", // Clube da Luta
      "https://image.tmdb.org/t/p/w342/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg", // Inception
      "https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", // Matrix
      "https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", // Parasita
      "https://image.tmdb.org/t/p/w342/q6725aR8Zs4IwGMXzZT2CBlKAU.jpg", // Vingadores: Ultimato
      "https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", // Duna
      "https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", // Oppenheimer
      "https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", // Stranger Things
      "https://image.tmdb.org/t/p/w342/ztkUQFLlC19CCMYHW73GM6EQ3GP.jpg", // Breaking Bad
      "https://image.tmdb.org/t/p/w342/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", // The Witcher
      "https://image.tmdb.org/t/p/w342/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg", // Peaky Blinders
      "https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7LsyBGSNiVJt.jpg", // John Wick 4
      "https://image.tmdb.org/t/p/w342/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", // Blade Runner 2049
      "https://image.tmdb.org/t/p/w342/z2yahl2uefxDCl0nogcRBstwruJ.jpg", // A Casa do Dragão
      "https://image.tmdb.org/t/p/w342/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg", // Gladiador II
      "https://image.tmdb.org/t/p/w342/dDlEmuJpt0GhiD43596g5q17Z17.jpg", // Squid Game
      "https://image.tmdb.org/t/p/w342/9PF5wZ1wNJaf06m5UFgKqnEDiXS.jpg", // Wednesday
      "https://image.tmdb.org/t/p/w342/uKvH5j2tnVRS8cuQ1zN547rmiNi.jpg", // The Last of Us
      "https://image.tmdb.org/t/p/w342/t6jnd21H6jZ58nui0tF07n15Jyq.jpg", // Avatar 2
      "https://image.tmdb.org/t/p/w342/iiZZN643b6R1w8K2xC4UI29z7uW.jpg", // Spider-Man
      "https://image.tmdb.org/t/p/w342/ekZobSpt12JXT36vU310j7RiiC5.jpg", // Lucifer
      "https://image.tmdb.org/t/p/w342/fqldE2601pHRv23I75AvU36J6q7.jpg", // Arcane
      "https://image.tmdb.org/t/p/w342/reks5n6m653scQvHryW5a4857bB.jpg", // La Casa de Papel
      "https://image.tmdb.org/t/p/w342/5V1m1UGcwb2oM8p8ZE8Qv58v5H.jpg", // Lupin
      "https://image.tmdb.org/t/p/w342/apbrggSuBzY9q922C0n9P1XoXWb.jpg", // Dark
      "https://image.tmdb.org/t/p/w342/j57Z5TDhnv9hIMJHm136y2676xt.jpg", // Euphoria
      "https://image.tmdb.org/t/p/w342/f496sduzlmvP5lu23o968S56RNg.jpg", // One Piece
      "https://image.tmdb.org/t/p/w342/3bhkrj6PjOqabNmjjgk0U751AeW.jpg", // Naruto
      "https://image.tmdb.org/t/p/w342/h8g6Q03z41mZ6kgvgvzV1045vlg.jpg", // Death Note
      "https://image.tmdb.org/t/p/w342/xOMo8NET4x0uJZ6Imvhk4cwjPvY.jpg"  // Demon Slayer
    ];

    const numRows = 5;
    let gridHtml = '<div class="auth-poster-grid">';

    for (let r = 0; r < numRows; r++) {
      const rowPosters = [...posters];
      const shift = r * 7;
      for (let s = 0; s < shift; s++) {
        rowPosters.push(rowPosters.shift());
      }

      const doubled = [...rowPosters, ...rowPosters];
      const duration = 65 + r * 12;

      gridHtml += `<div class="auth-poster-row" style="animation-duration: ${duration}s; animation-direction: ${r % 2 === 0 ? 'normal' : 'reverse'}">`;
      doubled.forEach(url => {
        gridHtml += `<img src="${url}" alt="Poster" loading="lazy" onerror="this.style.display='none'">`;
      });
      gridHtml += '</div>';
    }

    gridHtml += '</div>';
    gridHtml += '<div class="auth-backdrop-overlay"></div>';

    backdrop.innerHTML = gridHtml;
  }

  // ---------- Setup Core Event Bindings ----------
  function initApp() {
    // Generate Netflix-style scrolling posters backdrop
    generateAuthBackdrop();

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
    DOM.pinModal.onclick = (e) => {
      if (e.target === DOM.pinModal) closePinModal();
    };
    DOM.profileEditModal.onclick = (e) => {
      if (e.target === DOM.profileEditModal) closeProfileEditModal();
    };
    DOM.avatarPickerModal.onclick = (e) => {
      if (e.target === DOM.avatarPickerModal) closeAvatarPicker();
    };

    // Keyboard ESC to close active overlays
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDetail();
        closeCinema();
        closePinModal();
        closeProfileEditModal();
        closeAvatarPicker();
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

    // Bind Netflix System Actions
    DOM.authForm.onsubmit = (e) => handleAuthSubmit(e);
    DOM.btnAuthSwitch.onclick = (e) => {
      e.preventDefault();
      switchAuthMode();
    };

    // Password visibility toggle buttons
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const inputGroup = btn.closest('.input-group');
        const input = inputGroup.querySelector('input[type="password"], input[type="text"]');
        const eyeOff = btn.querySelector('.eye-off');
        const eyeOn = btn.querySelector('.eye-on');
        if (input.type === 'password') {
          input.type = 'text';
          if (eyeOff) eyeOff.style.display = 'none';
          if (eyeOn) eyeOn.style.display = 'block';
        } else {
          input.type = 'password';
          if (eyeOff) eyeOff.style.display = 'block';
          if (eyeOn) eyeOn.style.display = 'none';
        }
      });
    });

    DOM.btnDropdownManage.onclick = (e) => {
      e.preventDefault();
      navigateTo('profiles');
      setTimeout(() => {
        toggleManageProfilesMode();
      }, 50);
    };

    DOM.btnDropdownLogout.onclick = (e) => {
      e.preventDefault();
      handleLogout();
    };

    DOM.btnManageProfiles.onclick = (e) => {
      e.preventDefault();
      toggleManageProfilesMode();
    };

    DOM.pinCloseBtn.onclick = (e) => {
      e.preventDefault();
      closePinModal();
    };

    DOM.pinModal.querySelectorAll('.pin-key[data-key]').forEach(btn => {
      btn.onclick = () => handlePinInput(btn.dataset.key);
    });

    document.getElementById('pin-clear').onclick = () => handlePinClear();
    document.getElementById('pin-backspace').onclick = () => handlePinBackspace();

    DOM.btnChangeAvatar.onclick = (e) => {
      e.preventDefault();
      openAvatarPicker();
    };

    DOM.btnProfileSave.onclick = (e) => {
      e.preventDefault();
      saveProfileData();
    };

    DOM.btnProfileCancel.onclick = (e) => {
      e.preventDefault();
      closeProfileEditModal();
    };

    DOM.btnProfileDelete.onclick = (e) => {
      e.preventDefault();
      deleteProfileData();
    };

    DOM.avatarPickerCloseBtn.onclick = (e) => {
      e.preventDefault();
      closeAvatarPicker();
    };

    // Profile dropdown toggle in header
    if (DOM.profileMenuBtn) {
      DOM.profileMenuBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.profileDropdown.classList.toggle('active');
        DOM.headerProfileWrapper.classList.toggle('open');
      };
    }

    // Close profile dropdown on outside click
    document.addEventListener('click', (e) => {
      if (DOM.headerProfileWrapper && !DOM.headerProfileWrapper.contains(e.target)) {
        DOM.profileDropdown.classList.remove('active');
        DOM.headerProfileWrapper.classList.remove('open');
      }
    });

    // ---------- Picture-in-Picture (PiP) Setup ----------
    const canalPipBtn = document.getElementById('canal-pip-btn');
    const cinemaPipBtn = document.getElementById('cinema-pip-btn');
    const isPiPSupported = document.pictureInPictureEnabled || false;

    if (isPiPSupported) {
      if (canalPipBtn) canalPipBtn.style.display = 'inline-flex';
      if (cinemaPipBtn) cinemaPipBtn.style.display = 'inline-flex';

      // Live Channels PiP click handler
      if (canalPipBtn) {
        canalPipBtn.onclick = async (e) => {
          e.preventDefault();
          const clapprVideo = document.querySelector('#canal-player video');
          if (clapprVideo) {
            try {
              if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                showToast("Saindo do modo minimizado (PiP)", "info");
              } else {
                await clapprVideo.requestPictureInPicture();
                showToast("Modo minimizado (PiP) ativado!", "success");
              }
            } catch (err) {
              console.error("Erro ao ativar PiP no canal:", err);
              showToast("Não foi possível minimizar o canal.", "error");
            }
          } else {
            showToast("Nenhum vídeo carregado no player ainda.", "info");
          }
        };
      }

      // Cinema local video PiP click handler
      if (cinemaPipBtn) {
        cinemaPipBtn.onclick = async (e) => {
          e.preventDefault();
          const cinemaVid = DOM.cinemaVideo;
          if (cinemaVid && DOM.cinemaMode.classList.contains('active') && cinemaVid.style.display !== 'none') {
            try {
              if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                showToast("Saindo do modo minimizado (PiP)", "info");
              } else {
                await cinemaVid.requestPictureInPicture();
                showToast("Modo minimizado (PiP) ativado!", "success");
              }
            } catch (err) {
              console.error("Erro ao ativar PiP no cinema:", err);
              showToast("Não foi possível minimizar o player.", "error");
            }
          } else {
            showToast("O player do filme não suporta minimização direta ou está usando o player externo.", "info");
          }
        };
      }
    }

    // Auto-trigger PiP when app is minimized or tab is switched (Page Visibility API)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Auto PiP for Live Channel Clappr player
        const clapprVideo = document.querySelector('#canal-player video');
        if (clapprVideo && !clapprVideo.paused) {
          try {
            if (isPiPSupported && !document.pictureInPictureElement) {
              clapprVideo.requestPictureInPicture();
            }
          } catch (e) {
            console.warn("Auto PiP falhou para o canal:", e);
          }
        }

        // Auto PiP for Cinema local video
        const cinemaVid = DOM.cinemaVideo;
        if (cinemaVid && !cinemaVid.paused && DOM.cinemaMode.classList.contains('active') && cinemaVid.style.display !== 'none') {
          try {
            if (isPiPSupported && !document.pictureInPictureElement) {
              cinemaVid.requestPictureInPicture();
            }
          } catch (e) {
            console.warn("Auto PiP falhou para cinema video:", e);
          }
        }
      }
    });

    // Bind Canal Category tabs
    const tabAberto = document.getElementById('btn-tab-aberto');
    const tabFechado = document.getElementById('btn-tab-fechado');
    if (tabAberto && tabFechado) {
      tabAberto.onclick = (e) => {
        e.preventDefault();
        STATE.selectedCanalCategory = 'aberto';
        tabAberto.classList.add('active');
        tabFechado.classList.remove('active');
        renderCanaisPage();
      };
      tabFechado.onclick = (e) => {
        e.preventDefault();
        STATE.selectedCanalCategory = 'fechado';
        tabFechado.classList.add('active');
        tabAberto.classList.remove('active');
        renderCanaisPage();
      };
    }
  }

  // ---------- Load Profiles from DB ----------
  async function loadProfilesFromDatabase() {
    if (!STATE.currentUser) return;
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${STATE.currentUser.uid}/profiles`));
      if (snapshot.exists()) {
        STATE.allProfiles = snapshot.val();
      } else {
        STATE.allProfiles = {};
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
    }
  }

  // ---------- Render Profiles Page ----------
  function renderProfilesPage() {
    STATE.manageProfilesMode = false;
    DOM.btnManageProfiles.classList.remove('active');
    DOM.btnManageProfiles.textContent = "Gerenciar Perfis";
    document.getElementById('profiles-screen-title').textContent = "Quem está assistindo?";

    let html = '';
    const profileIds = Object.keys(STATE.allProfiles);

    profileIds.forEach(id => {
      const p = STATE.allProfiles[id];
      const hasPin = p.pin && p.pin.length === 4;
      html += `
        <div class="profile-card" data-id="${id}">
          <div class="profile-avatar-wrapper">
            <img src="${p.avatar || PRESET_AVATARS[0].url}" alt="${p.name}">
            ${hasPin ? `<div class="profile-lock-icon" title="Perfil com PIN"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>` : ''}
          </div>
          <div class="profile-name">${p.name}</div>
        </div>
      `;
    });

    if (profileIds.length < 5) {
      html += `
        <div class="profile-card profile-add-btn" id="btn-add-profile-trigger">
          <div class="profile-avatar-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div class="profile-name">Adicionar Perfil</div>
        </div>
      `;
    }

    DOM.profilesGrid.innerHTML = html;

    DOM.profilesGrid.querySelectorAll('.profile-card').forEach(card => {
      card.onclick = () => {
        const id = card.dataset.id;
        if (!id) {
          openProfileEditModal(null);
          return;
        }

        if (STATE.manageProfilesMode) {
          openProfileEditModal(id);
        } else {
          attemptSelectProfile(id);
        }
      };
    });
  }

  // ---------- Toggle Manage Profiles Mode ----------
  function toggleManageProfilesMode() {
    STATE.manageProfilesMode = !STATE.manageProfilesMode;
    DOM.btnManageProfiles.classList.toggle('active', STATE.manageProfilesMode);
    
    if (STATE.manageProfilesMode) {
      DOM.btnManageProfiles.textContent = "Concluído";
      document.getElementById('profiles-screen-title').textContent = "Gerenciar Perfis:";
      
      DOM.profilesGrid.querySelectorAll('.profile-card').forEach(card => {
        const id = card.dataset.id;
        if (id) {
          card.classList.add('manage-mode');
          
          const avatarWrapper = card.querySelector('.profile-avatar-wrapper');
          const editIcon = document.createElement('div');
          editIcon.className = 'profile-edit-icon';
          editIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
          avatarWrapper.appendChild(editIcon);
        }
      });
    } else {
      renderProfilesPage();
    }
  }

  // ---------- Attempt Profile Selection (PIN verification) ----------
  function attemptSelectProfile(profileId) {
    const p = STATE.allProfiles[profileId];
    if (!p) return;

    if (p.pin && p.pin.length === 4) {
      openPinModal(profileId);
    } else {
      selectProfile(profileId);
    }
  }

  // ---------- Select Profile and Enter App ----------
  async function selectProfile(profileId) {
    const p = STATE.allProfiles[profileId];
    if (!p) return;

    STATE.currentProfile = { id: profileId, ...p };
    localStorage.setItem('darkflix_active_profile_id', profileId);

    STATE.favorites = p.favorites ? Object.values(p.favorites) : [];
    STATE.inProgress = p.in_progress ? Object.values(p.in_progress).sort((a,b) => b.timestamp - a.timestamp) : [];

    showToast(`Bem-vindo de volta, ${p.name}!`, 'success');
    updateHeaderProfileMenu();
    navigateTo('home');
  }

  // ---------- Update Header Profile Dropdown ----------
  function updateHeaderProfileMenu() {
    if (!STATE.currentProfile) {
      DOM.headerProfileWrapper.style.display = 'none';
      return;
    }

    DOM.headerProfileWrapper.style.display = 'block';
    DOM.headerAvatar.src = STATE.currentProfile.avatar || PRESET_AVATARS[0].url;

    let dropdownListHtml = '';
    Object.keys(STATE.allProfiles).forEach(id => {
      if (id !== STATE.currentProfile.id) {
        const p = STATE.allProfiles[id];
        dropdownListHtml += `
          <button class="dropdown-profile-item" data-id="${id}">
            <img src="${p.avatar || PRESET_AVATARS[0].url}" alt="${p.name}">
            <span>${p.name}</span>
          </button>
        `;
      }
    });

    DOM.profileDropdownList.innerHTML = dropdownListHtml;

    DOM.profileDropdownList.querySelectorAll('.dropdown-profile-item').forEach(item => {
      item.onclick = () => {
        const id = item.dataset.id;
        attemptSelectProfile(id);
      };
    });
  }

  // ---------- PIN Modal Logic ----------
  function openPinModal(profileId) {
    STATE.pinTargetProfileId = profileId;
    STATE.pinAccumulator = '';
    updatePinDisplay();
    DOM.pinModal.classList.add('active');
  }

  function closePinModal() {
    DOM.pinModal.classList.remove('active');
    STATE.pinTargetProfileId = null;
    STATE.pinAccumulator = '';
  }

  function handlePinInput(digit) {
    if (STATE.pinAccumulator.length < 4) {
      STATE.pinAccumulator += digit;
      updatePinDisplay();

      if (STATE.pinAccumulator.length === 4) {
        const profile = STATE.allProfiles[STATE.pinTargetProfileId];
        if (String(profile.pin) === String(STATE.pinAccumulator)) {
          const pid = STATE.pinTargetProfileId;
          closePinModal();
          selectProfile(pid);
        } else {
          showToast("PIN incorreto. Tente novamente.", "error");
          STATE.pinAccumulator = '';
          setTimeout(() => updatePinDisplay(), 300);
        }
      }
    }
  }

  function handlePinBackspace() {
    if (STATE.pinAccumulator.length > 0) {
      STATE.pinAccumulator = STATE.pinAccumulator.slice(0, -1);
      updatePinDisplay();
    }
  }

  function handlePinClear() {
    STATE.pinAccumulator = '';
    updatePinDisplay();
  }

  function updatePinDisplay() {
    const dots = DOM.pinModal.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('filled', index < STATE.pinAccumulator.length);
    });
  }

  // ---------- Profile Management (Add/Edit/Delete) ----------
  let editingProfileId = null;

  function openProfileEditModal(profileId = null) {
    editingProfileId = profileId;
    
    if (profileId) {
      const p = STATE.allProfiles[profileId];
      DOM.profileEditModal.querySelector('#profile-edit-title').textContent = "Editar Perfil";
      DOM.editProfileName.value = p.name;
      DOM.editProfilePin.value = p.pin || '';
      STATE.selectedAvatarUrl = p.avatar || PRESET_AVATARS[0].url;
      DOM.btnProfileDelete.style.display = 'inline-flex';
    } else {
      DOM.profileEditModal.querySelector('#profile-edit-title').textContent = "Adicionar Perfil";
      DOM.editProfileName.value = '';
      DOM.editProfilePin.value = '';
      
      const usedAvatars = Object.values(STATE.allProfiles).map(p => p.avatar);
      const unusedPreset = PRESET_AVATARS.find(a => !usedAvatars.includes(a.url)) || PRESET_AVATARS[0];
      STATE.selectedAvatarUrl = unusedPreset.url;
      
      DOM.btnProfileDelete.style.display = 'none';
    }
    
    DOM.editProfileAvatarImg.src = STATE.selectedAvatarUrl;
    DOM.profileEditModal.classList.add('active');
  }

  function closeProfileEditModal() {
    DOM.profileEditModal.classList.remove('active');
    editingProfileId = null;
  }

  async function saveProfileData() {
    const name = DOM.editProfileName.value.trim();
    const pin = DOM.editProfilePin.value.trim();
    const avatar = STATE.selectedAvatarUrl;

    if (!name) {
      showToast("Por favor, digite um nome para o perfil.", "error");
      return;
    }

    if (pin && (pin.length !== 4 || isNaN(pin))) {
      showToast("O PIN deve conter exatamente 4 números.", "error");
      return;
    }

    if (!STATE.currentUser) return;

    if (!editingProfileId && Object.keys(STATE.allProfiles).length >= 5) {
      showToast("Limite máximo de 5 perfis atingido.", "error");
      return;
    }

    try {
      showToast("Salvando perfil...", "info");
      const targetId = editingProfileId || `profile_${Date.now()}`;
      const existingData = editingProfileId ? (STATE.allProfiles[editingProfileId] || {}) : {};
      
      const profileData = {
        name: name,
        avatar: avatar,
        pin: pin || null,
        favorites: existingData.favorites || null,
        in_progress: existingData.in_progress || null
      };

      await set(ref(db, `users/${STATE.currentUser.uid}/profiles/${targetId}`), profileData);
      
      showToast("Perfil salvo com sucesso!", "success");
      closeProfileEditModal();
      
      await loadProfilesFromDatabase();
      
      if (STATE.currentProfile && STATE.currentProfile.id === targetId) {
        STATE.currentProfile = { id: targetId, ...profileData };
        localStorage.setItem('darkflix_active_profile_id', targetId);
        updateHeaderProfileMenu();
      }

      renderProfilesPage();
    } catch (err) {
      console.error("Error saving profile:", err);
      showToast("Erro ao salvar perfil. Tente novamente.", "error");
    }
  }

  async function deleteProfileData() {
    if (!editingProfileId) return;

    if (!confirm(`Tem certeza que deseja excluir o perfil "${STATE.allProfiles[editingProfileId].name}"? Todo o histórico e favoritos deste perfil serão perdidos.`)) {
      return;
    }

    try {
      showToast("Excluindo perfil...", "info");
      await remove(ref(db, `users/${STATE.currentUser.uid}/profiles/${editingProfileId}`));
      showToast("Perfil excluído.", "success");
      
      closeProfileEditModal();
      
      if (STATE.currentProfile && STATE.currentProfile.id === editingProfileId) {
        STATE.currentProfile = null;
        localStorage.removeItem('darkflix_active_profile_id');
      }

      await loadProfilesFromDatabase();
      renderProfilesPage();
    } catch (err) {
      console.error("Error deleting profile:", err);
      showToast("Erro ao excluir perfil.", "error");
    }
  }

  // ---------- Avatar Picker ----------
  function openAvatarPicker() {
    let sectionsHtml = '';
    
    // Add dynamic categories
    AVATAR_CATEGORIES.forEach(cat => {
      let itemsHtml = '';
      cat.avatars.forEach(a => {
        const isActive = STATE.selectedAvatarUrl === a.url ? ' active' : '';
        itemsHtml += `
          <div class="avatar-pick-item${isActive}" data-url="${a.url}">
            <img src="${a.url}" alt="${a.name}">
          </div>
        `;
      });
      sectionsHtml += `
        <div class="avatar-picker-group">
          <h3>${cat.title}</h3>
          <div class="avatar-picker-grid">
            ${itemsHtml}
          </div>
        </div>
      `;
    });

    // Add colors
    let colorsHtml = '';
    COLOR_AVATARS.forEach(a => {
      const isActive = STATE.selectedAvatarUrl === a.url ? ' active' : '';
      colorsHtml += `
        <div class="avatar-pick-item${isActive}" data-url="${a.url}">
          <img src="${a.url}" alt="${a.name}">
        </div>
      `;
    });
    sectionsHtml += `
      <div class="avatar-picker-group">
        <h3>Cores</h3>
        <div class="avatar-picker-grid">
          ${colorsHtml}
        </div>
      </div>
    `;

    DOM.avatarPickerSectionsContainer.innerHTML = sectionsHtml;

    DOM.avatarPickerModal.querySelectorAll('.avatar-pick-item').forEach(item => {
      item.onclick = () => {
        STATE.selectedAvatarUrl = item.dataset.url;
        DOM.editProfileAvatarImg.src = STATE.selectedAvatarUrl;
        closeAvatarPicker();
      };
    });

    DOM.avatarPickerModal.classList.add('active');
  }

  function closeAvatarPicker() {
    DOM.avatarPickerModal.classList.remove('active');
  }

  // ---------- Authentication Logic ----------
  function switchAuthMode() {
    if (STATE.authMode === 'login') {
      STATE.authMode = 'signup';
      DOM.authTitle.textContent = "Criar Conta";
      DOM.btnAuthSubmit.textContent = "Criar Conta";
      DOM.authSwitchText.textContent = "Já tem uma conta?";
      DOM.btnAuthSwitch.textContent = "Entrar agora.";
      // Show confirm password field
      if (DOM.authConfirmGroup) {
        DOM.authConfirmGroup.style.display = 'block';
        DOM.authConfirmPassword.setAttribute('required', 'required');
      }
    } else {
      STATE.authMode = 'login';
      DOM.authTitle.textContent = "Entrar";
      DOM.btnAuthSubmit.textContent = "Entrar";
      DOM.authSwitchText.textContent = "Novo por aqui?";
      DOM.btnAuthSwitch.textContent = "Criar conta";
      // Hide confirm password field
      if (DOM.authConfirmGroup) {
        DOM.authConfirmGroup.style.display = 'none';
        DOM.authConfirmPassword.removeAttribute('required');
        DOM.authConfirmPassword.value = '';
      }
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = DOM.authEmail.value.trim();
    const password = DOM.authPassword.value;

    if (!email || !password) {
      showToast("Preencha todos os campos.", "error");
      return;
    }

    // Validate password confirmation on signup
    if (STATE.authMode === 'signup') {
      const confirmPassword = DOM.authConfirmPassword ? DOM.authConfirmPassword.value : '';
      if (password !== confirmPassword) {
        showToast("As senhas não coincidem.", "error");
        return;
      }
    }

    try {
      if (STATE.authMode === 'login') {
        showToast("Entrando...", "info");
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Logado com sucesso!", "success");
      } else {
        showToast("Criando conta...", "info");
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Conta criada com sucesso!", "success");
      }
    } catch (err) {
      console.error("Auth error:", err);
      let errorMsg = "Ocorreu um erro na autenticação.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = "Email ou senha incorretos.";
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = "Este email já está em uso.";
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = "Email inválido.";
      } else if (err.code === 'auth/weak-password') {
        errorMsg = "A senha deve conter no mínimo 6 caracteres.";
      }
      showToast(errorMsg, "error");
    }
  }

  async function handleLogout() {
    try {
      showToast("Saindo...", "info");
      await signOut(auth);
      localStorage.removeItem('darkflix_active_profile_id');
      showToast("Desconectado.", "success");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }

  // ---------- Firebase Auth State Listener ----------
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      STATE.currentUser = user;
      await loadProfilesFromDatabase();

      // Controlar exibição do botão Admin (Perfil do Site) no menu
      const adminLink = document.getElementById('nav-admin');
      if (adminLink) {
        if (user.email === 'indiocrys15@gmail.com') {
          adminLink.style.display = 'inline-flex';
        } else {
          adminLink.style.display = 'none';
        }
      }

      // Incrementar visitas no Firebase Realtime Database
      let hasIncremented = sessionStorage.getItem('visited_cine_session');
      if (!hasIncremented) {
        const visitsRef = ref(db, 'stats/visitors');
        get(visitsRef).then((snap) => {
          let val = snap.val() || 0;
          set(visitsRef, val + 1);
          sessionStorage.setItem('visited_cine_session', 'true');
        }).catch(err => console.error("Erro ao registrar visita:", err));
      }

      // Escutar alterações de canais em manutenção em tempo real
      const maintRef = ref(db, 'stats/maintenance_channels');
      onValue(maintRef, (snap) => {
        STATE.maintenanceChannels = snap.val() || {};
        // Se a página de canais estiver ativa, re-renderizar para atualizar visualmente
        if (STATE.currentPage === 'canais') {
          renderCanaisPage();
        }
        // Se a página de admin estiver ativa, atualizar painel
        if (STATE.currentPage === 'admin') {
          renderAdminDashboard();
        }
      });

      // Escutar alterações de canais ocultos em tempo real
      const hiddenRef = ref(db, 'stats/hidden_channels');
      onValue(hiddenRef, (snap) => {
        STATE.hiddenChannels = snap.val() || {};
        // Se a página de canais estiver ativa, re-renderizar para atualizar visualmente
        if (STATE.currentPage === 'canais') {
          renderCanaisPage();
        }
        // Se a página de admin estiver ativa, atualizar painel
        if (STATE.currentPage === 'admin') {
          renderAdminDashboard();
        }
      });
      
      const savedProfileId = localStorage.getItem('darkflix_active_profile_id');
      if (savedProfileId && STATE.allProfiles[savedProfileId]) {
        await selectProfile(savedProfileId);
      } else {
        navigateTo('profiles');
      }
    } else {
      STATE.currentUser = null;
      STATE.currentProfile = null;
      STATE.allProfiles = {};
      STATE.favorites = [];
      STATE.inProgress = [];
      
      const adminLink = document.getElementById('nav-admin');
      if (adminLink) adminLink.style.display = 'none';

      DOM.headerProfileWrapper.style.display = 'none';
      navigateTo('auth');
    }
  });

  // Run initial setup on load
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
