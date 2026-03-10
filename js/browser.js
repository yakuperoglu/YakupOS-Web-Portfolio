/* ═══════════════════════════════════════════════
   BROWSER.EXE — Real Web Browser + Built-in Pages
   YouTube embed support + iframe error fallback
   Domain blocklist for non-embeddable sites
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
    let loadTimer = null;
    let lastNavigatedUrl = null;

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

    /* ── Domain Blocklist (sites that block iframe embedding) ── */
    const BLOCKED_DOMAINS = [
        'reddit.com', 'www.reddit.com', 'old.reddit.com',
        'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
        'facebook.com', 'www.facebook.com', 'm.facebook.com',
        'instagram.com', 'www.instagram.com',
        'linkedin.com', 'www.linkedin.com',
        'github.com', 'www.github.com',
        'stackoverflow.com', 'www.stackoverflow.com',
        'stackexchange.com',
        'amazon.com', 'www.amazon.com',
        'ebay.com', 'www.ebay.com',
        'netflix.com', 'www.netflix.com',
        'twitch.tv', 'www.twitch.tv',
        'discord.com', 'www.discord.com',
        'tiktok.com', 'www.tiktok.com',
        'pinterest.com', 'www.pinterest.com',
        'whatsapp.com', 'web.whatsapp.com',
        'telegram.org', 'web.telegram.org',
        'medium.com', 'www.medium.com',
        'quora.com', 'www.quora.com',
        'paypal.com', 'www.paypal.com',
        'dropbox.com', 'www.dropbox.com',
        'drive.google.com', 'docs.google.com',
        'mail.google.com',
        'outlook.com', 'outlook.live.com',
        'yahoo.com', 'www.yahoo.com', 'mail.yahoo.com',
        'bing.com', 'www.bing.com',
        'apple.com', 'www.apple.com',
        'microsoft.com', 'www.microsoft.com',
        'zoom.us', 'www.zoom.us',
        'slack.com', 'www.slack.com',
        'notion.so', 'www.notion.so',
        'figma.com', 'www.figma.com',
        'vercel.com', 'www.vercel.com',
        'netlify.com', 'www.netlify.com',
        'heroku.com', 'www.heroku.com',
        'cloudflare.com', 'www.cloudflare.com',
        'nytimes.com', 'www.nytimes.com',
        'bbc.com', 'www.bbc.com', 'bbc.co.uk', 'www.bbc.co.uk',
        'cnn.com', 'www.cnn.com',
        'theguardian.com', 'www.theguardian.com',
        'washingtonpost.com', 'www.washingtonpost.com',
        'forbes.com', 'www.forbes.com',
        'bloomberg.com', 'www.bloomberg.com',
    ];

    function isBlockedDomain(url) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            return BLOCKED_DOMAINS.some(domain =>
                hostname === domain || hostname.endsWith('.' + domain)
            );
        } catch (e) {
            return false;
        }
    }

    /* ── YouTube URL → Embed URL converter ── */
    function convertYouTubeUrl(url) {
        let match = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;

        match = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;

        match = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (match) return url;

        if (url.includes('youtube.com') && !url.includes('/embed/')) {
            return url;
        }

        return null;
    }

    /* ── Google → iframe-friendly Google ── */
    function convertGoogleUrl(url) {
        if (url.includes('google.com/search')) {
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

    /* ── Loading State ── */
    function showLoading(url) {
        removeLoading();
        const loader = document.createElement('div');
        loader.className = 'browser-loading-overlay';
        loader.id = 'browser-loader';
        loader.innerHTML = `
            <div class="browser-loading-spinner"></div>
            <p class="browser-loading-text">Loading...</p>
            <p class="browser-loading-url">${escapeHTML(url)}</p>
        `;
        viewport.appendChild(loader);
    }

    function removeLoading() {
        const loader = document.getElementById('browser-loader');
        if (loader) loader.remove();
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

            // Detect load events
            iframe.addEventListener('load', () => {
                if (loadTimer) {
                    clearTimeout(loadTimer);
                    loadTimer = null;
                }
                removeLoading();

                try {
                    const doc = iframe.contentDocument;
                    if (doc && doc.body && doc.body.innerHTML === '') {
                        showErrorPage(lastNavigatedUrl || iframe.src);
                        return;
                    }
                } catch (e) {
                    // Cross-origin — can't inspect. Check if it's a known blocked domain.
                    const currentSrc = iframe.src;
                    if (currentSrc && isBlockedDomain(currentSrc)) {
                        showErrorPage(currentSrc);
                        return;
                    }
                }

                // Track in-iframe navigation (for Google search result clicks)
                try {
                    // Will throw for cross-origin, that's expected
                    const iframeUrl = iframe.contentWindow.location.href;
                    if (iframeUrl && iframeUrl !== 'about:blank') {
                        // Check if the iframe navigated to a blocked domain
                        if (isBlockedDomain(iframeUrl)) {
                            showErrorPage(iframeUrl);
                            return;
                        }
                        // Update URL bar with current iframe URL
                        const cleanUrl = iframeUrl.replace(/[&?]igu=1/, '');
                        urlBar.value = cleanUrl;
                        updateStatus(cleanUrl);
                    }
                } catch (e) {
                    // Cross-origin navigation detected
                    // The iframe navigated to a different domain (e.g., from Google to Reddit)
                    // We can't read the URL, but we'll check if it loaded or was blocked
                    // Use a short delay to see if content actually rendered
                    setTimeout(() => {
                        checkIframeHealth();
                    }, 1500);
                }
            });

            // Handle iframe navigation errors
            iframe.addEventListener('error', () => {
                if (loadTimer) {
                    clearTimeout(loadTimer);
                    loadTimer = null;
                }
                removeLoading();
                showErrorPage(lastNavigatedUrl || iframe.src);
            });
        }
        return iframe;
    }

    /* ── Check if iframe actually has content ── */
    function checkIframeHealth() {
        if (!iframe || iframe.style.display === 'none') return;

        try {
            // Try to access iframe document — this will throw for cross-origin
            const doc = iframe.contentDocument;
            if (doc) {
                // Same-origin: check if body is empty
                if (doc.body && doc.body.innerHTML.trim() === '') {
                    showErrorPage(lastNavigatedUrl || iframe.src);
                }
            }
        } catch (e) {
            // Cross-origin: Can't check content directly
            // Check the iframe dimensions — if iframe loaded but shows error,
            // the browser might still render the "refused" page at iframe level
            // We rely on the blocklist for known sites
        }
    }

    function hideIframe() {
        if (loadTimer) {
            clearTimeout(loadTimer);
            loadTimer = null;
        }
        removeLoading();
        if (iframe) {
            iframe.style.display = 'none';
            iframe.src = 'about:blank';
        }
        const errPage = viewport.querySelector('.browser-error-page');
        if (errPage) errPage.remove();
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showErrorPage(failedUrl) {
        const old = viewport.querySelector('.browser-error-page');
        if (old) old.remove();
        removeLoading();

        if (iframe) iframe.style.display = 'none';

        const displayUrl = failedUrl ? failedUrl.replace(/[&?]igu=1/, '') : 'Unknown';

        const errorPage = document.createElement('div');
        errorPage.className = 'browser-error-page';
        errorPage.innerHTML = `
            <div class="browser-error-content">
                <div class="browser-error-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <h1 class="browser-error-title">Connection Refused</h1>
                <p class="browser-error-desc">This site blocks being displayed in an embedded browser.<br>You can open it in a new tab instead.</p>
                <p class="browser-error-url">${escapeHTML(displayUrl)}</p>
                <div class="browser-error-actions">
                    <button class="browser-error-btn primary" id="browser-error-open">
                        <span>🔗</span> Open in New Tab
                    </button>
                    <button class="browser-error-btn secondary" id="browser-error-copy">
                        <span>📋</span> Copy URL
                    </button>
                </div>
            </div>
        `;
        viewport.appendChild(errorPage);

        errorPage.querySelector('#browser-error-open').addEventListener('click', () => {
            window.open(displayUrl, '_blank');
        });

        const copyBtn = errorPage.querySelector('#browser-error-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(displayUrl).then(() => {
                    copyBtn.innerHTML = '<span>✅</span> Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<span>📋</span> Copy URL';
                    }, 2000);
                });
            });
        }
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

        // Check blocked domains BEFORE loading
        const urlToCheck = ytEmbed || url;
        if (isBlockedDomain(urlToCheck)) {
            showErrorPage(urlToCheck);
            currentPage = 'external';
            urlBar.value = urlToCheck.replace(/[&?]igu=1/, '');
            updateBookmarks(null);
            updateStatus(urlToCheck);
            return;
        }

        lastNavigatedUrl = url;
        showLoading(url.replace(/[&?]igu=1/, ''));

        const fr = getIframe();
        fr.style.display = 'block';
        fr.src = url;
        currentPage = 'external';
        urlBar.value = url.includes('igu=1') ? url.replace('&igu=1', '').replace('?igu=1', '') : url;
        updateBookmarks(null);
        updateStatus(url);

        // Fallback timer: if page hasn't loaded in 10 seconds, it might be blocked
        if (loadTimer) clearTimeout(loadTimer);
        loadTimer = setTimeout(() => {
            // If still loading, check if it's likely blocked
            const loader = document.getElementById('browser-loader');
            if (loader) {
                // Loader still visible means load event hasn't fired
                removeLoading();
                showErrorPage(url);
            }
        }, 10000);
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

        // Check blocked domains
        if (isBlockedDomain(url)) {
            const errPage = viewport.querySelector('.browser-error-page');
            if (errPage) errPage.remove();
            document.querySelectorAll('.browser-page').forEach(p => p.classList.remove('active'));
            showErrorPage(url);
            currentPage = 'external';
            urlBar.value = url;
            updateBookmarks(null);
            updateStatus(url);
            return;
        }

        // Remove error pages
        const errPage = viewport.querySelector('.browser-error-page');
        if (errPage) errPage.remove();

        document.querySelectorAll('.browser-page').forEach(p => p.classList.remove('active'));
        const ytEmbed = convertYouTubeUrl(url);
        const finalUrl = ytEmbed || convertGoogleUrl(url);

        lastNavigatedUrl = url;
        showLoading(url);

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
                const currentUrl = iframe.src;
                if (currentUrl && currentUrl !== 'about:blank') {
                    showLoading(currentUrl);
                    iframe.src = currentUrl;
                }
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

                if (query.includes('.') && !query.includes(' ')) {
                    navigate(query);
                } else {
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
