// ============================================================
// DarkFlix - Aplicação Principal com Suporte a Arquivo Local (IndexedDB)
// ============================================================

(function () {
  'use strict';

  // ---------- State ----------
  const STORAGE_KEY = 'darkflix_movies';
  let movies = [];
  let currentPage = 'home';
  let editingId = null;
  let currentMovieDetail = null;
  let searchDebounce = null;
  let currentPlayingVideoUrl = null;
  let currentCinemaMovie = null;
  let ytPlayer = null;
  let ytInterval = null;
  let mainHeroTrailerTimeout = null;
  let currentMainHeroTrailerUrl = '';

  function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    return new Promise((resolve) => {
      if (document.querySelector('script[src*="iframe_api"]')) {
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYT);
            resolve();
          }
        }, 100);
        return;
      }
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      const prevOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevOnReady) prevOnReady();
        resolve();
      };
    });
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ---------- IndexedDB Config ----------
  const DB_NAME = 'DarkFlixDB';
  const DB_VERSION = 3;
  const STORE_NAME = 'media';
  let db = null;

  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const dbInstance = e.target.result;
        if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
          dbInstance.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onerror = (e) => {
        console.error("IndexedDB error:", e.target.error);
        reject(e.target.error);
      };
    });
  }

  function saveMedia(key, fileBlob) {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileBlob, key);
      request.onsuccess = () => resolve(key);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  function getMedia(key) {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  function deleteMedia(key) {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // ---------- Chunking helpers for large video files ----------
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

  function saveMovieVideo(movieId, file, onProgress) {
    return new Promise(async (resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      try {
        for (let i = 0; i < totalChunks; i++) {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);
          
          const chunkKey = `video_${movieId}_chunk_${i}`;
          await new Promise((res, rej) => {
            const req = store.put(chunkBlob, chunkKey);
            req.onsuccess = () => res();
            req.onerror = (e) => rej(e.target.error);
          });
          
          if (onProgress) {
            const percent = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(percent);
          }
        }
        
        // Save manifest
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const manifestKey = `video_${movieId}_manifest`;
        const manifest = {
          totalChunks: totalChunks,
          mimeType: file.type || 'video/mp4',
          size: file.size
        };
        
        await new Promise((res, rej) => {
          const req = store.put(manifest, manifestKey);
          req.onsuccess = () => res();
          req.onerror = (e) => rej(e.target.error);
        });
        
        resolve(manifestKey);
      } catch (err) {
        reject(err);
      }
    });
  }

  function getMovieVideo(movieId) {
    return new Promise(async (resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      
      try {
        const manifestKey = `video_${movieId}_manifest`;
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        const manifest = await new Promise((res, rej) => {
          const req = store.get(manifestKey);
          req.onsuccess = (e) => res(e.target.result);
          req.onerror = (e) => rej(e.target.error);
        });
        
        if (!manifest) {
          return resolve(null);
        }
        
        const chunks = [];
        for (let i = 0; i < manifest.totalChunks; i++) {
          const chunkKey = `video_${movieId}_chunk_${i}`;
          const chunkBlob = await new Promise((res, rej) => {
            const req = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(chunkKey);
            req.onsuccess = (e) => res(e.target.result);
            req.onerror = (e) => rej(e.target.error);
          });
          
          if (!chunkBlob) {
            return reject(new Error(`Chunk ${i} do vídeo não encontrado.`));
          }
          chunks.push(chunkBlob);
        }
        
        const compositeBlob = new Blob(chunks, { type: manifest.mimeType });
        resolve(compositeBlob);
      } catch (err) {
        reject(err);
      }
    });
  }

  function deleteMovieVideo(movieId) {
    return new Promise(async (resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      
      try {
        const manifestKey = `video_${movieId}_manifest`;
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const manifest = await new Promise((res, rej) => {
          const req = store.get(manifestKey);
          req.onsuccess = (e) => res(e.target.result);
          req.onerror = (e) => rej(e.target.error);
        });
        
        if (manifest) {
          for (let i = 0; i < manifest.totalChunks; i++) {
            const chunkKey = `video_${movieId}_chunk_${i}`;
            const delTx = db.transaction([STORE_NAME], 'readwrite');
            await new Promise((res, rej) => {
              const req = delTx.objectStore(STORE_NAME).delete(chunkKey);
              req.onsuccess = () => res();
              req.onerror = (e) => rej(e.target.error);
            });
          }
          
          const delManifestTx = db.transaction([STORE_NAME], 'readwrite');
          await new Promise((res, rej) => {
            const req = delManifestTx.objectStore(STORE_NAME).delete(manifestKey);
            req.onsuccess = () => res();
            req.onerror = (e) => rej(e.target.error);
          });
        }
        
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function saveMovieTrailer(movieId, file, onProgress) {
    return new Promise(async (resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      try {
        for (let i = 0; i < totalChunks; i++) {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);
          
          const chunkKey = `trailer_${movieId}_chunk_${i}`;
          await new Promise((res, rej) => {
            const req = store.put(chunkBlob, chunkKey);
            req.onsuccess = () => res();
            req.onerror = (e) => rej(e.target.error);
          });
          
          if (onProgress) {
            const percent = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(percent);
          }
        }
        
        // Save manifest
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const manifestKey = `trailer_${movieId}_manifest`;
        const manifest = {
          totalChunks: totalChunks,
          mimeType: file.type || 'video/mp4',
          size: file.size
        };
        
        await new Promise((res, rej) => {
          const req = store.put(manifest, manifestKey);
          req.onsuccess = () => res();
          req.onerror = (e) => rej(e.target.error);
        });
        
        resolve(manifestKey);
      } catch (err) {
        reject(err);
      }
    });
  }

  function getMovieTrailer(movieId) {
    return new Promise(async (resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      
      try {
        const manifestKey = `trailer_${movieId}_manifest`;
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        const manifest = await new Promise((res, rej) => {
          const req = store.get(manifestKey);
          req.onsuccess = (e) => res(e.target.result);
          req.onerror = (e) => rej(e.target.error);
        });
        
        if (!manifest) {
          return resolve(null);
        }
        
        const chunks = [];
        for (let i = 0; i < manifest.totalChunks; i++) {
          const chunkKey = `trailer_${movieId}_chunk_${i}`;
          const chunkBlob = await new Promise((res, rej) => {
            const req = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(chunkKey);
            req.onsuccess = (e) => res(e.target.result);
            req.onerror = (e) => rej(e.target.error);
          });
          
          if (!chunkBlob) {
            return reject(new Error(`Chunk ${i} do trailer não encontrado.`));
          }
          chunks.push(chunkBlob);
        }
        
        const compositeBlob = new Blob(chunks, { type: manifest.mimeType });
        resolve(compositeBlob);
      } catch (err) {
        reject(err);
      }
    });
  }

  function deleteMovieTrailer(movieId) {
    return new Promise(async (resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      
      try {
        const manifestKey = `trailer_${movieId}_manifest`;
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const manifest = await new Promise((res, rej) => {
          const req = store.get(manifestKey);
          req.onsuccess = (e) => res(e.target.result);
          req.onerror = (e) => rej(e.target.error);
        });
        
        if (manifest) {
          for (let i = 0; i < manifest.totalChunks; i++) {
            const chunkKey = `trailer_${movieId}_chunk_${i}`;
            const delTx = db.transaction([STORE_NAME], 'readwrite');
            await new Promise((res, rej) => {
              const req = delTx.objectStore(STORE_NAME).delete(chunkKey);
              req.onsuccess = () => res();
              req.onerror = (e) => rej(e.target.error);
            });
          }
          
          const delManifestTx = db.transaction([STORE_NAME], 'readwrite');
          await new Promise((res, rej) => {
            const req = delManifestTx.objectStore(STORE_NAME).delete(manifestKey);
            req.onsuccess = () => res();
            req.onerror = (e) => rej(e.target.error);
          });
        }
        
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function clearMediaDB() {
    return new Promise((resolve, reject) => {
      if (!db) return reject(new Error("IndexedDB não está inicializado"));
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // ---------- DOM Cache ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    header: $('#header'),
    nav: $('#nav-menu'),
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
    heroDescription: $('#hero-description'),
    heroWatchBtn: $('#hero-watch-btn'),
    heroInfoBtn: $('#hero-info-btn'),
    heroTrailer: $('#hero-trailer'),
    heroTrailerIframe: $('#hero-trailer-iframe'),
    heroTrailerVideo: $('#hero-trailer-video'),
    homeContent: $('#home-content'),
    // Pages
    pages: {
      home: $('#page-home'),
      movies: $('#page-movies'),
      series: $('#page-series'),
      search: $('#page-search'),
      admin: $('#page-admin'),
    },
    // Movies / Series grids
    moviesGridAll: $('#movies-grid-all'),
    seriesGridAll: $('#series-grid-all'),
    moviesFilterBar: $('#movies-filter-bar'),
    seriesFilterBar: $('#series-filter-bar'),
    // Search
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
    modalCloseBtn: $('#modal-close-btn'),
    modalHeroTrailer: $('#modal-hero-trailer'),
    modalTrailerIframe: $('#modal-trailer-iframe'),
    modalTrailerVideo: $('#modal-trailer-video'),
    // Cinema
    cinemaMode: $('#cinema-mode'),
    cinemaIframe: $('#cinema-iframe'),
    cinemaVideo: $('#cinema-video'),
    cinemaTitle: $('#cinema-title'),
    cinemaCloseBtn: $('#cinema-close-btn'),
    // Admin
    movieForm: $('#movie-form'),
    formId: $('#form-id'),
    formTitle: $('#form-movie-title'),
    formYear: $('#form-year'),
    formDuration: $('#form-duration'),
    formRating: $('#form-rating'),
    formType: $('#form-type'),
    formFeatured: $('#form-featured'),
    formDescription: $('#form-description'),
    // File Inputs
    formPosterFile: $('#form-poster-file'),
    formBackdropFile: $('#form-backdrop-file'),
    formVideoFile: $('#form-video-file'),
    posterFileInfo: $('#poster-file-info'),
    backdropFileInfo: $('#backdrop-file-info'),
    posterPreview: $('#poster-preview'),
    backdropPreview: $('#backdrop-preview'),
    videoFileInfo: $('#video-file-info'),
    formTrailerFile: $('#form-trailer-file'),
    trailerFileInfo: $('#trailer-file-info'),
    // Buttons
    formSubmitBtn: $('#form-submit-btn'),
    formCancelBtn: $('#form-cancel-btn'),
    formResetBtn: $('#form-reset-btn'),
    formTitleLabel: $('#form-title'),
    genresCheckboxes: $('#genres-checkboxes'),
    adminMoviesContainer: $('#admin-movies-container'),
    statTotal: $('#stat-total'),
    statMovies: $('#stat-movies'),
    statSeries: $('#stat-series'),
    // Toast
    toastContainer: $('#toast-container'),
    // Footer
    footer: $('#main-footer'),
  };

  // Keep track of resolved Object URLs to revoke them when no longer needed
  const resolvedUrls = new Map();

  let trailerTimeout = null;
  let currentPlayingTrailerUrl = '';

  function clearResolvedUrls() {
    resolvedUrls.forEach((url) => URL.revokeObjectURL(url));
    resolvedUrls.clear();
  }

  // ---------- Data Layer ----------
  async function loadMovies() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        movies = JSON.parse(stored);
        // Clean up any old Base64 files stored in localStorage by mistake
        let migrated = false;
        movies = movies.map(m => {
          if (m.poster && m.poster.startsWith('data:image/')) {
            m.poster = '';
            migrated = true;
          }
          if (m.backdrop && m.backdrop.startsWith('data:image/')) {
            m.backdrop = '';
            migrated = true;
          }
          if (m.video && m.video.startsWith('data:video/')) {
            m.video = '';
            m.videoType = 'url';
            migrated = true;
          }
          return m;
        });
        if (migrated) {
          saveMovies();
        }
      } catch {
        movies = [...DEFAULT_MOVIES];
        saveMovies();
      }
    } else {
      movies = [...DEFAULT_MOVIES];
      saveMovies();
    }
    await resolveLocalMedia();
  }

  function saveMovies() {
    try {
      // Save metadata only, not actual Blobs (IndexedDB takes care of Blobs)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movies.map(m => {
        // Remove resolved object URLs before saving
        const copy = { ...m };
        delete copy.resolvedPoster;
        delete copy.resolvedBackdrop;
        delete copy.resolvedVideo;
        return copy;
      })));
    } catch (err) {
      console.error("Erro ao salvar no localStorage:", err);
      showToast("Erro: limite de armazenamento excedido! Tente limpar mídias antigas.", "error");
    }
  }

  async function resolveLocalMedia() {
    clearResolvedUrls();
    for (let movie of movies) {
      // Resolve Poster
      if (movie.poster && movie.poster.startsWith('db:')) {
        const key = movie.poster.substring(3);
        try {
          const blob = await getMedia(key);
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolvedUrls.set(key, url);
            movie.resolvedPoster = url;
          } else {
            movie.resolvedPoster = '';
          }
        } catch (err) {
          console.error("Erro ao resolver poster do DB:", err);
          movie.resolvedPoster = '';
        }
      } else {
        movie.resolvedPoster = movie.poster;
      }

      // Resolve Backdrop
      if (movie.backdrop && movie.backdrop.startsWith('db:')) {
        const key = movie.backdrop.substring(3);
        try {
          const blob = await getMedia(key);
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolvedUrls.set(key, url);
            movie.resolvedBackdrop = url;
          } else {
            movie.resolvedBackdrop = '';
          }
        } catch (err) {
          console.error("Erro ao resolver backdrop do DB:", err);
          movie.resolvedBackdrop = '';
        }
      } else {
        movie.resolvedBackdrop = movie.backdrop;
      }

      // Resolve Video (will be resolved dynamically on-demand to save memory)
      movie.resolvedVideo = movie.video;
    }
  }

  function getNextId() {
    if (movies.length === 0) return 1;
    return Math.max(...movies.map((m) => m.id)) + 1;
  }

  // ---------- Toast ----------
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

  // ---------- Navigation ----------
  function navigateTo(page) {
    currentPage = page;
    
    if (mainHeroTrailerTimeout) {
      clearTimeout(mainHeroTrailerTimeout);
      mainHeroTrailerTimeout = null;
    }
    stopMainHeroTrailer();

    // Update page visibility
    Object.keys(DOM.pages).forEach((key) => {
      DOM.pages[key].classList.toggle('active', key === page);
    });
    // Update nav active state
    $$('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === page);
    });
    // Footer visibility
    DOM.footer.style.display = page === 'admin' ? 'none' : 'block';
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Close mobile menu
    DOM.nav.classList.remove('open');
    DOM.menuToggle.classList.remove('active');
    // Render content for the page
    if (page === 'home') renderHome();
    if (page === 'movies') renderMoviesPage();
    if (page === 'series') renderSeriesPage();
    if (page === 'admin') renderAdmin();
  }

  // ---------- Hero Banner ----------
  function renderHero() {
    const featured = movies.find((m) => m.featured) || movies[0];
    if (!featured) return;

    if (mainHeroTrailerTimeout) clearTimeout(mainHeroTrailerTimeout);
    stopMainHeroTrailer();

    if (featured.resolvedBackdrop) {
      DOM.heroBackdrop.style.backgroundImage = `url("${featured.resolvedBackdrop}")`;
    } else {
      DOM.heroBackdrop.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221000%22 height=%22500%22><rect fill=%22%2312121a%22 width=%221000%22 height=%22500%22/></svg>')`;
    }
    DOM.heroTitle.textContent = featured.title;
    DOM.heroRating.textContent = featured.rating.toFixed(1);
    DOM.heroYear.textContent = featured.year;
    DOM.heroDuration.textContent = featured.duration;
    DOM.heroGenres.innerHTML = featured.genres
      .map((g) => `<span>${g}</span>`)
      .join('');
    DOM.heroDescription.textContent = featured.description;

    const progressKey = `darkflix_progress_${featured.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      DOM.heroWatchBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Continuar Assistindo
      `;
    } else {
      DOM.heroWatchBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Assistir Agora
      `;
    }

    DOM.heroWatchBtn.onclick = () => openCinema(featured);
    DOM.heroInfoBtn.onclick = () => openDetail(featured);

    mainHeroTrailerTimeout = setTimeout(() => {
      playMainHeroTrailer(featured);
    }, 5000);
  }

  // ---------- Movie Card HTML ----------
  function createCardHTML(movie, index) {
    const posterSrc = movie.resolvedPoster || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22><rect fill=%22%2312121a%22 width=%22300%22 height=%22450%22/><text fill=%22%236a6a7a%22 font-family=%22sans-serif%22 font-size=%2216%22 x=%22150%22 y=%22225%22 text-anchor=%22middle%22>Sem Poster</text></svg>';
    
    // Check progress
    const progressKey = `darkflix_progress_${movie.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    let progressBarHTML = '';
    
    if (savedProgress) {
      try {
        const prog = JSON.parse(savedProgress);
        if (prog && prog.percent > 0) {
          progressBarHTML = `
            <div class="card-progress-bar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255, 255, 255, 0.3); z-index: 5;">
              <div style="height: 100%; width: ${prog.percent}%; background: var(--accent); transition: width 0.3s ease;"></div>
            </div>
          `;
        }
      } catch (e) {}
    }

    return `
      <div class="movie-card" data-id="${movie.id}" style="animation-delay: ${index * 0.06}s">
        <img class="movie-card-poster" src="${posterSrc}" alt="${movie.title}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22><rect fill=%22%2312121a%22 width=%22300%22 height=%22450%22/><text fill=%22%236a6a7a%22 font-family=%22sans-serif%22 font-size=%2216%22 x=%22150%22 y=%22225%22 text-anchor=%22middle%22>Sem Imagem</text></svg>'">
        <div class="movie-card-overlay">
          <div class="movie-card-play">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <div class="movie-card-info">
          <h3 class="movie-card-title">${movie.title}</h3>
          <div class="movie-card-meta">
            <span class="card-rating">★ ${movie.rating.toFixed(1)}</span>
            <span>${movie.year}</span>
            <span>${movie.type === 'movie' ? 'Filme' : 'Série'}</span>
          </div>
        </div>
        ${progressBarHTML}
      </div>
    `;
  }

  function attachCardEvents(container) {
    container.querySelectorAll('.movie-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const movie = movies.find((m) => Number(m.id) === Number(id));
        if (movie) openDetail(movie);
      });
    });
  }

  // ---------- Render Home ----------
  function renderHome() {
    renderHero();

    const categories = {};
    movies.forEach((m) => {
      m.genres.forEach((g) => {
        if (!categories[g]) categories[g] = [];
        categories[g].push(m);
      });
    });

    // Build recent + categorized sections
    let html = '';

    // Continuar Assistindo
    const continueWatchingMovies = [];
    movies.forEach((m) => {
      const progressKey = `darkflix_progress_${m.id}`;
      const progress = localStorage.getItem(progressKey);
      if (progress) {
        try {
          const prog = JSON.parse(progress);
          continueWatchingMovies.push({ movie: m, timestamp: prog.timestamp || 0 });
        } catch (e) {
          continueWatchingMovies.push({ movie: m, timestamp: 0 });
        }
      }
    });

    // Sort by timestamp descending (most recent first)
    continueWatchingMovies.sort((a, b) => b.timestamp - a.timestamp);

    if (continueWatchingMovies.length > 0) {
      html += `
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Continuar Assistindo</h2>
          </div>
          <div class="movies-grid">
            ${continueWatchingMovies.map((item, i) => createCardHTML(item.movie, i)).join('')}
          </div>
        </section>
      `;
    }

    // Recently added (last 8)
    const recent = [...movies].reverse().slice(0, 8);
    if (recent.length > 0) {
      html += `
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Adicionados Recentemente</h2>
          </div>
          <div class="movies-grid">
            ${recent.map((m, i) => createCardHTML(m, i)).join('')}
          </div>
        </section>
      `;
    }

    // Popular (top rated)
    const popular = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 8);
    if (popular.length > 0) {
      html += `
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Mais Populares</h2>
          </div>
          <div class="movies-grid">
            ${popular.map((m, i) => createCardHTML(m, i)).join('')}
          </div>
        </section>
      `;
    }

    // Genre categories (top 4 by count)
    const sortedGenres = Object.entries(categories)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 4);

    sortedGenres.forEach(([genre, genreMovies]) => {
      const uniqueMovies = genreMovies.slice(0, 8);
      html += `
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">${genre}</h2>
          </div>
          <div class="movies-grid">
            ${uniqueMovies.map((m, i) => createCardHTML(m, i)).join('')}
          </div>
        </section>
      `;
    });

    DOM.homeContent.innerHTML = html;

    // Attach events to all cards
    attachCardEvents(DOM.homeContent);
  }

  // ---------- Render Movies Page ----------
  function renderMoviesPage() {
    const allMovies = movies.filter((m) => m.type === 'movie');
    const genres = [...new Set(allMovies.flatMap((m) => m.genres))].sort();

    DOM.moviesFilterBar.innerHTML =
      `<button class="filter-btn active" data-genre="all">Todos</button>` +
      genres.map((g) => `<button class="filter-btn" data-genre="${g}">${g}</button>`).join('');

    function filterMovies(genre) {
      const filtered = genre === 'all' ? allMovies : allMovies.filter((m) => m.genres.includes(genre));
      DOM.moviesGridAll.innerHTML = filtered.map((m, i) => createCardHTML(m, i)).join('');
      attachCardEvents(DOM.moviesGridAll);
    }

    filterMovies('all');

    DOM.moviesFilterBar.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        DOM.moviesFilterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filterMovies(btn.dataset.genre);
      });
    });
  }

  // ---------- Render Series Page ----------
  function renderSeriesPage() {
    const allSeries = movies.filter((m) => m.type === 'series');
    const genres = [...new Set(allSeries.flatMap((m) => m.genres))].sort();

    DOM.seriesFilterBar.innerHTML =
      `<button class="filter-btn active" data-genre="all">Todas</button>` +
      genres.map((g) => `<button class="filter-btn" data-genre="${g}">${g}</button>`).join('');

    function filterSeries(genre) {
      const filtered = genre === 'all' ? allSeries : allSeries.filter((m) => m.genres.includes(genre));
      DOM.seriesGridAll.innerHTML = filtered.map((m, i) => createCardHTML(m, i)).join('');
      attachCardEvents(DOM.seriesGridAll);
    }

    filterSeries('all');

    DOM.seriesFilterBar.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        DOM.seriesFilterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filterSeries(btn.dataset.genre);
      });
    });
  }

  // ---------- Search ----------
  function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      navigateTo('home');
      return;
    }

    navigateTo('search');
    const results = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
    );

    DOM.searchResultsTitle.innerHTML = `Resultados para: <strong>"${query.trim()}"</strong> (${results.length})`;

    if (results.length === 0) {
      DOM.searchResultsGrid.innerHTML = '';
      DOM.noResults.style.display = 'block';
    } else {
      DOM.noResults.style.display = 'none';
      DOM.searchResultsGrid.innerHTML = results.map((m, i) => createCardHTML(m, i)).join('');
      attachCardEvents(DOM.searchResultsGrid);
    }
  }

  // ---------- Detail Modal ----------
  function openDetail(movie) {
    currentMovieDetail = movie;
    
    if (mainHeroTrailerTimeout) {
      clearTimeout(mainHeroTrailerTimeout);
      mainHeroTrailerTimeout = null;
    }
    stopMainHeroTrailer();

    if (trailerTimeout) clearTimeout(trailerTimeout);
    stopHeroTrailer();

    if (movie.resolvedBackdrop) {
      DOM.modalHero.style.backgroundImage = `url("${movie.resolvedBackdrop}")`;
    } else {
      DOM.modalHero.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%221000%22 height=%22500%22><rect fill=%22%2312121a%22 width=%221000%22 height=%22500%22/></svg>')`;
    }
    DOM.modalTitle.textContent = movie.title;
    DOM.modalRating.textContent = movie.rating.toFixed(1);
    DOM.modalYear.textContent = movie.year;
    DOM.modalDuration.textContent = movie.duration;
    DOM.modalTypeBadge.textContent = movie.type === 'movie' ? 'Filme' : 'Série';
    DOM.modalGenres.innerHTML = movie.genres.map((g) => `<span>${g}</span>`).join('');
    DOM.modalDescription.textContent = movie.description;

    const progressKey = `darkflix_progress_${movie.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      try {
        const prog = JSON.parse(savedProgress);
        DOM.modalWatchBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Continuar Assistindo (${formatTime(prog.time)})
        `;
      } catch (e) {
        DOM.modalWatchBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Continuar Assistindo
        `;
      }
    } else {
      DOM.modalWatchBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Assistir Agora
      `;
    }

    DOM.modalWatchBtn.onclick = () => {
      closeDetail();
      setTimeout(() => openCinema(movie), 300);
    };
    DOM.detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Start 5 second trailer countdown
    trailerTimeout = setTimeout(() => {
      playHeroTrailer(movie);
    }, 5000);
  }

  function closeDetail() {
    if (trailerTimeout) {
      clearTimeout(trailerTimeout);
      trailerTimeout = null;
    }
    stopHeroTrailer();

    DOM.detailModal.classList.remove('active');
    document.body.style.overflow = '';
    currentMovieDetail = null;
  }

  async function playHeroTrailer(movie) {
    if (!movie) return;

    let trailerSource = movie.trailer || '';
    let trailerType = movie.trailerType || '';

    if (!trailerSource && movie.video && movie.videoType !== 'file') {
      trailerSource = movie.video;
      trailerType = 'url';
    }

    if (!trailerSource) return;

    try {
      if (trailerType === 'file') {
        DOM.modalTrailerIframe.style.display = 'none';
        DOM.modalTrailerIframe.src = '';
        DOM.modalTrailerVideo.style.display = 'block';

        let videoUrl = '';
        if (trailerSource.startsWith('db:')) {
          const blob = await getMovieTrailer(movie.id);
          if (blob) {
            videoUrl = URL.createObjectURL(blob);
            currentPlayingTrailerUrl = videoUrl;
          }
        } else {
          videoUrl = trailerSource;
        }

        if (videoUrl) {
          DOM.modalTrailerVideo.src = videoUrl;
          DOM.modalTrailerVideo.play().catch(err => console.log("Trailer auto-play prevented:", err));
        }
      } else {
        DOM.modalTrailerVideo.style.display = 'none';
        DOM.modalTrailerVideo.pause();
        DOM.modalTrailerVideo.src = '';
        DOM.modalTrailerIframe.style.display = 'block';

        let embedUrl = trailerSource;
        if (embedUrl.includes('youtube.com/') || embedUrl.includes('youtu.be/')) {
          let videoId = '';
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = embedUrl.match(regExp);
          if (match && match[2].length === 11) {
            videoId = match[2];
          }
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`;
          }
        } else if (!embedUrl.includes('autoplay=')) {
          const separator = embedUrl.includes('?') ? '&' : '?';
          embedUrl = `${embedUrl}${separator}autoplay=1&mute=1&controls=0&loop=1`;
        }

        DOM.modalTrailerIframe.src = embedUrl;
      }

      DOM.modalHeroTrailer.classList.add('active');
    } catch (err) {
      console.error("Erro ao iniciar trailer do banner:", err);
    }
  }

  function stopHeroTrailer() {
    DOM.modalHeroTrailer.classList.remove('active');

    DOM.modalTrailerVideo.pause();
    DOM.modalTrailerVideo.src = '';
    DOM.modalTrailerVideo.style.display = 'none';

    DOM.modalTrailerIframe.src = '';
    DOM.modalTrailerIframe.style.display = 'none';

    if (currentPlayingTrailerUrl) {
      URL.revokeObjectURL(currentPlayingTrailerUrl);
      currentPlayingTrailerUrl = '';
    }
  }

  async function playMainHeroTrailer(movie) {
    if (!movie) return;

    let trailerSource = movie.trailer || '';
    let trailerType = movie.trailerType || '';

    if (!trailerSource && movie.video && movie.videoType !== 'file') {
      trailerSource = movie.video;
      trailerType = 'url';
    }

    if (!trailerSource) return;

    try {
      if (trailerType === 'file') {
        DOM.heroTrailerIframe.style.display = 'none';
        DOM.heroTrailerIframe.src = '';
        DOM.heroTrailerVideo.style.display = 'block';

        let videoUrl = '';
        if (trailerSource.startsWith('db:')) {
          const blob = await getMovieTrailer(movie.id);
          if (blob) {
            videoUrl = URL.createObjectURL(blob);
            currentMainHeroTrailerUrl = videoUrl;
          }
        } else {
          videoUrl = trailerSource;
        }

        if (videoUrl) {
          DOM.heroTrailerVideo.src = videoUrl;
          DOM.heroTrailerVideo.play().catch(err => console.log("Main hero trailer auto-play prevented:", err));
        }
      } else {
        DOM.heroTrailerVideo.style.display = 'none';
        DOM.heroTrailerVideo.pause();
        DOM.heroTrailerVideo.src = '';
        DOM.heroTrailerIframe.style.display = 'block';

        let embedUrl = trailerSource;
        if (embedUrl.includes('youtube.com/') || embedUrl.includes('youtu.be/')) {
          let videoId = '';
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = embedUrl.match(regExp);
          if (match && match[2].length === 11) {
            videoId = match[2];
          }
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`;
          }
        } else if (!embedUrl.includes('autoplay=')) {
          const separator = embedUrl.includes('?') ? '&' : '?';
          embedUrl = `${embedUrl}${separator}autoplay=1&mute=1&controls=0&loop=1`;
        }

        DOM.heroTrailerIframe.src = embedUrl;
      }

      DOM.heroTrailer.classList.add('active');
    } catch (err) {
      console.error("Erro ao iniciar trailer do banner principal:", err);
    }
  }

  function stopMainHeroTrailer() {
    DOM.heroTrailer.classList.remove('active');

    DOM.heroTrailerVideo.pause();
    DOM.heroTrailerVideo.src = '';
    DOM.heroTrailerVideo.style.display = 'none';

    DOM.heroTrailerIframe.src = '';
    DOM.heroTrailerIframe.style.display = 'none';

    if (currentMainHeroTrailerUrl) {
      URL.revokeObjectURL(currentMainHeroTrailerUrl);
      currentMainHeroTrailerUrl = '';
    }
  }

  // ---------- Cinema Mode ----------
  // ---------- Cinema Mode ----------
  async function openCinema(movie) {
    currentCinemaMovie = movie;

    if (mainHeroTrailerTimeout) {
      clearTimeout(mainHeroTrailerTimeout);
      mainHeroTrailerTimeout = null;
    }
    stopMainHeroTrailer();

    if (trailerTimeout) {
      clearTimeout(trailerTimeout);
      trailerTimeout = null;
    }
    stopHeroTrailer();

    DOM.cinemaTitle.textContent = movie.title;

    const progressKey = `darkflix_progress_${movie.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    let startSeconds = 0;
    if (savedProgress) {
      try {
        const prog = JSON.parse(savedProgress);
        startSeconds = prog.time || 0;
      } catch (e) {
        startSeconds = parseFloat(savedProgress) || 0;
      }
    }

    if (movie.videoType === 'file') {
      DOM.cinemaIframe.style.display = 'none';
      DOM.cinemaIframe.src = '';
      DOM.cinemaVideo.style.display = 'block';

      let videoUrl = '';
      if (movie.video && movie.video.startsWith('db:')) {
        showToast('Carregando vídeo local...', 'info');
        try {
          const blob = await getMovieVideo(movie.id);
          if (blob) {
            videoUrl = URL.createObjectURL(blob);
            currentPlayingVideoUrl = videoUrl;
          } else {
            showToast('Erro: arquivo de vídeo não encontrado no banco local.', 'error');
            return;
          }
        } catch (err) {
          console.error("Erro ao carregar vídeo do IndexedDB:", err);
          showToast('Erro ao ler vídeo do banco local.', 'error');
          return;
        }
      } else {
        videoUrl = movie.video;
      }

      DOM.cinemaVideo.src = videoUrl;

      DOM.cinemaVideo.onloadedmetadata = () => {
        if (startSeconds > 0) {
          DOM.cinemaVideo.currentTime = startSeconds;
          showToast(`Continuando de ${formatTime(startSeconds)}...`, 'info');
        }
      };

      DOM.cinemaVideo.ontimeupdate = () => {
        const currTime = DOM.cinemaVideo.currentTime;
        const duration = DOM.cinemaVideo.duration;
        if (currTime && duration) {
          if (duration - currTime < 15 || currTime < 10) {
            localStorage.removeItem(progressKey);
          } else {
            localStorage.setItem(progressKey, JSON.stringify({
              time: currTime,
              duration: duration,
              percent: (currTime / duration) * 100,
              timestamp: Date.now()
            }));
          }
        }
      };

      DOM.cinemaVideo.onended = () => {
        localStorage.removeItem(progressKey);
      };

      DOM.cinemaVideo.play().catch(err => console.log("Auto-play prevented:", err));
    } else {
      DOM.cinemaVideo.style.display = 'none';
      DOM.cinemaVideo.src = '';
      DOM.cinemaVideo.ontimeupdate = null;
      DOM.cinemaVideo.onloadedmetadata = null;
      DOM.cinemaVideo.onended = null;
      DOM.cinemaIframe.style.display = 'block';

      const videoId = getYouTubeId(movie.video);
      if (videoId) {
        await loadYouTubeAPI();

        // Create player
        ytPlayer = new YT.Player('cinema-iframe', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            start: Math.floor(startSeconds)
          },
          events: {
            onReady: (event) => {
              if (startSeconds > 0) {
                showToast(`Continuando de ${formatTime(startSeconds)}...`, 'info');
              }
              if (ytInterval) clearInterval(ytInterval);
              ytInterval = setInterval(() => {
                try {
                  const currTime = ytPlayer.getCurrentTime();
                  const duration = ytPlayer.getDuration();
                  if (currTime && duration) {
                    if (duration - currTime < 15 || currTime < 10) {
                      localStorage.removeItem(progressKey);
                    } else {
                      localStorage.setItem(progressKey, JSON.stringify({
                        time: currTime,
                        duration: duration,
                        percent: (currTime / duration) * 100,
                        timestamp: Date.now()
                      }));
                    }
                  }
                } catch (e) {}
              }, 2000);
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                localStorage.removeItem(progressKey);
              }
            }
          }
        });
      } else {
        DOM.cinemaIframe.src = movie.video;
      }
    }

    DOM.cinemaMode.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCinema() {
    DOM.cinemaMode.classList.remove('active');

    if (ytInterval) {
      clearInterval(ytInterval);
      ytInterval = null;
    }

    if (currentCinemaMovie) {
      const movieId = currentCinemaMovie.id;
      const progressKey = `darkflix_progress_${movieId}`;

      if (currentCinemaMovie.videoType === 'file') {
        const currTime = DOM.cinemaVideo.currentTime;
        const duration = DOM.cinemaVideo.duration;
        if (currTime && duration && duration - currTime > 15 && currTime > 10) {
          localStorage.setItem(progressKey, JSON.stringify({
            time: currTime,
            duration: duration,
            percent: (currTime / duration) * 100,
            timestamp: Date.now()
          }));
        } else {
          localStorage.removeItem(progressKey);
        }
      } else if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        try {
          const currTime = ytPlayer.getCurrentTime();
          const duration = ytPlayer.getDuration();
          if (currTime && duration && duration - currTime > 15 && currTime > 10) {
            localStorage.setItem(progressKey, JSON.stringify({
              time: currTime,
              duration: duration,
              percent: (currTime / duration) * 100,
              timestamp: Date.now()
            }));
          } else {
            localStorage.removeItem(progressKey);
          }
          ytPlayer.stopVideo();
        } catch (e) {}
      }
    }

    // Stop and clear native video
    DOM.cinemaVideo.pause();
    DOM.cinemaVideo.src = '';
    DOM.cinemaVideo.ontimeupdate = null;
    DOM.cinemaVideo.onloadedmetadata = null;
    DOM.cinemaVideo.onended = null;
    try {
      DOM.cinemaVideo.load();
    } catch (e) {}

    // Clear iframe src
    DOM.cinemaIframe.src = '';

    // Free memory of the temporary blob URL
    if (currentPlayingVideoUrl) {
      URL.revokeObjectURL(currentPlayingVideoUrl);
      currentPlayingVideoUrl = null;
    }

    document.body.style.overflow = '';

    // Re-render current page to refresh progress indicators
    if (currentPage === 'home') renderHome();
    else if (currentPage === 'movies') renderMoviesPage();
    else if (currentPage === 'series') renderSeriesPage();
    
    currentCinemaMovie = null;
  }

  // ---------- Admin Panel ----------
  function renderAdmin() {
    updateStats();
    renderGenreCheckboxes();
    renderAdminList();
  }

  function updateStats() {
    DOM.statTotal.textContent = movies.length;
    DOM.statMovies.textContent = movies.filter((m) => m.type === 'movie').length;
    DOM.statSeries.textContent = movies.filter((m) => m.type === 'series').length;
  }

  function renderGenreCheckboxes() {
    DOM.genresCheckboxes.innerHTML = ALL_GENRES.map(
      (g) => `
      <label class="genre-checkbox">
        <input type="checkbox" value="${g}">
        <span>${g}</span>
      </label>
    `
    ).join('');
  }

  function renderAdminList() {
    if (movies.length === 0) {
      DOM.adminMoviesContainer.innerHTML = `
        <div class="no-results" style="padding: 40px;">
          <h3>Nenhum título cadastrado</h3>
          <p>Use o formulário acima para adicionar filmes e séries.</p>
        </div>
      `;
      return;
    }

    DOM.adminMoviesContainer.innerHTML = movies
      .map(
        (m) => `
      <div class="admin-movie-item" data-id="${m.id}">
        <img class="admin-movie-thumb" src="${m.resolvedPoster || ''}" alt="${m.title}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2275%22><rect fill=%22%2312121a%22 width=%2250%22 height=%2275%22/><text fill=%22%236a6a7a%22 font-family=%22sans-serif%22 font-size=%2210%22 x=%2225%22 y=%2237%22 text-anchor=%22middle%22>Sem Poster</text></svg>'">
        <div class="admin-movie-info">
          <h3>${m.title} ${m.featured ? '⭐' : ''}</h3>
          <p>${m.year} · ${m.duration} · ${m.type === 'movie' ? 'Filme' : 'Série'} · ★ ${m.rating.toFixed(1)}</p>
          <small style="color: var(--accent);">${m.videoType === 'file' ? '📁 Arquivo MP4 Local' : '🔗 Link / Trailer Externo'}</small>
        </div>
        <div class="admin-movie-actions">
          <button class="btn btn-small btn-success admin-edit-btn" data-id="${m.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn btn-small btn-danger admin-delete-btn" data-id="${m.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Excluir
          </button>
        </div>
      </div>
    `
      )
      .join('');

    // Edit buttons
    DOM.adminMoviesContainer.querySelectorAll('.admin-edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        startEdit(id);
      });
    });

    // Delete buttons
    DOM.adminMoviesContainer.querySelectorAll('.admin-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        deleteMovie(id);
      });
    });
  }

  // ---------- Form Operations ----------
  function resetForm() {
    DOM.movieForm.reset();
    DOM.formId.value = '';
    editingId = null;

    DOM.formTitleLabel.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Adicionar Novo Título
    `;
    DOM.formSubmitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Adicionar Título
    `;
    DOM.formCancelBtn.style.display = 'none';

    // Reset helper infos
    DOM.posterFileInfo.textContent = "Selecione uma imagem vertical (JPEG/PNG)";
    DOM.posterFileInfo.style.color = "var(--text-muted)";
    DOM.backdropFileInfo.textContent = "Selecione uma imagem horizontal (JPEG/PNG)";
    DOM.backdropFileInfo.style.color = "var(--text-muted)";
    DOM.videoFileInfo.textContent = "Selecione o arquivo de vídeo do filme";
    DOM.videoFileInfo.style.color = "var(--text-muted)";
    DOM.trailerFileInfo.textContent = "Vídeo curto (10-30s) para tocar como fundo do modal";
    DOM.trailerFileInfo.style.color = "var(--text-muted)";

    // Enable inputs
    DOM.formPosterFile.required = true;
    DOM.formBackdropFile.required = true;
    DOM.formVideoFile.required = true;

    // Reset checkboxes
    DOM.genresCheckboxes.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));

    // Clear previews
    DOM.posterPreview.innerHTML = '';
    DOM.backdropPreview.innerHTML = '';
  }

  function startEdit(id) {
    const movie = movies.find((m) => m.id === id);
    if (!movie) return;

    editingId = id;
    DOM.formId.value = id;
    DOM.formTitle.value = movie.title;
    DOM.formYear.value = movie.year;
    DOM.formDuration.value = movie.duration;
    DOM.formRating.value = movie.rating;
    DOM.formType.value = movie.type;
    DOM.formFeatured.checked = movie.featured;
    DOM.formDescription.value = movie.description;

    // File inputs are not required during edit (preserves old ones if not chosen)
    DOM.formPosterFile.required = false;
    DOM.formBackdropFile.required = false;
    DOM.formVideoFile.required = false;

    // Update helper infos to indicate current state
    if (movie.poster) {
      DOM.posterFileInfo.textContent = movie.poster.startsWith('db:') ? "✓ Imagem salva localmente" : "✓ Imagem do catálogo padrão";
      DOM.posterFileInfo.style.color = "#22c55e";
    }
    if (movie.backdrop) {
      DOM.backdropFileInfo.textContent = movie.backdrop.startsWith('db:') ? "✓ Imagem salva localmente" : "✓ Imagem do catálogo padrão";
      DOM.backdropFileInfo.style.color = "#22c55e";
    }
    if (movie.video) {
      DOM.videoFileInfo.textContent = movie.videoType === 'file' ? "✓ Vídeo MP4 salvo localmente" : "✓ Link de trailer padrão";
      DOM.videoFileInfo.style.color = "#22c55e";
    }
    if (movie.trailer && movie.trailerType === 'file') {
      DOM.trailerFileInfo.textContent = "✓ Trailer local salvo no DB";
      DOM.trailerFileInfo.style.color = "#22c55e";
    } else {
      DOM.trailerFileInfo.textContent = "Vídeo curto (10-30s) para tocar como fundo do modal";
      DOM.trailerFileInfo.style.color = "var(--text-muted)";
    }

    // Show current previews if editing
    if (movie.resolvedPoster) {
      DOM.posterPreview.innerHTML = `
        <div class="preview-box">
          <img src="${movie.resolvedPoster}" style="max-height: 120px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-top: 8px; display: block;" alt="Preview">
        </div>
      `;
    } else {
      DOM.posterPreview.innerHTML = '';
    }
    if (movie.resolvedBackdrop) {
      DOM.backdropPreview.innerHTML = `
        <div class="preview-box">
          <img src="${movie.resolvedBackdrop}" style="max-height: 120px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-top: 8px; display: block;" alt="Preview">
        </div>
      `;
    } else {
      DOM.backdropPreview.innerHTML = '';
    }

    // Set genre checkboxes
    DOM.genresCheckboxes.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = movie.genres.includes(cb.value);
    });

    DOM.formTitleLabel.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Editando: ${movie.title}
    `;
    DOM.formSubmitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Salvar Alterações
    `;
    DOM.formCancelBtn.style.display = 'inline-flex';

    // Scroll to form
    document.querySelector('.admin-form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    // Get selected genres
    const selectedGenres = [];
    DOM.genresCheckboxes.querySelectorAll('input[type="checkbox"]:checked').forEach((cb) => {
      selectedGenres.push(cb.value);
    });

    if (selectedGenres.length === 0) {
      showToast('Selecione pelo menos um gênero!', 'error');
      return;
    }

    const movieId = editingId !== null ? editingId : getNextId();

    // Disable form button and show processing toast
    DOM.formSubmitBtn.disabled = true;
    DOM.formSubmitBtn.textContent = 'Processando arquivos...';
    showToast('Salvando arquivos de mídia no banco local...', 'info');

    try {
      const posterFile = DOM.formPosterFile.files[0];
      const backdropFile = DOM.formBackdropFile.files[0];
      const videoFile = DOM.formVideoFile.files[0];
      const trailerFile = DOM.formTrailerFile.files[0];

      let posterVal = '';
      let backdropVal = '';
      let videoVal = '';
      let videoTypeVal = 'url'; // Default seed is URL
      let trailerVal = '';
      let trailerTypeVal = '';

      // If editing, start with current movie properties
      if (editingId !== null) {
        const existing = movies.find((m) => Number(m.id) === Number(editingId));
        if (existing) {
          posterVal = existing.poster;
          backdropVal = existing.backdrop;
          videoVal = existing.video;
          videoTypeVal = existing.videoType || 'url';
          trailerVal = existing.trailer || '';
          trailerTypeVal = existing.trailerType || '';
        }
      } else {
        // Required validation for new entry
        if (!posterFile || !backdropFile || !videoFile) {
          showToast('Todos os arquivos (Poster, Backdrop e Vídeo MP4) são obrigatórios para novos cadastros!', 'error');
          DOM.formSubmitBtn.disabled = false;
          DOM.formSubmitBtn.innerHTML = `Adicionar Título`;
          return;
        }
      }

      // Save Files to IndexedDB if uploaded
      if (posterFile) {
        const key = `poster_${movieId}_${Date.now()}`;
        // Clean up old media if editing a custom one
        if (editingId !== null && posterVal.startsWith('db:')) {
          await deleteMedia(posterVal.substring(3));
        }
        await saveMedia(key, posterFile);
        posterVal = `db:${key}`;
      }

      if (backdropFile) {
        const key = `backdrop_${movieId}_${Date.now()}`;
        if (editingId !== null && backdropVal.startsWith('db:')) {
          await deleteMedia(backdropVal.substring(3));
        }
        await saveMedia(key, backdropFile);
        backdropVal = `db:${key}`;
      }

      if (videoFile) {
        if (editingId !== null && videoVal.startsWith('db:')) {
          await deleteMovieVideo(movieId);
        }
        await saveMovieVideo(movieId, videoFile, (percent) => {
          DOM.formSubmitBtn.textContent = `Processando: ${percent}%`;
        });
        videoVal = `db:video_${movieId}`;
        videoTypeVal = 'file'; // Set type to file so HTML5 player is used
      }

      if (trailerFile) {
        if (editingId !== null && trailerVal.startsWith('db:')) {
          await deleteMovieTrailer(movieId);
        }
        await saveMovieTrailer(movieId, trailerFile, (percent) => {
          DOM.formSubmitBtn.textContent = `Processando Trailer: ${percent}%`;
        });
        trailerVal = `db:trailer_${movieId}`;
        trailerTypeVal = 'file';
      }

      const movieData = {
        id: movieId,
        title: DOM.formTitle.value.trim(),
        year: parseInt(DOM.formYear.value),
        duration: DOM.formDuration.value.trim(),
        rating: parseFloat(DOM.formRating.value),
        type: DOM.formType.value,
        featured: DOM.formFeatured.checked,
        genres: selectedGenres,
        description: DOM.formDescription.value.trim(),
        poster: posterVal,
        backdrop: backdropVal,
        video: videoVal,
        videoType: videoTypeVal,
        trailer: trailerVal,
        trailerType: trailerTypeVal
      };

      // If featured, unfeature others
      if (movieData.featured) {
        movies.forEach((m) => (m.featured = false));
      }

      if (editingId !== null) {
        const idx = movies.findIndex((m) => Number(m.id) === Number(editingId));
        if (idx !== -1) {
          movies[idx] = movieData;
          showToast(`"${movieData.title}" atualizado com sucesso!`, 'success');
        }
      } else {
        movies.push(movieData);
        showToast(`"${movieData.title}" adicionado com sucesso!`, 'success');
      }

      saveMovies();
      await resolveLocalMedia(); // Refresh blob URLs in runtime
      resetForm();
      renderAdmin();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar arquivos locais no IndexedDB!', 'error');
    } finally {
      DOM.formSubmitBtn.disabled = false;
      DOM.formSubmitBtn.innerHTML = editingId !== null ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Salvar Alterações
      ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Adicionar Título
      `;
    }
  }

  async function deleteMovie(id) {
    const movie = movies.find((m) => Number(m.id) === Number(id));
    if (!movie) return;

    if (confirm(`Tem certeza que deseja excluir "${movie.title}"?`)) {
      try {
        // Delete poster file if stored in IndexedDB
        if (movie.poster && movie.poster.startsWith('db:')) {
          await deleteMedia(movie.poster.substring(3));
        }
        // Delete backdrop file
        if (movie.backdrop && movie.backdrop.startsWith('db:')) {
          await deleteMedia(movie.backdrop.substring(3));
        }
        // Delete video file
        if (movie.video && movie.video.startsWith('db:')) {
          await deleteMovieVideo(id);
        }
        // Delete trailer file
        if (movie.trailer && movie.trailer.startsWith('db:')) {
          await deleteMovieTrailer(id);
        }
      } catch (err) {
        console.error("Erro ao excluir arquivos de mídia do DB:", err);
      }

      movies = movies.filter((m) => Number(m.id) !== Number(id));
      saveMovies();
      await resolveLocalMedia();
      renderAdmin();
      showToast(`"${movie.title}" removido do catálogo.`, 'info');
    }
  }

  async function resetCatalog() {
    if (confirm('Isso irá restaurar o catálogo para os dados originais e apagar todos os vídeos enviados. Continuar?')) {
      try {
        await clearMediaDB();
      } catch (err) {
        console.error("Erro ao limpar IndexedDB:", err);
      }
      movies = [...DEFAULT_MOVIES];
      saveMovies();
      await resolveLocalMedia();
      resetForm();
      renderAdmin();
      showToast('Catálogo restaurado para o padrão!', 'success');
    }
  }

  function handleFilePreview(inputElement, previewContainer, type) {
    inputElement.addEventListener('change', () => {
      const file = inputElement.files[0];
      previewContainer.innerHTML = '';
      if (!file) return;

      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          const resolutionText = `${width} x ${height}px`;
          let warningText = '';
          
          if (type === 'poster') {
            if (width > height) {
              warningText = `<span style="color: #ef4444; font-weight: 600; display: block; margin-top: 4px;">⚠️ O poster deve ser uma imagem VERTICAL (mais alta do que larga).</span>`;
            }
          } else if (type === 'backdrop') {
            if (width < height) {
              warningText = `<span style="color: #ef4444; font-weight: 600; display: block; margin-top: 4px;">⚠️ A imagem de fundo deve ser HORIZONTAL (mais larga do que alta).</span>`;
            } else if (width < 1280 || height < 720) {
              warningText = `<span style="color: #f59e0b; font-weight: 600; display: block; margin-top: 4px;">⚠️ Resolução recomendada é no mínimo HD (1280x720). A sua imagem possui resolução baixa (${resolutionText}) e poderá ficar embaçada na tela principal!</span>`;
            }
          }
          
          previewContainer.innerHTML = `
            <div class="preview-box" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border: 1px solid var(--border);">
              <img src="${e.target.result}" style="max-height: 120px; border-radius: var(--radius-sm); border: 1px solid var(--border); display: block;" alt="Preview">
              <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">
                Tamanho: <strong style="color: var(--text-primary);">${sizeMB} MB</strong> | Resolução: <strong style="color: var(--text-primary);">${resolutionText}</strong>
              </div>
              ${warningText}
            </div>
          `;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Header Scroll ----------
  function handleScroll() {
    DOM.header.classList.toggle('scrolled', window.scrollY > 50);
  }

  // ---------- Keyboard / Escape ----------
  function handleKeyboard(e) {
    if (e.key === 'Escape') {
      if (DOM.cinemaMode.classList.contains('active')) {
        closeCinema();
      } else if (DOM.detailModal.classList.contains('active')) {
        closeDetail();
      }
    }
  }

  // ---------- Init & Events ----------
  async function init() {
    // Show spinner/skeleton or loader if needed
    try {
      await initDB();
      await loadMovies();
    } catch (err) {
      console.error("Initialization error:", err);
      showToast("Erro ao carregar banco de dados de mídia local!", "error");
    }

    // Navigation
    $$('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) navigateTo(page);
      });
    });

    DOM.logoHome.addEventListener('click', () => navigateTo('home'));

    // Mobile menu
    DOM.menuToggle.addEventListener('click', () => {
      DOM.nav.classList.toggle('open');
      DOM.menuToggle.classList.toggle('active');
    });

    // Search
    DOM.searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        performSearch(DOM.searchInput.value);
      }, 350);
    });

    DOM.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(searchDebounce);
        performSearch(DOM.searchInput.value);
      }
    });

    // Detail Modal
    DOM.modalCloseBtn.addEventListener('click', closeDetail);
    DOM.detailModal.addEventListener('click', (e) => {
      if (e.target === DOM.detailModal) closeDetail();
    });

    // Cinema
    DOM.cinemaCloseBtn.addEventListener('click', closeCinema);

    // Admin Form
    DOM.movieForm.addEventListener('submit', handleFormSubmit);
    DOM.formCancelBtn.addEventListener('click', resetForm);
    DOM.formResetBtn.addEventListener('click', resetCatalog);

    // Register File Previews
    handleFilePreview(DOM.formPosterFile, DOM.posterPreview, 'poster');
    handleFilePreview(DOM.formBackdropFile, DOM.backdropPreview, 'backdrop');

    // Set poster required status by default for new movie
    DOM.formPosterFile.required = true;
    DOM.formBackdropFile.required = true;
    DOM.formVideoFile.required = true;

    // Scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Keyboard
    document.addEventListener('keydown', handleKeyboard);

    // Initial render
    navigateTo('home');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
