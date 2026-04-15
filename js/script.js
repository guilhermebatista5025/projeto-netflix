const API_KEY = '373a682e71fd01e6dc68adc4cb5f6093';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

const requests = {
  originals: `/discover/tv?api_key=${API_KEY}&with_networks=213&language=pt-BR`,
  trending:  `/trending/all/week?api_key=${API_KEY}&language=pt-BR`,
  action:    `/discover/movie?api_key=${API_KEY}&with_genres=28&language=pt-BR`,
  comedy:    `/discover/movie?api_key=${API_KEY}&with_genres=35&language=pt-BR`,
};

/* ---- posição de cada fileira ---- */
const scrollPos = {};

/* ---- filme do banner atual ---- */
let bannerMovie = null;

/* ============================================================
   BUSCAR TRAILER (YouTube)
   ============================================================ */
async function fetchTrailer(id, type = 'movie') {
  try {
    const res = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=pt-BR`);
    const data = await res.json();

    let video = data.results?.find(v =>
      v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    /* fallback: busca em inglês se não achar em PT */
    if (!video) {
      const res2 = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=en-US`);
      const data2 = await res2.json();
      video = data2.results?.find(v =>
        v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
    }

    return video ? video.key : null;
  } catch (err) {
    console.error('Erro ao buscar trailer:', err);
    return null;
  }
}

/* ============================================================
   PLAYER DE TRAILER — TELA CHEIA
   ============================================================ */
function createTrailerPlayer() {
  const overlay = document.createElement('div');
  overlay.id = 'trailer-overlay';
  overlay.innerHTML = `
    <div class="trailer-wrapper">
      <button class="trailer-close" id="trailer-close">
        <i class="fas fa-times"></i>
      </button>
      <div class="trailer-loading" id="trailer-loading">
        <div class="trailer-spinner"></div>
        <p>Carregando trailer...</p>
      </div>
      <div class="trailer-iframe-wrap" id="trailer-iframe-wrap"></div>
      <div class="trailer-no-video" id="trailer-no-video" style="display:none;">
        <i class="fas fa-film"></i>
        <p>Trailer não disponível para este título.</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('trailer-close')?.addEventListener('click', closeTrailer);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeTrailer();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTrailer();
  });
}

async function openTrailer(id, type, title) {
  const overlay = document.getElementById('trailer-overlay');
  if (!overlay) return;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const loading = document.getElementById('trailer-loading');
  const iframeWrap = document.getElementById('trailer-iframe-wrap');
  const noVideo = document.getElementById('trailer-no-video');

  loading.style.display = 'flex';
  iframeWrap.innerHTML = '';
  noVideo.style.display = 'none';

  const key = await fetchTrailer(id, type);

  loading.style.display = 'none';

  if (key) {
    iframeWrap.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${key}?autoplay=1&controls=1&rel=0&modestbranding=1"
        title="${title || 'Trailer'}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowfullscreen
      ></iframe>
    `;
  } else {
    noVideo.style.display = 'flex';
  }
}

