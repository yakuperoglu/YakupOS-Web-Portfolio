/* ═══════════════════════════════════════════════
   BOOT SCREEN, START MENU, CLOCK, CONTACT FORM,
   RESPONSIVE HANDLER
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    /* ─── BOOT SCREEN ─── */
    function dismissBoot() {
        OS.bootScreen.classList.add('hidden');
        // Open about window after boot finishes on desktop
        if (!OS.isMobile) {
            setTimeout(() => OS.openWindow('about'), 400);
        }
    }

    // Dismiss boot screen after progress bar animation (~2.2s)
    setTimeout(dismissBoot, 2400);

    /* ─── START MENU ─── */
    const startSearch = document.getElementById('start-search');
    const pinnedSection = document.getElementById('start-pinned-section');
    const allAppsSection = document.getElementById('start-allapps-section');
    const searchResultsSection = document.getElementById('start-search-results');
    const searchResultsList = document.getElementById('start-results-list');
    const noResultsEl = document.getElementById('start-no-results');
    const toggleAppsBtn = document.getElementById('start-toggle-apps');
    const allAppsList = document.getElementById('start-apps-list');

    let allAppsExpanded = false;

    function closeStartMenu() {
        OS.startMenu.hidden = true;
        OS.startBtn.classList.remove('active');
        OS.startBtn.setAttribute('aria-expanded', 'false');
        if (startSearch) { startSearch.value = ''; resetSearch(); }
    }

    function openStartMenu() {
        OS.startMenu.hidden = false;
        OS.startBtn.classList.add('active');
        OS.startBtn.setAttribute('aria-expanded', 'true');
        setTimeout(() => { if (startSearch) startSearch.focus(); }, 100);
    }

    function toggleStartMenu() {
        if (!OS.startMenu.hidden) closeStartMenu();
        else openStartMenu();
    }

    OS.startBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleStartMenu();
    });

    function openWindowFromMenu(windowId) {
        OS.openWindow(windowId);
        closeStartMenu();
    }

    // Pinned buttons
    document.querySelectorAll('.start-pin').forEach(btn => {
        btn.addEventListener('click', () => openWindowFromMenu(btn.dataset.window));
    });

    // All app items
    OS.startMenuItems.forEach(item => {
        item.addEventListener('click', () => openWindowFromMenu(item.dataset.window));
    });

    // Toggle All Apps
    if (toggleAppsBtn) {
        toggleAppsBtn.addEventListener('click', () => {
            allAppsExpanded = !allAppsExpanded;
            allAppsList.style.display = allAppsExpanded ? 'block' : 'none';
            toggleAppsBtn.textContent = allAppsExpanded ? '‹ Hide' : 'Show all ›';
        });
    }

    // Search functionality
    function resetSearch() {
        pinnedSection.style.display = '';
        allAppsSection.style.display = '';
        searchResultsSection.style.display = 'none';
        document.querySelector('.start-menu .start-divider').style.display = '';
    }

    if (startSearch) {
        startSearch.addEventListener('input', () => {
            const query = startSearch.value.trim().toLowerCase();

            if (!query) { resetSearch(); return; }

            pinnedSection.style.display = 'none';
            allAppsSection.style.display = 'none';
            document.querySelector('.start-menu .start-divider').style.display = 'none';
            searchResultsSection.style.display = 'block';
            searchResultsList.innerHTML = '';

            const allItems = document.querySelectorAll('#start-apps-list .start-menu-item');
            let found = 0;

            allItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    const li = document.createElement('li');
                    const btn = document.createElement('button');
                    btn.className = 'start-menu-item';
                    btn.dataset.window = item.dataset.window;
                    btn.innerHTML = item.innerHTML;
                    btn.addEventListener('click', () => openWindowFromMenu(btn.dataset.window));
                    li.appendChild(btn);
                    searchResultsList.appendChild(li);
                    found++;
                }
            });

            noResultsEl.style.display = found === 0 ? 'block' : 'none';
        });

        startSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeStartMenu();
        });
    }

    // Close start menu when clicking outside
    document.addEventListener('click', e => {
        if (!OS.startMenu.hidden && !OS.startMenu.contains(e.target) && !OS.startBtn.contains(e.target)) {
            closeStartMenu();
        }
    });

    /* ─── LIVE CLOCK ─── */
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        OS.clockEl.textContent = `${h}:${m}:${s}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ─── CONTACT FORM (Web3Forms) ─── */
    const contactForm = document.getElementById('contact-form');
    const WEB3FORMS_KEY = contactForm.dataset.apikey || '';

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('.send-btn span');
        const originalText = btn.textContent;

        if (!WEB3FORMS_KEY) {
            btn.textContent = 'Demo mode — no API key';
            if (OS.toast) OS.toast('Demo mode — no API key configured', 'warning', 3500);
            contactForm.reset();
            setTimeout(() => { btn.textContent = originalText; }, 3000);
            return;
        }

        btn.textContent = 'Sending...';

        try {
            const formData = new FormData(contactForm);
            formData.append('access_key', WEB3FORMS_KEY);

            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                btn.textContent = 'Sent! ✓';
                contactForm.reset();
                if (OS.toast) OS.toast('Message sent successfully!', 'success');
            } else {
                btn.textContent = 'Failed — try again';
                if (OS.toast) OS.toast('Failed to send message', 'error');
            }
        } catch {
            btn.textContent = 'Network error';
            if (OS.toast) OS.toast('Network error — please try again', 'error');
        }

        setTimeout(() => { btn.textContent = originalText; }, 3000);
    });

    /* ─── RESPONSIVE HANDLER — desktop ↔ mobile ─── */
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    function handleMobileChange(e) {
        OS.isMobile = e.matches;
        if (OS.isMobile) {
            OS.startMenu.hidden = true;
            OS.startBtn.classList.remove('active');

            OS.windows.forEach(win => {
                if (win.classList.contains('maximized')) {
                    win.classList.remove('maximized');
                }
                // Reset inline position/size so CSS cards layout works
                if (win.dataset.state === 'open') {
                    win.style.top = '';
                    win.style.left = '';
                    win.style.width = '';
                    win.style.height = '';
                }
            });
            OS.updateTaskbar();
        }
    }

    mobileQuery.addEventListener('change', handleMobileChange);
    handleMobileChange(mobileQuery); // initial check
})();
