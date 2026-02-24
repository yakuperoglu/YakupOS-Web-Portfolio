/* ═══════════════════════════════════════════════
   BROWSER.EXE — Real Web Browser + Built-in Pages
   YouTube embed support + iframe error fallback
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const urlBar = document.getElementById('browser-url');
    const goBtn = document.getElementById('browser-go');
    const viewport = document.getElementById('browser-viewport');
    const searchBox = document.getElementById('browser-search');
    if (!urlBar || !viewport) return;

    let currentPage = 'home';
    const navHistory = ['yakupos://home'];
    let historyIndex = 0;
    let iframe = null;

    const pages = {
        home: 'browser-page-home',
        about: 'browser-page-about',
        portfolio: 'browser-page-portfolio',
        blog: 'browser-page-blog',
    };

    const urlMap = {
        home: 'yakupos://home',
        about: 'yakupos://about-me',
        portfolio: 'yakupos://portfolio',
        blog: 'yakupos://blog',
    };

    /* ── YouTube URL → Embed URL converter ── */
    function convertYouTubeUrl(url) {
        // youtube.com/watch?v=ID
        let match = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;

        // youtu.be/ID
        match = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;

        // youtube.com/embed/ID already
        match = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (match) return url;

        // youtube.com home page — use embed-friendly search
        if (url.includes('youtube.com') && !url.includes('/embed/')) {
            return url; // Will load but with limited functionality
        }

        return null;
    }

    /* ── Google → iframe-friendly Google ── */
    function convertGoogleUrl(url) {
        if (url.includes('google.com/search')) {
            // Add igu=1 for iframe-friendly mode
            if (!url.includes('igu=1')) {
                const sep = url.includes('?') ? '&' : '?';
                return url + sep + 'igu=1';
            }
        }
        return url;
    }

    function isExternalUrl(url) {
        return url.startsWith('http://') || url.startsWith('https://') || url.includes('.');
    }

    function normalizeUrl(url) {
        url = url.trim();
        if (url.startsWith('yakupos://')) return url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        return url;
    }

    /* ── Iframe Management ── */
    function getIframe() {
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'browser-iframe';
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-presentation';
            iframe.setAttribute('referrerpolicy', 'no-referrer');
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            viewport.appendChild(iframe);

            // Detect load errors (iframe will show blank for blocked sites)
            iframe.addEventListener('load', () => {
                try {
                    // Try accessing iframe content — will throw if cross-origin blocked
                    const doc = iframe.contentDocument;
                    if (doc && doc.body && doc.body.innerHTML === '') {
                        // Empty body usually means blocked
                        showErrorPage(iframe.src);
                    }
                } catch (e) {
                    // Cross-origin — site loaded (or blocked by X-Frame-Options)
                    // We can't tell the difference, so we leave it
                }
            });
        }
        return iframe;
    }

    function hideIframe() {
        if (iframe) {
            iframe.style.display = 'none';
            iframe.src = 'about:blank';
        }
        // Also hide error page
        const errPage = viewport.querySelector('.browser-error-page');
        if (errPage) errPage.remove();
    }

    function showErrorPage(failedUrl) {
        // Remove existing
        const old = viewport.querySelector('.browser-error-page');
        if (old) old.remove();

        if (iframe) iframe.style.display = 'none';

        const errorPage = document.createElement('div');
        errorPage.className = 'browser-page browser-error-page active';
        errorPage.innerHTML = `
            <div style="text-align:center; padding-top:60px;">
                <div style="font-size:48px; margin-bottom:16px;">🚫</div>
                <h1 style="font-size:20px; margin-bottom:8px;">Sayfa Yüklenemedi</h1>
                <p style="margin-bottom:6px;">Bu site, gömülü tarayıcıda açılmayı engelliyor.</p>
                <p style="color:var(--text-dim); font-size:11px; margin-bottom:24px; font-family:var(--font-mono);">${failedUrl}</p>
                <button class="browser-open-external" onclick="window.open('${failedUrl}', '_blank')">
                    🔗 Yeni Sekmede Aç
                </button>
            </div>
        `;
        viewport.appendChild(errorPage);
    }

    /* ── Navigation ── */
    function showBuiltinPage(pageName) {
        hideIframe();
        document.querySelectorAll('.browser-page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(pages[pageName]);
        if (pageEl) {
            pageEl.classList.add('active');
            currentPage = pageName;
            urlBar.value = urlMap[pageName];
            updateBookmarks(pageName);
            updateStatus(urlMap[pageName]);
        }
    }

    function loadExternal(url) {
        // Remove error pages
        const errPage = viewport.querySelector('.browser-error-page');
        if (errPage) errPage.remove();

        document.querySelectorAll('.browser-page').forEach(p => p.classList.remove('active'));

        // Convert known URLs to embeddable formats
        const ytEmbed = convertYouTubeUrl(url);
        if (ytEmbed) url = ytEmbed;
        url = convertGoogleUrl(url);

        const fr = getIframe();
        fr.style.display = 'block';
        fr.src = url;
        currentPage = 'external';
        // Show the original URL (not the embed one) for cleaner UX
        const displayUrl = ytEmbed ? url.replace('/embed/', '/watch?v=').replace('?autoplay=1', '') : url;
        urlBar.value = url.includes('igu=1') ? url.replace('&igu=1', '').replace('?igu=1', '') : url;
        updateBookmarks(null);
        updateStatus(url);
    }

    function navigate(target) {
        if (pages[target]) {
            showBuiltinPage(target);
            pushHistory(urlMap[target]);
            return;
        }

        if (target.startsWith('yakupos://')) {
            for (const [key, val] of Object.entries(urlMap)) {
                if (target === val) {
                    showBuiltinPage(key);
                    pushHistory(val);
                    return;
                }
            }
        }

        const url = normalizeUrl(target);
        loadExternal(url);
        pushHistory(url);
    }

    function pushHistory(url) {
        if (navHistory[historyIndex] !== url) {
            navHistory.splice(historyIndex + 1);
            navHistory.push(url);
            historyIndex = navHistory.length - 1;
        }
    }

    function updateBookmarks(activePage) {
        document.querySelectorAll('.browser-bookmark').forEach(b => {
            b.classList.toggle('active', b.dataset.page === activePage);
        });
    }

    function updateStatus(url) {
        const statusEl = document.getElementById('browser-status-text');
        if (statusEl) statusEl.textContent = url;
        const secureEl = document.getElementById('browser-secure-badge');
        if (secureEl) {
            if (url.startsWith('https://')) {
                secureEl.innerHTML = '🔒 Secure';
                secureEl.style.color = '#2ecc71';
            } else if (url.startsWith('http://')) {
                secureEl.innerHTML = '⚠️ Not Secure';
                secureEl.style.color = '#f39c12';
            } else {
                secureEl.innerHTML = '🔒 Secure';
                secureEl.style.color = '#2ecc71';
            }
        }
    }

    /* ── Navigation Buttons ── */
    const backBtn = document.getElementById('browser-back');
    const fwdBtn = document.getElementById('browser-fwd');
    const refreshBtn = document.getElementById('browser-refresh');
    const homeBtn = document.getElementById('browser-home');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex--;
                navigateFromHistory(navHistory[historyIndex]);
            }
        });
    }

    if (fwdBtn) {
        fwdBtn.addEventListener('click', () => {
            if (historyIndex < navHistory.length - 1) {
                historyIndex++;
                navigateFromHistory(navHistory[historyIndex]);
            }
        });
    }

    function navigateFromHistory(url) {
        if (url.startsWith('yakupos://')) {
            for (const [key, val] of Object.entries(urlMap)) {
                if (url === val) {
                    showBuiltinPage(key);
                    return;
                }
            }
        }
        // Remove error pages
        const errPage = viewport.querySelector('.browser-error-page');
        if (errPage) errPage.remove();

        document.querySelectorAll('.browser-page').forEach(p => p.classList.remove('active'));
        const ytEmbed = convertYouTubeUrl(url);
        const finalUrl = ytEmbed || convertGoogleUrl(url);

        const fr = getIframe();
        fr.style.display = 'block';
        fr.src = finalUrl;
        currentPage = 'external';
        urlBar.value = url;
        updateBookmarks(null);
        updateStatus(url);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentPage === 'external' && iframe) {
                iframe.src = iframe.src;
            } else {
                showBuiltinPage(currentPage);
            }
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            navigate('home');
        });
    }

    /* ── URL Bar ── */
    function handleGo() {
        const raw = urlBar.value.trim();
        if (!raw) return;

        const lower = raw.toLowerCase();
        for (const [key, val] of Object.entries(urlMap)) {
            if (lower === val || lower === key) {
                navigate(key);
                return;
            }
        }

        if (isExternalUrl(lower) || lower.includes('.')) {
            navigate(raw);
        } else {
            // Search via Google (iframe-friendly)
            navigate(`https://www.google.com/search?igu=1&q=${encodeURIComponent(raw)}`);
        }
    }

    if (goBtn) goBtn.addEventListener('click', handleGo);
    urlBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleGo();
    });
    urlBar.addEventListener('focus', () => urlBar.select());

    /* ── Home Page Search Box ── */
    if (searchBox) {
        searchBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchBox.value.trim();
                if (!query) return;

                // Check if it's a URL
                if (query.includes('.') && !query.includes(' ')) {
                    navigate(query);
                } else {
                    // Google search
                    navigate(`https://www.google.com/search?igu=1&q=${encodeURIComponent(query)}`);
                }
                searchBox.value = '';
            }
        });
    }

    /* ── Bookmark Clicks ── */
    document.querySelectorAll('.browser-bookmark').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate(btn.dataset.page);
        });
    });

    /* ── Quick Links ── */
    document.querySelectorAll('.browser-quick-link').forEach(link => {
        link.addEventListener('click', () => {
            navigate(link.dataset.page);
        });
    });

    /* ── Init ── */
    showBuiltinPage('home');
})();