function closeTrailer() {
  const overlay = document.getElementById('trailer-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  /* para o vídeo ao fechar */
  const iframeWrap = document.getElementById('trailer-iframe-wrap');
  if (iframeWrap) iframeWrap.innerHTML = '';
}

/* ============================================================
   FETCH DE FILEIRA
   ============================================================ */
async function fetchRow(url, rowId, isLarge = false) {
  try {
    const res  = await fetch(BASE_URL + url);
    const data = await res.json();
    const row  = document.getElementById(rowId);
    if (!row) return [];

    scrollPos[rowId] = 0;

    data.results.forEach(movie => {
      const imgPath = isLarge ? movie.poster_path : (movie.backdrop_path || movie.poster_path);
      if (!imgPath) return;

      const img = document.createElement('img');
      img.src   = IMG_W500 + imgPath;
      img.alt   = movie.name || movie.title || '';
      img.classList.add('poster');
      if (isLarge) img.classList.add('poster-large');

      /* guarda dados para o modal */
      img.dataset.title    = movie.name || movie.title || '';
      img.dataset.desc     = movie.overview || '';
      img.dataset.backdrop = movie.backdrop_path ? IMG_BASE + movie.backdrop_path : '';
      img.dataset.year     = (movie.first_air_date || movie.release_date || '').slice(0, 4);
      img.dataset.id       = movie.id;
      img.dataset.type     = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');

      img.loading = 'lazy';
      row.appendChild(img);
    });

    return data.results;
  } catch (err) {
    console.error('Erro ao buscar fileira:', err);
    return [];
  }
}

/* ============================================================
   BANNER
   ============================================================ */
function isMobile() { return window.innerWidth < 600; }

function setBanner(movie) {
  if (!movie) return;
  bannerMovie = movie;

  const banner = document.getElementById('main-banner');
  const title  = document.getElementById('banner-title');
  const desc   = document.getElementById('banner-desc');
  const year   = document.getElementById('banner-year');

  const imgPath = isMobile() && movie.poster_path
    ? IMG_BASE + movie.poster_path
    : IMG_BASE + (movie.backdrop_path || movie.poster_path);

  banner.style.backgroundImage = `url(${imgPath})`;

  title.textContent = movie.name || movie.title || '';
  desc.textContent  = movie.overview || '';
  if (year) year.textContent = (movie.first_air_date || movie.release_date || '').slice(0, 4);

  /* guarda id/type no banner para o botão assistir */
  banner.dataset.id   = movie.id;
  banner.dataset.type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
  banner.dataset.title = movie.name || movie.title || '';
}

/* ============================================================
   CARROSSEL — SETAS
   ============================================================ */
document.addEventListener('click', e => {
  const handle = e.target.closest('.handle');
  if (!handle) return;

  const wrapper   = handle.closest('.row-wrapper');
  const container = wrapper.querySelector('.row-posters');
  const rowId     = container.id;
  const isLeft    = handle.classList.contains('handle-left');

  const visible   = wrapper.offsetWidth;
  const total     = container.scrollWidth;
  const step      = visible * 0.85;

  if (isLeft) {
    scrollPos[rowId] = Math.min(scrollPos[rowId] + step, 0);
  } else {
    const max = -(total - visible);
    scrollPos[rowId] = Math.max(scrollPos[rowId] - step, max);
  }

  container.style.transform = `translateX(${scrollPos[rowId]}px)`;
});

/* ============================================================
   MODAL
   ============================================================ */
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');

function openModal(movie) {
  document.getElementById('modal-title').textContent   = movie.title;
  document.getElementById('modal-desc').textContent    = movie.desc;
  document.getElementById('modal-year').textContent    = movie.year;
  document.getElementById('modal-backdrop').style.backgroundImage =
    movie.backdrop ? `url(${movie.backdrop})` : 'none';

  /* botão Assistir dentro do modal */
  const modalPlayBtn = document.querySelector('.modal-buttons .btn-play');
  if (modalPlayBtn) {
    modalPlayBtn.onclick = () => {
      closeModal();
      openTrailer(movie.id, movie.type, movie.title);
    };
  }

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

/* clique em poster → modal */
document.addEventListener('click', e => {
  const poster = e.target.closest('.poster');
  if (!poster) return;
  openModal({
    title:    poster.dataset.title,
    desc:     poster.dataset.desc,
    backdrop: poster.dataset.backdrop,
    year:     poster.dataset.year,
    id:       poster.dataset.id,
    type:     poster.dataset.type,
  });
});

/* ============================================================
   BOTÃO ASSISTIR — BANNER
   ============================================================ */
const btnPlay = document.getElementById('btn-play-main');
if (btnPlay) {
  btnPlay.addEventListener('click', () => {
    const banner = document.getElementById('main-banner');
    const id     = banner?.dataset.id;
    const type   = banner?.dataset.type || 'movie';
    const title  = banner?.dataset.title || '';

    if (!id) return;
    openTrailer(id, type, title);
  });
}

/* ============================================================
   NAVBAR — scroll
   ============================================================ */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ============================================================
   HAMBURGER + DRAWER
   ============================================================ */
const hamburgerBtn  = document.getElementById('hamburger-btn');
const mobileDrawer  = document.getElementById('mobile-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');

function toggleDrawer(force) {
  const open = force !== undefined ? force : !mobileDrawer.classList.contains('open');
  mobileDrawer.classList.toggle('open', open);
  drawerOverlay.classList.toggle('open', open);
  hamburgerBtn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

hamburgerBtn?.addEventListener('click', () => toggleDrawer());
drawerOverlay?.addEventListener('click', () => toggleDrawer(false));

/* ============================================================
   BUSCA + FILTRO
   ============================================================ */
const searchInput     = document.getElementById('movie-search');
const mobileSearch    = document.getElementById('mobile-search');
const mobileFilter    = document.getElementById('mobile-category-filter');
const searchContainer = document.getElementById('search-container');

document.getElementById('search-icon')?.addEventListener('click', () => {
  searchContainer.classList.toggle('open');
  if (searchContainer.classList.contains('open')) {
    searchInput.focus();
  }
});

function filterMovies(term, category = 'all') {
  const t = (term || '').toLowerCase();

  document.querySelectorAll('.row').forEach(row => {
    const rowId   = row.querySelector('.row-posters')?.id || '';
    const posters = row.querySelectorAll('.poster');
    let visible   = 0;
    const catMatch = category === 'all' || category === rowId;

    posters.forEach(p => {
      const name = (p.alt || '').toLowerCase();
      const show = catMatch && name.includes(t);
      p.classList.toggle('hidden-movie', !show);
      if (show) visible++;
    });

    row.classList.toggle('hidden-row', !catMatch || visible === 0);
  });
}

searchInput?.addEventListener('input', () =>
  filterMovies(searchInput.value, mobileFilter?.value)
);

mobileSearch?.addEventListener('input', () => {
  searchInput.value = mobileSearch.value;
  filterMovies(mobileSearch.value, mobileFilter?.value);
});

mobileFilter?.addEventListener('change', () =>
  filterMovies(mobileSearch?.value || searchInput?.value, mobileFilter.value)
);

/* ============================================================
   BANNER — atualiza ao girar tela
   ============================================================ */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (bannerMovie) setBanner(bannerMovie);
  }, 200);
}, { passive: true });

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  createTrailerPlayer();

  const [originals] = await Promise.all([
    fetchRow(requests.originals, 'originals-row', true),
    fetchRow(requests.trending,  'trending-row'),
    fetchRow(requests.action,    'action-row'),
    fetchRow(requests.comedy,    'comedy-row'),
  ]);

  /* banner aleatório dos originais */
  if (originals.length) {
    const movie = originals[Math.floor(Math.random() * originals.length)];
    setBanner(movie);
  }
}

init();