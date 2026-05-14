const API_KEY = '47a94868-c3ed-4a14-93cb-9cf0d79623cc'; 
const API_URL_TOP = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=';
const API_URL_DETAILS = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/';
const API_URL_SEARCH = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=';
const API_URL_STAFF = 'https://kinopoiskapiunofficial.tech/api/v1/staff?filmId=';
const API_URL_PERSON = 'https://kinopoiskapiunofficial.tech/api/v1/staff/';

const container = document.getElementById('movies-container');
const pageTitle = document.getElementById('page-title');
const searchInput = document.querySelector('.search-input');
const modal = document.getElementById('modal');
const modalDetails = document.getElementById('modal-details');
const btnLoadMore = document.getElementById('load-more');
const actorsList = document.getElementById('actors-list');
const modalActorsBlock = document.getElementById('modal-actors');
const actorInfoBlock = document.getElementById('actor-info');
const actorDetailsContent = document.getElementById('actor-details-content');

let currentPage = 1;
let currentType = 'TOP_100_POPULAR_FILMS';

async function fetchData(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Error');
        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

async function loadMovies(type, reset = true) {
    if (reset) {
        currentPage = 1;
        currentType = type;
        container.innerHTML = '';
        window.scrollTo(0, 0);
    }
    const data = await fetchData(`${API_URL_TOP}${currentType}&page=${currentPage}`);
    if (reset) {
        pageTitle.innerText = type === 'TOP_250_BEST_FILMS' ? 'Золотой фонд (Топ 250)' : 'Популярные фильмы';
    }
    renderMovies(data.films);
    btnLoadMore.style.display = data.pagesCount > currentPage ? 'inline-block' : 'none';
}

function renderMovies(movies) {
    if (!movies || movies.length === 0) {
        if (container.innerHTML === '') {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#777;">Ничего не нашлось...</p>';
        }
        return;
    }
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <div class="movie-card__img">
                <img src="${movie.posterUrlPreview}" alt="${movie.nameRu || 'Постер'}">
            </div>
            <div class="movie-card__content">
                <h3 class="movie-card__title">${movie.nameRu || movie.nameEn || 'Без названия'}</h3>
                <p class="movie-card__info">${movie.year || '—'}, ${movie.genres?.[0]?.genre || 'Кино'}</p>
            </div>
        `;
        movieCard.onclick = () => showDetails(movie.filmId || movie.kinopoiskId);
        container.appendChild(movieCard);
    });
}

async function showDetails(id) {
    if (!id) return;
    const movie = await fetchData(`${API_URL_DETAILS}${id}`);
    
    modalDetails.innerHTML = `
        <div class="modal-flex">
            <img src="${movie.posterUrl}" class="modal-poster" alt="${movie.nameRu}">
            <div class="modal-info">
                <h2>${movie.nameRu || movie.nameEn}</h2>
                <p><b>Год выпуска:</b> ${movie.year}</p>
                <p><b>Страна:</b> ${movie.countries?.map(c => c.country).join(', ') || '—'}</p>
                <p><b>Жанр:</b> ${movie.genres?.map(g => g.genre).join(', ') || '—'}</p>
                <p><b>Длительность:</b> ${movie.filmLength ? movie.filmLength + ' мин.' : '—'}</p>
                <div class="modal-desc">${movie.description || 'Описание отсутствует.'}</div>
                <br>
                <a href="${movie.webUrl}" target="_blank" class="btn btn-primary">Смотреть на Кинопоиске</a>
                </div>
        </div>
    `;

    modalDetails.style.display = 'block';
    modalActorsBlock.style.display = 'block';
    actorInfoBlock.style.display = 'none';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    loadActors(id);
}

async function loadActors(filmId) {
    actorsList.innerHTML = '<p>Загрузка актеров...</p>';
    const staff = await fetchData(`${API_URL_STAFF}${filmId}`);
    actorsList.innerHTML = '';
    
    const actors = staff.filter(person => person.professionKey === 'ACTOR').slice(0, 10);
    
    actors.forEach(actor => {
        const actorCard = document.createElement('div');
        actorCard.className = 'actor-card';
        actorCard.innerHTML = `
            <img src="${actor.posterUrl}" alt="${actor.nameRu}">
            <p>${actor.nameRu || actor.nameEn}</p>
        `;
        actorCard.onclick = () => showActorInfo(actor.staffId);
        actorsList.appendChild(actorCard);
    });
}

async function showActorInfo(personId) {
    const person = await fetchData(`${API_URL_PERSON}${personId}`);
    
    modalDetails.style.display = 'none';
    modalActorsBlock.style.display = 'none';
    actorInfoBlock.style.display = 'block';

    actorDetailsContent.innerHTML = `
        <div class="actor-info-content">
            <img src="${person.posterUrl}" class="actor-photo-big">
            <div class="modal-info">
                <h2>${person.nameRu || person.nameEn}</h2>
                <p><b>Профессия:</b> ${person.profession || '—'}</p>
                <p><b>Дата рождения:</b> ${person.birthday || '—'}</p>
                <p><b>Место рождения:</b> ${person.birthplace || '—'}</p>
                <p><b>Всего фильмов:</b> ${person.films?.length || 0}</p>
            </div>
        </div>
    `;
}

document.querySelector('.back-to-movie').onclick = () => {
    actorInfoBlock.style.display = 'none';
    modalDetails.style.display = 'block';
    modalActorsBlock.style.display = 'block';
};

btnLoadMore.onclick = () => {
    currentPage++;
    loadMovies(currentType, false);
};

searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        btnLoadMore.style.display = 'none';
        const query = searchInput.value.trim();
        const data = await fetchData(`${API_URL_SEARCH}${query}`);
        pageTitle.innerText = `Результаты поиска: ${query}`;
        container.innerHTML = '';
        renderMovies(data.films);
    }
});

const closeBtn = document.querySelector('.modal__close');
if (closeBtn) closeBtn.onclick = closeModal;

window.onclick = (e) => { 
    if (e.target === modal) closeModal(); 
};

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('user-email').value;
        const message = document.getElementById('user-message').value;
        console.log("Данные обратной связи:", { email, message });
        alert("Спасибо за отзыв! Данные выведены в консоль.");
        contactForm.reset();
    });
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
    });
}

loadMovies('TOP_100_POPULAR_FILMS');