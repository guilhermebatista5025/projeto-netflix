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

  banner.style.backgroundImage =
    `url(${imgPath})`;

  title.textContent = movie.name || movie.title || '';
  desc.textContent  = movie.overview || '';
  if (year) year.textContent = (movie.first_air_date || movie.release_date || '').slice(0, 4);
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
  });
});

/* ============================================================
   BOTÃO ASSISTIR
   ============================================================ */
const btnPlay = document.getElementById('btn-play-main');
if (btnPlay) {
  btnPlay.addEventListener('click', () => {
    const orig = btnPlay.innerHTML;
    btnPlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Carregando...</span>';
    btnPlay.style.pointerEvents = 'none';
    btnPlay.style.opacity = '0.75';
    setTimeout(() => {
      btnPlay.innerHTML = orig;
      btnPlay.style.pointerEvents = '';
      btnPlay.style.opacity = '';
    }, 2000);
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
const searchInput   = document.getElementById('movie-search');
const mobileSearch  = document.getElementById('mobile-search');
const mobileFilter  = document.getElementById('mobile-category-filter');
const searchContainer = document.getElementById('search-container');

/* toggle busca desktop */
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