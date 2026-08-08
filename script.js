  /**
         * EduPDF Hub - Single-File Modular Application Architecture
         */
        const app = {
            // Default Seed Data Categories
            categories: ['All', 'Primary', 'Secondary', 'SSC', 'HSC', 'Diploma', 'University', 'Job Preparation'],
            
            // Central Application State
            state: {
                books: [],
                activeCategory: 'All',
                searchQuery: '',
                currentBook: null,
                isAdminLoggedIn: false,
                favorites: JSON.parse(localStorage.getItem('edupdf_favs') || '[]'),
                config: {
                    binId: localStorage.getItem('edupdf_bin_id') || '6a6b009ada38895dfea31794',
                    masterKey: localStorage.getItem('edupdf_master_key') || '$2a$10$5pgm5axCN1xlhHicamePkuM3Tt5kdXnPOqPrTPIIGxDGwJgpQvydq',
                    accessKey: localStorage.getItem('edupdf_access_key') || '$2a$10$7daIbii5W5/rTvMfymUszO1pR4CiqKz7prQXIop155BUZtcHNdP7C'
                }
            },

          //add Terms and Conditons page
          function openTermsModal() {
    document.getElementById('termsModal').style.display = 'flex';
  }

  function closeTermsModal() {
    document.getElementById('termsModal').style.display = 'none';
  }

            // Default seed data structure if JSONBin is completely empty
            defaultData: {
                categories: ['Primary', 'Secondary', 'SSC', 'HSC', 'Diploma', 'University', 'Job Preparation'],
                books: [
                    {
                        id: "book_101",
                        title: "HSC Physics 1st Paper - Comprehensive Notes",
                        description: "Complete chapterwise theory, mathematical solutions, and exam preparation guides.",
                        category: "HSC",
                        subject: "Physics",
                        year: "2024",
                        cover: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600",
                        pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                        downloads: 1420,
                        views: 3890,
                        publisher: "EduPDF Academic Press",
                        uploadDate: "2026-01-15",
                        fileSize: "18.5 MB"
                    },
                    {
                        id: "book_102",
                        title: "BCS & Bank Job General Knowledge Special",
                        description: "Essential national and international affairs covering current affairs and past question solutions.",
                        category: "Job Preparation",
                        subject: "General Knowledge",
                        year: "2026",
                        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
                        pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                        downloads: 2890,
                        views: 5120,
                        publisher: "Career Vision",
                        uploadDate: "2026-02-01",
                        fileSize: "24.2 MB"
                    }
                ]
            },

            // API Service Handler for JSONBin.io
            api: {
                getHeaders() {
                    const headers = { 'Content-Type': 'application/json' };
                    if (app.state.config.masterKey) headers['X-Master-Key'] = app.state.config.masterKey;
                    if (app.state.config.accessKey) headers['X-Access-Key'] = app.state.config.accessKey;
                    return headers;
                },

                async fetchDatabase() {
                    if (!app.state.config.binId) {
                        app.ui.openModal('settingsModal');
                        return;
                    }
                    try {
                        const res = await fetch(`https://api.jsonbin.io/v3/b/${app.state.config.binId}/latest`, {
                            headers: this.getHeaders()
                        });
                        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                        const data = await res.json();
                        
                        // Parse record content
                        const record = data.record;
                        if (record && Array.isArray(record.books)) {
                            app.state.books = record.books;
                        } else {
                            // Seed if empty structure
                            app.state.books = app.defaultData.books;
                            await this.saveDatabase();
                        }
                    } catch (err) {
                        console.error("API Fetch Error:", err);
                        app.ui.showToast("Failed to fetch data from JSONBin. Please check keys.", "error");
                        // Fallback local memory dataset
                        if(app.state.books.length === 0) app.state.books = app.defaultData.books;
                    }
                },

                async saveDatabase() {
                    if (!app.state.config.binId) {
                        app.ui.showToast("Configuration missing. Cannot save.", "error");
                        return false;
                    }
                    try {
                        const res = await fetch(`https://api.jsonbin.io/v3/b/${app.state.config.binId}`, {
                            method: 'PUT',
                            headers: this.getHeaders(),
                            body: JSON.stringify({
                                categories: app.categories.filter(c => c !== 'All'),
                                books: app.state.books,
                                updatedAt: new Date().toISOString()
                            })
                        });
                        if (!res.ok) throw new Error(`HTTP Save error! status: ${res.status}`);
                        return true;
                    } catch (err) {
                        console.error("API Save Error:", err);
                        app.ui.showToast("Failed to update JSONBin storage.", "error");
                        return false;
                    }
                }
            },

            // Application Router
            router: {
                init() {
                    window.addEventListener('popstate', () => this.handleRoute());
                    this.handleRoute();
                },

                handleRoute() {
                    const params = new URLSearchParams(window.location.search);
                    const bookId = params.get('id');

                    // Hide all view containers
                    document.getElementById('homeView').style.display = 'none';
                    document.getElementById('detailsView').style.display = 'none';
                    document.getElementById('adminView').style.display = 'none';
                    document.getElementById('notFoundView').style.display = 'none';

                    if (app.state.isAdminLoggedIn && window.location.hash === '#admin') {
                        document.getElementById('adminView').style.display = 'block';
                        app.admin.renderDashboard();
                    } else if (bookId) {
                        const book = app.state.books.find(b => b.id === bookId);
                        if (book) {
                            app.state.currentBook = book;
                            app.views.renderDetails(book);
                            document.getElementById('detailsView').style.display = 'block';
                            app.views.incrementView(book);
                        } else {
                            document.getElementById('notFoundView').style.display = 'block';
                        }
                    } else {
                        document.getElementById('homeView').style.display = 'block';
                        app.views.renderHome();
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },

                navigate(view, params = {}) {
                    let url = window.location.pathname;
                    if (view === 'details' && params.id) {
                        url += `?id=${params.id}`;
                    } else if (view === 'admin') {
                        url += `#admin`;
                    }
                    window.history.pushState({}, '', url);
                    this.handleRoute();
                }
            },

            // Views Rendering Engine
            views: {
                renderHome() {
                    this.renderCategories();
                    this.renderBooks();
                },

                renderCategories() {
                    const container = document.getElementById('categoryContainer');
                    container.innerHTML = app.categories.map(cat => `
                        <div class="category-chip glass ${app.state.activeCategory === cat ? 'active' : ''}" 
                             onclick="app.ui.selectCategory('${cat}')">
                            ${cat}
                        </div>
                    `).join('');
                },

                renderBooks() {
                    const recentGrid = document.getElementById('recentBooksGrid');
                    const popularGrid = document.getElementById('popularBooksGrid');

                    let filtered = app.state.books;

                    // Apply Category Filter
                    if (app.state.activeCategory !== 'All') {
                        filtered = filtered.filter(b => b.category === app.state.activeCategory);
                    }

                    // Apply Live Search Filter
                    if (app.state.searchQuery.trim() !== '') {
                        const q = app.state.searchQuery.toLowerCase();
                        filtered = filtered.filter(b => 
                            (b.title && b.title.toLowerCase().includes(q)) ||
                            (b.subject && b.subject.toLowerCase().includes(q)) ||
                            (b.year && b.year.toLowerCase().includes(q)) ||
                            (b.category && b.category.toLowerCase().includes(q))
                        );
                    }

                    // Sort Collections
                    const recentSorted = [...filtered].sort((a,b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
                    const popularSorted = [...filtered].sort((a,b) => (b.downloads || 0) - (a.downloads || 0));

                    recentGrid.innerHTML = recentSorted.length ? recentSorted.map(b => this.createBookCard(b)).join('') : '<p style="grid-column:1/-1; text-align:center; padding: 20px;">No books matched your filter criteria.</p>';
                    popularGrid.innerHTML = popularSorted.length ? popularSorted.map(b => this.createBookCard(b)).join('') : '<p style="grid-column:1/-1; text-align:center; padding: 20px;">No books found.</p>';
                },

                createBookCard(book) {
                    const isFav = app.state.favorites.includes(book.id);
                    return `
                        <div class="book-card glass">
                            <div class="card-cover-wrapper">
                                <span class="badge-category">${book.category || 'General'}</span>
                                <button class="fav-btn" onclick="event.stopPropagation(); app.ui.toggleFavorite('${book.id}')">
                                    <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
                                </button>
                                <img src="${book.cover}" class="card-cover" alt="${book.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600'">
                            </div>
                            <div class="card-body">
                                <div class="card-meta">${book.subject || 'General'} • ${book.year || 'N/A'}</div>
                                <h3 class="card-title">${book.title}</h3>
                                <div class="card-stats">
                                    <span><i class="bi bi-eye"></i> ${book.views || 0}</span>
                                    <span><i class="bi bi-download"></i> ${book.downloads || 0}</span>
                                </div>
                                <button class="btn btn-primary" style="width: 100%; margin-top: 12px; justify-content: center;" onclick="app.router.navigate('details', {id: '${book.id}'})">
                                    Open Book
                                </button>
                            </div>
                        </div>
                    `;
                },

                renderDetails(book) {
                    document.getElementById('detailCover').src = book.cover;
                    document.getElementById('detailTitle').textContent = book.title;
                    document.getElementById('detailCategory').innerHTML = `<i class="bi bi-folder"></i> ${book.category}`;
                    document.getElementById('detailSubject').innerHTML = `<i class="bi bi-book"></i> ${book.subject}`;
                    document.getElementById('detailYear').innerHTML = `<i class="bi bi-calendar"></i> ${book.year || 'N/A'}`;
                    document.getElementById('detailDescription').textContent = book.description || 'No detailed description provided.';
                    
                    document.getElementById('detailPublisher').textContent = book.publisher || 'Standard Release';
                    document.getElementById('detailFileSize').textContent = book.fileSize || 'Unknown';
                    document.getElementById('detailUploadDate').textContent = book.uploadDate || 'N/A';
                    document.getElementById('detailDownloads').textContent = book.downloads || 0;

                    // Bind Download Button
                    const downloadBtn = document.getElementById('downloadBtn');
                    downloadBtn.onclick = () => this.handleDownload(book);

                    // Share buttons
                    document.getElementById('shareBtn').onclick = () => {
                        if (navigator.share) {
                            navigator.share({ title: book.title, url: window.location.href });
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            app.ui.showToast("Link copied to clipboard!", "success");
                        }
                    };

                    document.getElementById('copyBtn').onclick = () => {
                        navigator.clipboard.writeText(book.id);
                        app.ui.showToast(`Copied Book ID: ${book.id}`, "info");
                    };
                },

                async incrementView(book) {
                    book.views = (book.views || 0) + 1;
                    await app.api.saveDatabase();
                },

                async handleDownload(book) {
                    book.downloads = (book.downloads || 0) + 1;
                    document.getElementById('detailDownloads').textContent = book.downloads;
                    app.ui.showToast("Starting download...", "success");
                    
                    // Trigger non-blocking async save & open PDF
                    app.api.saveDatabase();
                    window.open(book.pdf, '_blank');
                }
            },

            // Admin Panel Module
            admin: {
                handleNavClick() {
                    if (app.state.isAdminLoggedIn) {
                        app.router.navigate('admin');
                    } else {
                        app.ui.openModal('loginModal');
                    }
                },

                login(user, pass) {
                    if (user === 'admin' && pass === 'admin123') {
                        app.state.isAdminLoggedIn = true;
                        document.getElementById('adminBtnText').textContent = 'Dashboard';
                        app.ui.closeModal('loginModal');
                        app.ui.showToast("Logged in as Admin", "success");
                        app.router.navigate('admin');
                    } else {
                        app.ui.showToast("Invalid Admin Credentials", "error");
                    }
                },

                logout() {
                    app.state.isAdminLoggedIn = false;
                    document.getElementById('adminBtnText').textContent = 'Admin';
                    app.ui.showToast("Logged out", "info");
                    app.router.navigate('home');
                },

                renderDashboard() {
                    const books = app.state.books;
                    document.getElementById('statTotalBooks').textContent = books.length;
                    
                    const totalViews = books.reduce((acc, b) => acc + (b.views || 0), 0);
                    const totalDownloads = books.reduce((acc, b) => acc + (b.downloads || 0), 0);
                    
                    document.getElementById('statTotalViews').textContent = totalViews;
                    document.getElementById('statTotalDownloads').textContent = totalDownloads;

                    this.renderTable(books);
                },

                renderTable(books) {
                    const tbody = document.getElementById('adminBookTableBody');
                    tbody.innerHTML = books.map(b => `
                        <tr>
                            <td><code>${b.id}</code></td>
                            <td><strong>${b.title}</strong></td>
                            <td><span class="tag">${b.category}</span></td>
                            <td>${b.views || 0}</td>
                            <td>${b.downloads || 0}</td>
                            <td>
                                <button class="btn glass" style="padding: 4px 8px;" onclick="app.admin.openBookModal('${b.id}')"><i class="bi bi-pencil"></i></button>
                                <button class="btn glass" style="padding: 4px 8px; color:#ef4444;" onclick="app.admin.deleteBook('${b.id}')"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');
                },

                openBookModal(bookId = null) {
                    const form = document.getElementById('bookForm');
                    form.reset();
                    
                    if (bookId) {
                        const book = app.state.books.find(b => b.id === bookId);
                        if (book) {
                            document.getElementById('bookModalTitle').innerHTML = '<i class="bi bi-pencil"></i> Edit Book';
                            document.getElementById('bookFormId').value = book.id;
                            document.getElementById('bookTitle').value = book.title;
                            document.getElementById('bookSubject').value = book.subject;
                            document.getElementById('bookCategory').value = book.category;
                            document.getElementById('bookYear').value = book.year || '';
                            document.getElementById('bookPublisher').value = book.publisher || '';
                            document.getElementById('bookFileSize').value = book.fileSize || '';
                            document.getElementById('bookCover').value = book.cover;
                            document.getElementById('bookPdf').value = book.pdf;
                            document.getElementById('bookDescription').value = book.description || '';
                        }
                    } else {
                        document.getElementById('bookModalTitle').innerHTML = '<i class="bi bi-journal-plus"></i> Add New Book';
                        document.getElementById('bookFormId').value = '';
                    }
                    app.ui.openModal('bookModal');
                },

                async saveBookFromForm() {
                    const id = document.getElementById('bookFormId').value || 'book_' + Date.now();
                    const bookData = {
                        id: id,
                        title: document.getElementById('bookTitle').value.trim(),
                        subject: document.getElementById('bookSubject').value.trim(),
                        category: document.getElementById('bookCategory').value,
                        year: document.getElementById('bookYear').value.trim(),
                        publisher: document.getElementById('bookPublisher').value.trim(),
                        fileSize: document.getElementById('bookFileSize').value.trim(),
                        cover: document.getElementById('bookCover').value.trim(),
                        pdf: document.getElementById('bookPdf').value.trim(),
                        description: document.getElementById('bookDescription').value.trim(),
                        uploadDate: new Date().toISOString().split('T')[0]
                    };

                    const existingIdx = app.state.books.findIndex(b => b.id === id);
                    if (existingIdx >= 0) {
                        bookData.views = app.state.books[existingIdx].views || 0;
                        bookData.downloads = app.state.books[existingIdx].downloads || 0;
                        app.state.books[existingIdx] = bookData;
                    } else {
                        bookData.views = 0;
                        bookData.downloads = 0;
                        app.state.books.unshift(bookData);
                    }

                    app.ui.showToast("Saving to JSONBin...", "info");
                    const success = await app.api.saveDatabase();
                    if (success) {
                        app.ui.showToast("Book saved successfully!", "success");
                        app.ui.closeModal('bookModal');
                        this.renderDashboard();
                    }
                },

                async deleteBook(bookId) {
                    if (confirm(`Are you sure you want to delete book ID: ${bookId}?`)) {
                        app.state.books = app.state.books.filter(b => b.id !== bookId);
                        app.ui.showToast("Updating database...", "info");
                        const success = await app.api.saveDatabase();
                        if (success) {
                            app.ui.showToast("Book deleted.", "success");
                            this.renderDashboard();
                        }
                    }
                },

                openSettingsModal() {
                    document.getElementById('cfgBinId').value = app.state.config.binId;
                    document.getElementById('cfgMasterKey').value = app.state.config.masterKey;
                    document.getElementById('cfgAccessKey').value = app.state.config.accessKey;
                    app.ui.openModal('settingsModal');
                },

                saveSettings() {
                    app.state.config.binId = document.getElementById('cfgBinId').value.trim();
                    app.state.config.masterKey = document.getElementById('cfgMasterKey').value.trim();
                    app.state.config.accessKey = document.getElementById('cfgAccessKey').value.trim();

                    localStorage.setItem('edupdf_bin_id', app.state.config.binId);
                    localStorage.setItem('edupdf_master_key', app.state.config.masterKey);
                    localStorage.setItem('edupdf_access_key', app.state.config.accessKey);

                    app.ui.closeModal('settingsModal');
                    app.ui.showToast("Settings Saved. Refreshing Data...", "success");
                    app.api.fetchDatabase().then(() => app.router.handleRoute());
                }
            },

            // UI Components & Interactive Helpers
            ui: {
                toggleTheme() {
                    const current = document.documentElement.getAttribute('data-theme');
                    const target = current === 'dark' ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-theme', target);
                    const icon = document.querySelector('#themeToggleBtn i');
                    icon.className = target === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
                },

                selectCategory(cat) {
                    app.state.activeCategory = cat;
                    app.views.renderCategories();
                    app.views.renderBooks();
                },

                showToast(message, type = 'info') {
                    const container = document.getElementById('toastContainer');
                    const toast = document.createElement('div');
                    toast.className = `toast toast-${type}`;
                    
                    const icons = { success: 'bi-check-circle', error: 'bi-exclamation-circle', info: 'bi-info-circle' };
                    toast.innerHTML = `<i class="bi ${icons[type]}"></i> ${message}`;
                    
                    container.appendChild(toast);
                    setTimeout(() => toast.remove(), 3500);
                },

                openModal(id) {
                    document.getElementById(id).style.display = 'flex';
                },

                closeModal(id) {
                    document.getElementById(id).style.display = 'none';
                },

                toggleFavorite(id) {
                    const idx = app.state.favorites.indexOf(id);
                    if (idx >= 0) {
                        app.state.favorites.splice(idx, 1);
                        this.showToast("Removed from favorites", "info");
                    } else {
                        app.state.favorites.push(id);
                        this.showToast("Saved to favorites!", "success");
                    }
                    localStorage.setItem('edupdf_favs', JSON.stringify(app.state.favorites));
                    app.views.renderBooks();
                },

                showFavoritesModal() {
                    const container = document.getElementById('favListContainer');
                    const favBooks = app.state.books.filter(b => app.state.favorites.includes(b.id));
                    
                    if (favBooks.length === 0) {
                        container.innerHTML = '<p style="text-align:center; padding: 20px;">No favorite books saved yet.</p>';
                    } else {
                        container.innerHTML = favBooks.map(b => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-color)">
                                <div>
                                    <strong>${b.title}</strong>
                                    <div style="font-size:0.8rem; color:var(--text-muted);">${b.subject} • ${b.category}</div>
                                </div>
                                <button class="btn btn-primary" style="padding:4px 10px; font-size:0.8rem;" onclick="app.ui.closeModal('favModal'); app.router.navigate('details', {id:'${b.id}'})">View</button>
                            </div>
                        `).join('');
                    }
                    this.openModal('favModal');
                },

                setupEvents() {
                    // Search input live behavior
                    const searchInput = document.getElementById('searchInput');
                    const suggestions = document.getElementById('searchSuggestions');

                    searchInput.addEventListener('input', (e) => {
                        const q = e.target.value.trim().toLowerCase();
                        app.state.searchQuery = q;
                        app.views.renderBooks();

                        if (q.length > 1) {
                            const matches = app.state.books.filter(b => b.title.toLowerCase().includes(q)).slice(0, 5);
                            if (matches.length) {
                                suggestions.innerHTML = matches.map(m => `
                                    <div class="suggestion-item" onclick="document.getElementById('searchInput').value='${m.title}'; app.state.searchQuery='${m.title}'; app.views.renderBooks(); document.getElementById('searchSuggestions').style.display='none';">
                                        <span>${m.title}</span>
                                        <small style="color:var(--text-muted);">${m.category}</small>
                                    </div>
                                `).join('');
                                suggestions.style.display = 'block';
                            } else {
                                suggestions.style.display = 'none';
                            }
                        } else {
                            suggestions.style.display = 'none';
                        }
                    });

                    // Hide suggestions on outside click
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('.search-container')) {
                            suggestions.style.display = 'none';
                        }
                    });

                    // Scroll back to top visibility
                    window.addEventListener('scroll', () => {
                        const btn = document.getElementById('backToTopBtn');
                        if (window.scrollY > 300) btn.style.display = 'flex';
                        else btn.style.display = 'none';
                    });

                    // Form submissions
                    document.getElementById('loginForm').addEventListener('submit', (e) => {
                        e.preventDefault();
                        app.admin.login(
                            document.getElementById('loginUser').value,
                            document.getElementById('loginPass').value
                        );
                    });

                    document.getElementById('settingsForm').addEventListener('submit', (e) => {
                        e.preventDefault();
                        app.admin.saveSettings();
                    });

                    document.getElementById('bookForm').addEventListener('submit', (e) => {
                        e.preventDefault();
                        app.admin.saveBookFromForm();
                    });

                    document.getElementById('adminTableSearch').addEventListener('input', (e) => {
                        const q = e.target.value.toLowerCase();
                        const filtered = app.state.books.filter(b => b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
                        app.admin.renderTable(filtered);
                    });
                }
            },

            // Initialization Workflow
            async init() {
                this.ui.setupEvents();
                await this.api.fetchDatabase();
                this.router.init();
            }
        };

        // Bootstrap application on DOM ready
        document.addEventListener('DOMContentLoaded', () => app.init());
