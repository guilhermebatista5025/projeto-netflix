const API_KEY = '373a682e71fd01e6dc68adc4cb5f6093';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

// Objeto para controlar a posição de cada fileira individualmente
const scrollPositions = {};

const requests = {
    fetchOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213&language=pt-BR`,
    fetchTrending: `/trending/all/week?api_key=${API_KEY}&language=pt-BR`,
    fetchAction: `/discover/movie?api_key=${API_KEY}&with_genres=28&language=pt-BR`,
    fetchComedy: `/discover/movie?api_key=${API_KEY}&with_genres=35&language=pt-BR`,
};

async function fetchRow(url, elementId, isLarge = false) {
    const response = await fetch(BASE_URL + url);
    const data = await response.json();
    const row = document.getElementById(elementId);
    
    // Inicializa a posição da fileira no objeto de controle
    scrollPositions[elementId] = 0;

    data.results.forEach(movie => {
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${isLarge ? movie.poster_path : movie.backdrop_path}`;
        img.classList.add('poster');
        if (isLarge) img.classList.add('poster-large');
        row.appendChild(img);
    });

    return data.results;
}

// FUNÇÃO DE CLIQUE COM ANIMAÇÃO FLUIDA
document.addEventListener('click', (e) => {
    const handle = e.target.closest(".handle");
    if (!handle) return;

    const wrapper = handle.closest(".row-wrapper");
    const container = wrapper.querySelector(".row-posters");
    const rowId = container.id;
    const isLeft = handle.classList.contains("handle-left");

    // Largura visível do carrossel
    const windowWidth = wrapper.offsetWidth;
    // Largura total de todos os filmes juntos
    const totalContentWidth = container.scrollWidth;
    
    // Quanto vamos pular (90% da tela)
    const moveAmount = windowWidth * 0.9;

    if (isLeft) {
        // Volta para a esquerda (mínimo 0)
        scrollPositions[rowId] = Math.min(scrollPositions[rowId] + moveAmount, 0);
    } else {
        // Vai para a direita (limita para não sobrar espaço preto no final)
        const maxScroll = -(totalContentWidth - windowWidth + 60);
        scrollPositions[rowId] = Math.max(scrollPositions[rowId] - moveAmount, maxScroll);
    }

    // APLICA A ANIMAÇÃO NO CSS
    container.style.transform = `translateX(${scrollPositions[rowId]}px)`;
});

async function init() {
    const originals = await fetchRow(requests.fetchOriginals, 'originals-row', true);
    
    // Banner Aleatório
    const bannerMovie = originals[Math.floor(Math.random() * originals.length)];
    const banner = document.getElementById('main-banner');
    banner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(17,17,17,1)), url(${IMG_URL + bannerMovie.backdrop_path})`;
    document.getElementById('banner-title').innerText = bannerMovie.name || bannerMovie.title;
    document.getElementById('banner-desc').innerText = bannerMovie.overview;

    // Outras fileiras
    fetchRow(requests.fetchTrending, 'trending-row');
    fetchRow(requests.fetchAction, 'action-row');
    fetchRow(requests.fetchComedy, 'comedy-row');
}

// Navbar muda de cor no scroll
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 100) nav.style.backgroundColor = '#111';
    else nav.style.backgroundColor = 'transparent';
});

init();

// Seleciona o botão de assistir
const btnPlay = document.getElementById('btn-play-main');

if (btnPlay) {
    btnPlay.addEventListener('click', () => {
        // Guarda o conteúdo original (ícone + texto)
        const originalContent = btnPlay.innerHTML;

        // Muda o conteúdo para o estado de carregamento
        // Adicionei um ícone de spinner girando para ficar mais profissional
        btnPlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
        
        // Desativa o botão temporariamente para evitar vários cliques
        btnPlay.style.pointerEvents = 'none';
        btnPlay.style.opacity = '0.8';

        // Espera 2 segundos (2000 milissegundos) e volta ao normal
        setTimeout(() => {
            btnPlay.innerHTML = originalContent;
            btnPlay.style.pointerEvents = 'auto';
            btnPlay.style.opacity = '1';
            
            // Aqui você poderia colocar a lógica para abrir o vídeo
            console.log("Filme pronto para rodar!");
        }, 2000);
    });
}

const searchInput = document.getElementById('movie-search');
const categorySelect = document.getElementById('category-filter');

function filterMovies() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;
    const rows = document.querySelectorAll('.row');

    rows.forEach(row => {
        const rowId = row.querySelector('.row-posters').id;
        const posters = row.querySelectorAll('.poster');
        let hasVisibleMovie = false;

        // Verifica se a fileira corresponde à categoria selecionada (ou se "Todas" está ativo)
        const categoryMatch = (selectedCategory === 'all' || selectedCategory === rowId);

        posters.forEach(poster => {
            const movieName = poster.alt ? poster.alt.toLowerCase() : "";
            const nameMatch = movieName.includes(searchTerm);

            if (nameMatch && categoryMatch) {
                poster.classList.remove('hidden-movie');
                hasVisibleMovie = true;
            } else {
                poster.classList.add('hidden-movie');
            }
        });

        // Se não sobrar nenhum filme na fileira ou a categoria não bater, esconde a fileira toda
        if (hasVisibleMovie && categoryMatch) {
            row.classList.remove('hidden-row');
        } else {
            row.classList.add('hidden-row');
        }
    });
}

// Escuta a digitação e a mudança de categoria
searchInput.addEventListener('input', filterMovies);
categorySelect.addEventListener('change', filterMovies);