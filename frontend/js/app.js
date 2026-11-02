/**
 * ReStram Play - Premium Movies & Series Streaming Engine
 * Inspired by FirKaizen Play (play.firkaizen.id) with Signature Cobalt/Electric Blue Theme
 */

(function () {
    'use strict';

    // Global App Object
    window.app = {
        state: {
            catalog: null,
            categories: {},
            heroItems: [],
            heroIndex: 0,
            heroTimer: null,
            currentMedia: null,
            user: JSON.parse(localStorage.getItem('restram_user') || 'null'),
            activeServer: localStorage.getItem('restram_active_server') || 'vidfast',
            watchlist: JSON.parse(localStorage.getItem('restram_watchlist') || '[]'),
            history: JSON.parse(localStorage.getItem('restram_history') || '[]'),
            currentSeason: 1,
            currentEpisode: 1,
            currentView: 'home', // 'home', 'grid', 'search'
            categoryGridSlug: null,
            searchQuery: ''
        },

        // Hardcoded Credentials
        CREDENTIALS: {
            'reno': 'restram2026',
            'admin': 'admin123'
        },

        genreMap: {
            28: 'Aksi', 12: 'Petualangan', 16: 'Animasi', 35: 'Komedi', 80: 'Kriminal',
            99: 'Dokumenter', 18: 'Drama', 10751: 'Keluarga', 14: 'Fantasi', 36: 'Sejarah',
            27: 'Horror', 10402: 'Musik', 9648: 'Misteri', 10749: 'Romansa', 878: 'Sci-Fi',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'Perang', 37: 'Western',
            10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy'
        },

        initAuth: function () {
            this.updateAuthUI();
        },

        openLoginModal: function () {
            const m = document.getElementById('auth-modal');
            const err = document.getElementById('auth-error');
            if (err) err.classList.add('hidden');
            if (m) {
                m.classList.remove('hidden');
                m.classList.add('flex');
            }
        },

        closeLoginModal: function () {
            const m = document.getElementById('auth-modal');
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        },

        handleLoginSubmit: function (e) {
            e.preventDefault();
            const u = (document.getElementById('login-username')?.value || '').trim();
            const p = (document.getElementById('login-password')?.value || '').trim();
            const err = document.getElementById('auth-error');

            if (this.CREDENTIALS[u] && this.CREDENTIALS[u] === p) {
                this.state.user = { username: u };
                localStorage.setItem('restram_user', JSON.stringify(this.state.user));
                this.closeLoginModal();
                this.updateAuthUI();
                this.loadHome();
            } else {
                if (err) {
                    err.innerText = 'Username atau password salah!';
                    err.classList.remove('hidden');
                }
            }
        },

        logout: function () {
            this.state.user = null;
            localStorage.removeItem('restram_user');
            this.updateAuthUI();
            this.loadHome();
        },

        updateAuthUI: function () {
            const isLogged = !!this.state.user;
            const loginBtn = document.getElementById('nav-login-btn');
            const userMenu = document.getElementById('nav-user-menu');
            const usernameEl = document.getElementById('nav-username');
            const id21Item = document.getElementById('nav-item-indodrama');
            const id21Chip = document.getElementById('chip-indodrama');
            const bnavAuthText = document.getElementById('bnav-auth-text');
            const bnavIndodrama = document.getElementById('bnav-indodrama');

            if (loginBtn) loginBtn.classList.toggle('hidden', isLogged);
            if (userMenu) userMenu.classList.toggle('hidden', !isLogged);
            if (usernameEl && this.state.user) usernameEl.innerText = this.state.user.username;

            // Show/Hide IndoDrama21 from desktop nav and mobile category chips
            if (id21Item) {
                id21Item.classList.toggle('hidden', !isLogged);
            }
            if (id21Chip) {
                id21Chip.classList.toggle('hidden', !isLogged);
            }
            if (bnavAuthText) {
                bnavAuthText.innerText = isLogged ? (this.state.user.username || 'VIP') : 'Masuk';
            }
            if (bnavIndodrama && isLogged) {
                bnavIndodrama.classList.add('text-blue-400');
            }
        },

        handleIndoDramaNav: function () {
            if (this.state.user) {
                this.openCategoryGrid('indodrama_stream', 'IndoDrama21 VIP Stream (Sub Indo)');
            } else {
                this.openLoginModal();
            }
        },

        handleAuthNav: function () {
            if (this.state.user) {
                if (confirm('Keluar dari akun ' + this.state.user.username + '?')) {
                    this.logout();
                }
            } else {
                this.openLoginModal();
            }
        },

        init: async function () {
            console.log('🚀 ReStram Play initializing...');
            this.loadLocalData();
            await this.fetchRemoteData();
            this.initNavbar();
            this.initSearch();
            this.initAuth();
            this.loadHome();
            this.updateWatchlistBadges();
        },

        loadLocalData: function () {
            if (window.MOVIES_DATA && window.MOVIES_DATA.categories) {
                this.state.catalog = window.MOVIES_DATA;
                this.state.categories = window.MOVIES_DATA.categories;
                this.state.heroItems = window.MOVIES_DATA.hero_items || [];
            }
        },

        fetchRemoteData: async function () {
            try {
                const res = await fetch('./data/movies.json?v=' + Date.now());
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.categories) {
                        this.state.catalog = data;
                        this.state.categories = data.categories;
                        this.state.heroItems = data.hero_items || [];
                    }
                }
            } catch (e) {
                console.warn('Fallback to embedded movies catalog:', e);
            }
        },

        initNavbar: function () {
            const nav = document.getElementById('navbar');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 30) {
                    nav.classList.add('bg-[#07090e]/95', 'backdrop-blur-md', 'shadow-2xl', 'border-b', 'border-blue-500/20');
                    nav.classList.remove('bg-transparent');
                } else {
                    nav.classList.remove('bg-[#07090e]/95', 'backdrop-blur-md', 'shadow-2xl', 'border-b', 'border-blue-500/20');
                    nav.classList.add('bg-transparent');
                }
            });
        },

        initSearch: function () {
            const input = document.getElementById('nav-search-input');
            const clearBtn = document.getElementById('nav-search-clear');
            let debounceTimer = null;

            if (!input) return;

            input.addEventListener('input', (e) => {
                const q = e.target.value.trim();
                if (clearBtn) {
                    clearBtn.classList.toggle('hidden', q.length === 0);
                }
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (q.length >= 2) {
                        this.searchMovies(q);
                    } else if (q.length === 0) {
                        this.loadHome();
                    }
                }, 250);
            });

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    input.value = '';
                    clearBtn.classList.add('hidden');
                    this.loadHome();
                });
            }
        },

        loadHome: function () {
            this.state.currentView = 'home';
            if (this.state.heroTimer) clearInterval(this.state.heroTimer);

            // Hide views
            ['search-view', 'category-grid-view'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            // Show home
            const hero = document.getElementById('hero-section');
            const rows = document.getElementById('rows-container');
            if (hero) hero.classList.remove('hidden');
            if (rows) {
                rows.classList.remove('hidden');
                rows.innerHTML = '';
            }

            // Render Hero
            if (this.state.heroItems.length > 0) {
                this.state.heroIndex = 0;
                this.renderHero(this.state.heroItems[0]);
                this.renderHeroDots();

                this.state.heroTimer = setInterval(() => {
                    this.state.heroIndex = (this.state.heroIndex + 1) % this.state.heroItems.length;
                    this.renderHeroFade(this.state.heroItems[this.state.heroIndex]);
                }, 7000);
            }

            // Render Rows
            this.renderContinueWatchingRow(rows);
            this.renderWatchlistRow(rows);

            // Top 10 Row
            const top10 = this.state.categories['top_today'];
            if (top10 && top10.items && top10.items.length) {
                this.renderTop10Row(rows, top10.title, top10.items, 'top_today');
            }

            // Other Categories
            const catKeys = [
                'popular_movies', 'new_releases', 'now_playing', 'indonesia_movies',
                'popular_series', 'action_movies', 'horror_movies', 'romance_movies',
                'scifi_movies', 'fantasy_movies'
            ];

            // Only show IndoDrama21 rail if logged in
            if (this.state.user && this.state.categories['indodrama_stream']) {
                catKeys.unshift('indodrama_stream');
            }

            catKeys.forEach(key => {
                const cat = this.state.categories[key];
                if (cat && cat.items && cat.items.length) {
                    this.renderRow(rows, cat.title, cat.items, key);
                }
            });
        },

        getPosterUrl: function (path, isBackdrop) {
            if (!path) return 'https://placehold.co/300x450/141721/71717a?text=ReStram';
            if (typeof path !== 'string') return 'https://placehold.co/300x450/141721/71717a?text=ReStram';
            if (path.startsWith('http://85.121.5.10') || path.startsWith('https://85.121.5.10')) {
                const clean = path.replace('https://', 'http://');
                return 'https://wsrv.nl/?url=' + encodeURIComponent(clean) + (isBackdrop ? '&w=1280&output=webp' : '&w=300&output=webp');
            }
            if (path.startsWith('http')) return path;
            const prefix = isBackdrop ? 'https://image.tmdb.org/t/p/original' : 'https://image.tmdb.org/t/p/w500';
            return path.startsWith('/') ? (prefix + path) : (prefix + '/' + path);
        },

        renderHero: function (item) {
            if (!item) return;
            const hero = document.getElementById('hero-section');
            const titleEl = document.getElementById('hero-title');
            const descEl = document.getElementById('hero-desc');
            const yearEl = document.getElementById('hero-year');
            const typeEl = document.getElementById('hero-type-badge');
            const ratingEl = document.getElementById('hero-rating');
            const genresEl = document.getElementById('hero-genre-tags');
            const playBtn = document.getElementById('hero-play-btn');
            const listBtn = document.getElementById('hero-list-btn');
            const trailerBtn = document.getElementById('hero-trailer-btn');

            const bd = item.backdrop_path ? this.getPosterUrl(item.backdrop_path, true) : (item.poster_path ? this.getPosterUrl(item.poster_path, true) : '');
            if (hero && bd) {
                hero.style.backgroundImage = `url('${bd}')`;
            }

            if (titleEl) titleEl.innerText = item.title;
            if (descEl) descEl.innerText = item.overview || 'Streaming film dan serial terbaik kualitas HD tanpa buffering.';
            if (yearEl) yearEl.innerText = (item.release_date || '').split('-')[0] || '2024';
            if (typeEl) typeEl.innerText = item.media_type === 'tv' ? 'SERIES' : 'MOVIE';

            if (ratingEl) {
                const vote = item.vote_average || 0;
                ratingEl.innerHTML = `<i class="fas fa-star text-yellow-400 text-xs"></i> <span>${vote.toFixed(1)}</span>`;
                ratingEl.classList.remove('hidden');
            }

            if (genresEl) {
                const gIds = item.genre_ids || [];
                const gNames = gIds.slice(0, 3).map(id => this.genreMap[id]).filter(Boolean);
                genresEl.innerHTML = gNames.map(g => `<span class="bg-blue-600/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">${g}</span>`).join('');
                genresEl.classList.remove('hidden');
            }

            if (playBtn) {
                playBtn.onclick = () => this.openPlayer(item);
            }
            if (listBtn) {
                const isInList = this.isInWatchlist(item.tmdb_id);
                this.updateListBtnState(listBtn, isInList);
                listBtn.onclick = () => {
                    this.toggleWatchlist(item);
                    this.updateListBtnState(listBtn, this.isInWatchlist(item.tmdb_id));
                };
            }
            if (trailerBtn) {
                trailerBtn.onclick = () => this.openTrailer(item);
            }

            this.updateHeroDotsActive();
        },

        renderHeroFade: function (item) {
            const hero = document.getElementById('hero-section');
            if (!hero) return;
            hero.style.transition = 'opacity 0.4s ease';
            hero.style.opacity = '0.35';
            setTimeout(() => {
                this.renderHero(item);
                hero.style.opacity = '1';
            }, 350);
        },

        renderHeroDots: function () {
            const dots = document.getElementById('hero-dots');
            if (!dots) return;
            dots.innerHTML = this.state.heroItems.map((_, idx) => `
                <button onclick="app.jumpHero(${idx})" class="hero-dot h-1.5 w-6 rounded-full transition-all duration-300 ${idx === this.state.heroIndex ? 'active' : 'bg-white/30 hover:bg-white/60'}" aria-label="Slide ${idx + 1}"></button>
            `).join('');
        },

        updateHeroDotsActive: function () {
            const dots = document.getElementById('hero-dots');
            if (!dots) return;
            const buttons = dots.querySelectorAll('button');
            buttons.forEach((btn, idx) => {
                if (idx === this.state.heroIndex) {
                    btn.className = 'hero-dot h-1.5 w-8 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-all duration-300 active';
                } else {
                    btn.className = 'hero-dot h-1.5 w-5 rounded-full bg-white/30 hover:bg-white/60 transition-all duration-300';
                }
            });
        },

        jumpHero: function (idx) {
            this.state.heroIndex = idx;
            this.renderHeroFade(this.state.heroItems[idx]);
        },

        renderTop10Row: function (container, title, items, slug) {
            if (!items || !items.length) return;
            const rowId = 'row-' + Math.random().toString(36).substring(2, 9);
            const top10 = items.slice(0, 10);

            const cardsHtml = top10.map((item, idx) => {
                const img = this.getPosterUrl(item.poster_path, false);
                const num = idx + 1;
                return `
                    <div class="top10-item group/top10card" onclick='app.openPlayer(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        <div class="top10-num">
                            ${num}
                        </div>
                        <div class="top10-poster-wrap">
                            <img src="${img}" loading="lazy" alt="${item.title}" onerror="this.onerror=null;this.src='https://placehold.co/300x450/141721/71717a?text=ReStram';">
                            <div class="absolute inset-0 bg-blue-600/0 group-hover/top10card:bg-blue-600/15 transition-all"></div>
                        </div>
                    </div>
                `;
            }).join('');

            const headerHtml = `
                <div class="flex items-center justify-between mb-3 px-4 md:px-10">
                    <h2 class="text-lg md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        ${title}
                    </h2>
                    ${slug ? `<button onclick="app.openCategoryGrid('${slug}', '${title}')" class="text-xs md:text-sm text-blue-400 hover:text-blue-300 font-bold transition-colors flex items-center gap-1.5">Lihat Semua <i class="fas fa-chevron-right text-[10px]"></i></button>` : ''}
                </div>
            `;

            container.insertAdjacentHTML('beforeend', `
                <div class="mb-8 group/row relative">
                    ${headerHtml}
                    <div class="relative w-full px-4 md:px-10">
                        <button onclick="app.scrollRow('${rowId}', 'left')" class="absolute left-1 md:left-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full hidden md:flex items-center justify-center bg-black/85 hover:bg-blue-600 text-white border border-white/20 hover:border-blue-400 shadow-2xl opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Geser kiri">
                            <i class="fas fa-chevron-left text-sm"></i>
                        </button>
                        <div id="${rowId}" class="snap-row hide-scroll scroll-smooth flex overflow-x-auto gap-2 pb-2">
                            ${cardsHtml}
                        </div>
                        <button onclick="app.scrollRow('${rowId}', 'right')" class="absolute right-1 md:right-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full hidden md:flex items-center justify-center bg-black/85 hover:bg-blue-600 text-white border border-white/20 hover:border-blue-400 shadow-2xl opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Geser kanan">
                            <i class="fas fa-chevron-right text-sm"></i>
                        </button>
                    </div>
                </div>
            `);
        },

        renderRow: function (container, title, items, slug) {
            if (!items || !items.length) return;
            const rowId = 'row-' + Math.random().toString(36).substring(2, 9);
            const cardsHtml = items.map(item => this.createCardHtml(item)).join('');

            const headerHtml = `
                <div class="flex items-center justify-between mb-3 px-4 md:px-10">
                    <h2 class="text-base md:text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
                        ${title}
                    </h2>
                    ${slug ? `<button onclick="app.openCategoryGrid('${slug}', '${title}')" class="text-xs md:text-sm text-gray-400 hover:text-blue-400 font-semibold transition-colors flex items-center gap-1">Lihat Semua <i class="fas fa-chevron-right text-[10px]"></i></button>` : ''}
                </div>
            `;

            container.insertAdjacentHTML('beforeend', `
                <div class="mb-7 md:mb-9 group/row relative">
                    ${headerHtml}
                    <div class="relative w-full px-4 md:px-10">
                        <button onclick="app.scrollRow('${rowId}', 'left')" class="absolute left-1 md:left-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full hidden md:flex items-center justify-center bg-black/85 hover:bg-blue-600 text-white border border-white/20 hover:border-blue-400 shadow-2xl opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Geser kiri">
                            <i class="fas fa-chevron-left text-xs"></i>
                        </button>
                        <div id="${rowId}" class="snap-row hide-scroll scroll-smooth flex overflow-x-auto gap-3.5 pb-3">
                            ${cardsHtml}
                        </div>
                        <button onclick="app.scrollRow('${rowId}', 'right')" class="absolute right-1 md:right-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full hidden md:flex items-center justify-center bg-black/85 hover:bg-blue-600 text-white border border-white/20 hover:border-blue-400 shadow-2xl opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all duration-300" aria-label="Geser kanan">
                            <i class="fas fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                </div>
            `);
        },

        createCardHtml: function (item) {
            const img = this.getPosterUrl(item.poster_path, false);
            const year = (item.release_date || '').split('-')[0] || '2024';
            const vote = item.vote_average || 0;
            const qual = vote >= 7.5 ? '4K' : 'HD';

            return `
                <div class="movie-card shrink-0 cursor-pointer" onclick='app.openPlayer(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                    <div class="card-inner">
                        <img src="${img}" loading="lazy" alt="${item.title}" class="card-poster" onerror="this.onerror=null;this.src='https://placehold.co/300x450/141721/71717a?text=ReStram';">
                        
                        <div class="card-play-icon absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/45 z-10">
                            <div class="w-10 h-10 md:w-11 md:h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.8)] transform scale-90 hover:scale-105 transition-transform">
                                <i class="fas fa-play text-xs md:text-sm ml-0.5"></i>
                            </div>
                        </div>

                        <div class="absolute top-2 right-2 z-20">
                            <span class="bg-black/75 backdrop-blur-md border border-white/10 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">${qual}</span>
                        </div>

                        ${vote > 0 ? `
                        <div class="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/10 text-yellow-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                            <i class="fas fa-star text-[8px]"></i>
                            <span>${vote.toFixed(1)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="mt-2 px-1">
                        <h3 class="text-xs md:text-sm font-semibold text-gray-200 line-clamp-1 leading-snug">${item.title}</h3>
                        <p class="text-[11px] text-gray-500 font-medium">${year} • ${item.media_type === 'tv' ? 'Series' : 'Movie'}</p>
                    </div>
                </div>
            `;
        },

        scrollRow: function (id, dir) {
            const el = document.getElementById(id);
            if (!el) return;
            const amt = dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
            el.scrollBy({ left: amt, behavior: 'smooth' });
        },

        renderContinueWatchingRow: function (container) {
            if (!this.state.history || !this.state.history.length) return;
            this.renderRow(container, 'Lanjutkan Menonton', this.state.history, null);
        },

        renderWatchlistRow: function (container) {
            if (!this.state.watchlist || !this.state.watchlist.length) return;
            this.renderRow(container, 'Daftar Tontonan Saya', this.state.watchlist, 'watchlist');
        },

        openCategoryGrid: function (slug, title) {
            if (slug === 'indodrama_stream' && !this.state.user) {
                this.openLoginModal();
                return;
            }
            this.state.currentView = 'grid';
            this.state.categoryGridSlug = slug;

            ['hero-section', 'rows-container', 'search-view'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            const gridView = document.getElementById('category-grid-view');
            const gridTitle = document.getElementById('category-grid-title');
            const gridContent = document.getElementById('category-grid-content');

            if (!gridView || !gridContent) return;

            gridView.classList.remove('hidden');
            if (gridTitle) gridTitle.innerText = title;

            let items = [];
            if (slug === 'watchlist') {
                items = this.state.watchlist;
            } else if (this.state.categories[slug]) {
                items = this.state.categories[slug].items || [];
            }

            gridContent.innerHTML = items.map(item => `
                <div class="cursor-pointer" onclick='app.openPlayer(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                    ${this.createCardHtml(item)}
                </div>
            `).join('');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        searchMovies: function (q) {
            this.state.currentView = 'search';
            this.state.searchQuery = q;

            ['hero-section', 'rows-container', 'category-grid-view'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            const searchView = document.getElementById('search-view');
            const queryText = document.getElementById('search-query-text');
            const searchGrid = document.getElementById('search-grid');

            if (!searchView || !searchGrid) return;

            searchView.classList.remove('hidden');
            if (queryText) queryText.innerText = `"${q}"`;

            const queryLower = q.toLowerCase();
            const matched = [];
            const seen = new Set();

            // Search in all categories
            Object.values(this.state.categories).forEach(cat => {
                (cat.items || []).forEach(item => {
                    if (seen.has(item.tmdb_id)) return;
                    const matchTitle = (item.title || '').toLowerCase().includes(queryLower);
                    const matchDesc = (item.overview || '').toLowerCase().includes(queryLower);
                    if (matchTitle || matchDesc) {
                        seen.add(item.tmdb_id);
                        matched.push(item);
                    }
                });
            });

            if (matched.length === 0) {
                searchGrid.innerHTML = `
                    <div class="col-span-full py-16 text-center text-gray-500">
                        <i class="fas fa-film text-4xl mb-3 text-gray-600"></i>
                        <p class="text-base font-semibold">Tidak ada film atau serial yang cocok dengan "${q}".</p>
                    </div>
                `;
            } else {
                searchGrid.innerHTML = matched.map(item => `
                    <div class="cursor-pointer" onclick='app.openPlayer(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        ${this.createCardHtml(item)}
                    </div>
                `).join('');
            }
        },

        openPlayer: function (item) {
            this.state.currentMedia = item;
            this.state.customStreamUrl = (item.streams && item.streams[0]) ? item.streams[0].url : null;
            this.state.currentSeason = 1;
            this.state.currentEpisode = 1;

            const modal = document.getElementById('detail-modal');
            if (!modal) return;

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Populate Modal Content
            const banner = document.getElementById('detail-banner-img');
            const titleEl = document.getElementById('detail-title');
            const yearEl = document.getElementById('detail-year');
            const typePill = document.getElementById('detail-type-pill');
            const ageBadge = document.getElementById('detail-age-badge');
            const durationEl = document.getElementById('detail-duration');
            const ratingEl = document.getElementById('detail-rating');
            const descEl = document.getElementById('detail-overview');
            const wlBtn = document.getElementById('detail-wl-btn');

            const isTv = item.media_type === 'tv';
            const bd = item.backdrop_path ? this.getPosterUrl(item.backdrop_path, true) : (item.poster_path ? this.getPosterUrl(item.poster_path, true) : '');
            
            if (banner) {
                banner.src = bd;
                banner.onerror = function () {
                    this.onerror = null;
                    this.src = 'https://placehold.co/1280x720/141721/71717a?text=ReStram';
                };
            }
            if (titleEl) titleEl.innerText = item.title;
            if (yearEl) yearEl.innerText = (item.release_date || '').split('-')[0] || '2024';
            if (typePill) typePill.innerText = isTv ? 'SERIES' : 'MOVIE';
            if (durationEl) durationEl.innerText = isTv ? 'Series TV' : 'Film Layar Lebar';
            if (ageBadge) {
                const vote = item.vote_average || 0;
                ageBadge.innerText = vote >= 8.0 ? '18+' : (vote >= 6.5 ? '16+' : '13+');
                ageBadge.className = 'border text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide border-blue-500/40 text-blue-400';
            }

            if (ratingEl) {
                const vote = item.vote_average || 0;
                ratingEl.innerHTML = `
                    <span class="text-yellow-400"><i class="fas fa-star"></i></span>
                    <span class="text-white font-bold text-sm">${vote.toFixed(1)}</span>
                    <span class="text-gray-500 text-xs">/ 10</span>
                `;
            }

            if (descEl) descEl.innerText = item.overview || 'Sinopsis belum tersedia.';

            if (wlBtn) {
                this.updateDetailWlBtn(this.isInWatchlist(item.tmdb_id));
            }

            // TV Series Dropdown Selectors
            const tvWrap = document.getElementById('detail-tv-selectors');
            if (tvWrap) {
                if (isTv) {
                    tvWrap.classList.remove('hidden');
                    this.initTvSelectors();
                } else {
                    tvWrap.classList.add('hidden');
                }
            }

            // Player Section
            document.getElementById('detail-player-section').classList.add('hidden');
            document.getElementById('detail-iframe-container').innerHTML = '';

            // Render Recommendations inside modal
            this.renderModalRecs(item);
        },

        closeDetailModal: function () {
            const modal = document.getElementById('detail-modal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
            document.getElementById('detail-iframe-container').innerHTML = '';
            document.getElementById('detail-player-section').classList.add('hidden');
        },

        startPlayback: function () {
            const item = this.state.currentMedia;
            if (!item) return;

            const playerSection = document.getElementById('detail-player-section');
            if (playerSection) playerSection.classList.remove('hidden');

            this.updateServerButtons();
            this.loadIframe();

            // Save to Continue Watching
            this.saveHistory(item);

            // Scroll player into view smoothly
            playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },

        closePlayerSection: function () {
            document.getElementById('detail-player-section').classList.add('hidden');
            document.getElementById('detail-iframe-container').innerHTML = '';
        },

        setServer: function (serverKey) {
            this.state.activeServer = serverKey;
            localStorage.setItem('restram_active_server', serverKey);
            this.updateServerButtons();
            this.loadIframe();
        },

        updateServerButtons: function () {
            const item = this.state.currentMedia;
            const container = document.getElementById('server-tabs-container');
            if (container && item && item.streams && item.streams.length > 0) {
                container.innerHTML = '<span class="text-[11px] text-gray-400 uppercase tracking-wider font-bold mr-1">Server:</span>' +
                    item.streams.map((st, idx) => {
                        const sId = 'id21_s' + (idx + 1);
                        const isActive = (this.state.activeServer === sId) || (idx === 0 && !this.state.activeServer.startsWith('id21_'));
                        if (isActive && !this.state.customStreamUrl) this.state.customStreamUrl = st.url;
                        return `
                            <button onclick="app.setCustomStream('${st.url}', '${sId}')" id="dsrv-${sId}" class="server-btn ${isActive ? 'active' : ''} px-3 py-1.5 text-xs font-bold rounded-lg ${isActive ? 'bg-blue-600 text-white border border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]' : 'bg-slate-800/80 text-gray-300 hover:text-white border border-slate-700'}">
                                ${st.server}
                            </button>
                        `;
                    }).join('');
                return;
            }

            // Fallback for standard TMDB servers
            if (container) {
                const stdServers = [
                    { id: 'vidfast', label: 'S1 (VidFast)' },
                    { id: 'videasy', label: 'S2 (VidEasy)' },
                    { id: 'vidsrcme', label: 'S3 (VidSrc)' },
                    { id: 'vidzee', label: 'S4 (VidZee)' },
                    { id: 'vidrock', label: 'S5 (VidRock)' },
                    { id: 'embedapi', label: 'S6 (EmbedAPI)' },
                    { id: 'vidlink', label: 'S7 (VidLink)' }
                ];
                container.innerHTML = '<span class="text-[11px] text-gray-400 uppercase tracking-wider font-bold mr-1">Server:</span>' +
                    stdServers.map(s => {
                        const isActive = s.id === this.state.activeServer;
                        return `
                            <button onclick="app.setServer('${s.id}')" id="dsrv-${s.id}" class="server-btn ${isActive ? 'active' : ''} px-3 py-1.5 text-xs font-bold rounded-lg ${isActive ? 'bg-blue-600 text-white border border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.6)]' : 'bg-slate-800/80 text-gray-300 hover:text-white border border-slate-700'}">
                                ${s.label}
                            </button>
                        `;
                    }).join('');
            }
        },

        setCustomStream: function (url, serverId) {
            this.state.customStreamUrl = url;
            this.state.activeServer = serverId;
            this.updateServerButtons();
            this.loadIframe();
        },

        getEmbedUrl: function (server, item, season, episode) {
            const id = item.tmdb_id;
            const isTv = item.media_type === 'tv';
            const s = season || 1;
            const e = episode || 1;

            const urls = {
                vidfast: isTv ? `https://vidfast.pro/tv/${id}/${s}/${e}` : `https://vidfast.pro/movie/${id}`,
                videasy: isTv ? `https://player.videasy.net/tv/${id}/${s}/${e}?color=2563eb&overlay=true` : `https://player.videasy.net/movie/${id}?color=2563eb&overlay=true`,
                vidsrcme: isTv ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` : `https://vidsrc.me/embed/movie?tmdb=${id}`,
                vidzee: isTv ? `https://player.vidzee.wtf/embed/tv/${id}/${s}/${e}` : `https://player.vidzee.wtf/embed/movie/${id}`,
                vidrock: isTv ? `https://vidrock.ru/tv/${id}/${s}/${e}` : `https://vidrock.ru/movie/${id}`,
                embedapi: isTv ? `https://apiplayer.ru/embed/tv/${id}/${s}/${e}` : `https://apiplayer.ru/embed/movie/${id}`,
                vidstreams: isTv ? `https://autoembed.co/tv/tmdb/${id}-${s}-${e}` : `https://autoembed.co/movie/tmdb/${id}`,
                '111movies': isTv ? `https://111movies.com/tv/${id}/${s}/${e}` : `https://111movies.com/movie/${id}`,
                '2embedcc': isTv ? `https://2embed.cc/embedtv/${id}?s=${s}&e=${e}` : `https://2embed.cc/embed/${id}`,
                vidlink: isTv ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=2563EB&secondaryColor=3B82F6&iconColor=2563EB` : `https://vidlink.pro/movie/${id}?primaryColor=2563EB&secondaryColor=3B82F6&iconColor=2563EB`
            };

            return urls[server] || urls.vidfast;
        },

        loadIframe: function () {
            const container = document.getElementById('detail-iframe-container');
            const item = this.state.currentMedia;
            if (!container || !item) return;

            let url = this.state.customStreamUrl;
            if (!url && item.streams && item.streams.length > 0) {
                url = item.streams[0].url;
                this.state.customStreamUrl = url;
            }
            if (!url) {
                url = this.getEmbedUrl(
                    this.state.activeServer,
                    item,
                    this.state.currentSeason,
                    this.state.currentEpisode
                );
            }

            container.innerHTML = `
                <div class="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-blue-500/30 shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                    <iframe src="${url}" class="w-full h-full" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" frameborder="0"></iframe>
                </div>
            `;
        },

        initTvSelectors: function () {
            const sSelect = document.getElementById('detail-season-select');
            const eSelect = document.getElementById('detail-episode-select');

            if (!sSelect || !eSelect) return;

            // Generate 1 to 5 seasons as default
            sSelect.innerHTML = Array.from({ length: 6 }, (_, i) => `<option value="${i + 1}">Musim ${i + 1}</option>`).join('');
            eSelect.innerHTML = Array.from({ length: 24 }, (_, i) => `<option value="${i + 1}">Episode ${i + 1}</option>`).join('');

            sSelect.value = String(this.state.currentSeason);
            eSelect.value = String(this.state.currentEpisode);

            sSelect.onchange = (e) => {
                this.state.currentSeason = parseInt(e.target.value) || 1;
                this.loadIframe();
            };

            eSelect.onchange = (e) => {
                this.state.currentEpisode = parseInt(e.target.value) || 1;
                this.loadIframe();
            };
        },

        renderModalRecs: function (item) {
            const row = document.getElementById('modal-recommended-row');
            if (!row) return;

            // Find similar from same category or random
            const cat = this.state.categories['popular_movies'] || Object.values(this.state.categories)[0];
            const pool = (cat.items || []).filter(i => i.tmdb_id !== item.tmdb_id).slice(0, 8);

            row.innerHTML = pool.map(it => this.createCardHtml(it)).join('');
        },

        openTrailer: function (item) {
            const target = item || this.state.currentMedia;
            if (!target) return;

            const modal = document.getElementById('trailer-modal');
            const iframe = document.getElementById('trailer-iframe');
            if (!modal || !iframe) return;

            // YouTube Search embed for trailer
            const q = encodeURIComponent(`${target.title} official trailer`);
            iframe.src = `https://www.youtube.com/embed?listType=search&list=${q}&autoplay=1`;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        },

        closeTrailer: function () {
            const modal = document.getElementById('trailer-modal');
            const iframe = document.getElementById('trailer-iframe');
            if (iframe) iframe.src = '';
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        },

        isInWatchlist: function (tmdb_id) {
            return this.state.watchlist.some(it => it.tmdb_id === tmdb_id);
        },

        toggleWatchlist: function (item) {
            const idx = this.state.watchlist.findIndex(it => it.tmdb_id === item.tmdb_id);
            if (idx >= 0) {
                this.state.watchlist.splice(idx, 1);
            } else {
                this.state.watchlist.unshift(item);
            }
            localStorage.setItem('restram_watchlist', JSON.stringify(this.state.watchlist));
            this.updateWatchlistBadges();
            this.updateDetailWlBtn(this.isInWatchlist(item.tmdb_id));
        },

        updateDetailWlBtn: function (isIn) {
            const btn = document.getElementById('detail-wl-btn');
            if (!btn) return;
            if (isIn) {
                btn.innerHTML = '<i class="fas fa-check text-blue-400"></i><span>Tersimpan</span>';
                btn.className = 'bg-blue-600/30 border border-blue-500/60 text-blue-300 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-sm';
            } else {
                btn.innerHTML = '<i class="fas fa-plus"></i><span>Watchlist</span>';
                btn.className = 'bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-sm';
            }
        },

        updateListBtnState: function (btn, isIn) {
            if (!btn) return;
            if (isIn) {
                btn.innerHTML = '<i class="fas fa-check text-blue-400"></i><span>Tersimpan</span>';
                btn.className = 'bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/60 text-blue-300 px-6 py-2.5 rounded font-extrabold flex items-center gap-2.5 active:scale-95 transition text-sm md:text-base backdrop-blur-sm';
            } else {
                btn.innerHTML = '<i class="fas fa-plus"></i><span>Daftar</span>';
                btn.className = 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-500/60 text-white px-6 py-2.5 rounded font-extrabold flex items-center gap-2.5 active:scale-95 transition text-sm md:text-base backdrop-blur-sm';
            }
        },

        updateWatchlistBadges: function () {
            const count = this.state.watchlist.length;
            const badge = document.getElementById('nav-watchlist-count');
            const bnavBadge = document.getElementById('bnav-watchlist-count');
            if (badge) {
                badge.innerText = count;
                badge.classList.toggle('hidden', count === 0);
            }
            if (bnavBadge) {
                bnavBadge.innerText = count;
                bnavBadge.classList.toggle('hidden', count === 0);
            }
        },

        saveHistory: function (item) {
            const filtered = this.state.history.filter(h => h.tmdb_id !== item.tmdb_id);
            filtered.unshift(item);
            this.state.history = filtered.slice(0, 15);
            localStorage.setItem('restram_history', JSON.stringify(this.state.history));
        }
    };

    // Auto initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.app.init());
    } else {
        window.app.init();
    }
})();
