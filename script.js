/* ═══════════════════════════════════════════════════════════════
   YakupOS — Retro-Futuristic Portfolio
   Vanilla JavaScript: Window Manager, Drag System, Taskbar,
   Clock, Start Menu, Boot Screen, Mobile Responsive Handler
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─── DOM References ─── */
    const desktop = document.getElementById('desktop');
    const bootScreen = document.getElementById('boot-screen');
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    const taskbarTabs = document.getElementById('taskbar-tabs');
    const clockEl = document.getElementById('clock');
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    const windows = document.querySelectorAll('.window');
    const startMenuItems = document.querySelectorAll('.start-menu-item');

    /* ─── State ─── */
    let topZ = 100;                     // z-index counter for stacking
    let isMobile = false;               // mobile flag, set by media query
    let activeWindow = null;            // currently focused window ref

    // Drag state
    const drag = {
        active: false,
        el: null,
        startX: 0,
        startY: 0,
        elStartX: 0,
        elStartY: 0,
    };

    /* ═══════════════════════════════════════════════
       BOOT SCREEN
       ═══════════════════════════════════════════════ */
    function dismissBoot() {
        bootScreen.classList.add('hidden');
        // Open about window after boot finishes on desktop
        if (!isMobile) {
            setTimeout(() => openWindow('about'), 400);
        }
    }

    // Dismiss boot screen after progress bar animation (~2.2s)
    setTimeout(dismissBoot, 2400);

    /* ═══════════════════════════════════════════════
       WINDOW MANAGER
       ═══════════════════════════════════════════════ */

    /**
     * Open a window by its data-id.
     * If already open, just focus it.
     */
    function openWindow(id) {
        const win = document.querySelector(`.window[data-id="${id}"]`);
        if (!win) return;

        if (win.classList.contains('open')) {
            // Already open — just bring to front
            focusWindow(win);
            return;
        }

        win.classList.add('open');
        win.classList.remove('minimizing');
        focusWindow(win);
        updateTaskbar();
    }

    /**
     * Close a window (with animation).
     */
    function closeWindow(win) {
        win.style.animation = 'windowClose 0.25s var(--ease-out) forwards';
        win.addEventListener('animationend', function handler() {
            win.removeEventListener('animationend', handler);
            win.classList.remove('open', 'focused', 'maximized');
            win.style.animation = '';
            if (activeWindow === win) activeWindow = null;
            updateTaskbar();
        });
    }

    /**
     * Minimize a window (animate out, keep "open" in taskbar).
     */
    function minimizeWindow(win) {
        win.classList.add('minimizing');
        win.addEventListener('animationend', function handler() {
            win.removeEventListener('animationend', handler);
            win.style.display = 'none';
            win.classList.remove('focused');
            if (activeWindow === win) activeWindow = null;
            updateTaskbar();
        });
    }

    /**
     * Restore a minimized window.
     */
    function restoreWindow(win) {
        win.classList.remove('minimizing');
        win.style.display = 'flex';
        win.style.animation = 'windowOpen 0.3s var(--ease-spring) both';
        win.addEventListener('animationend', function handler() {
            win.removeEventListener('animationend', handler);
            win.style.animation = '';
        });
        focusWindow(win);
    }

    /**
     * Toggle maximize/restore for a window.
     */
    function toggleMaximize(win) {
        win.classList.toggle('maximized');
        // If maximizing, store original position for later restore
        if (win.classList.contains('maximized')) {
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
        } else {
            // Restore previous position
            win.style.top = win.dataset.prevTop || '';
            win.style.left = win.dataset.prevLeft || '';
            win.style.width = win.dataset.prevWidth || '';
            win.style.height = win.dataset.prevHeight || '';
        }
        focusWindow(win);
    }

    /**
     * Bring a window to the top of the stack.
     */
    function focusWindow(win) {
        // Remove focus from all windows
        windows.forEach(w => w.classList.remove('focused'));
        // Apply to target
        topZ += 1;
        win.style.zIndex = topZ;
        win.classList.add('focused');
        activeWindow = win;
        updateTaskbar();
    }

    /* ─── Window control button handler ─── */
    windows.forEach(win => {
        const controls = win.querySelectorAll('.win-btn');
        controls.forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'close') closeWindow(win);
                if (action === 'minimize') minimizeWindow(win);
                if (action === 'maximize') toggleMaximize(win);
            });
        });

        // Click anywhere on a window to focus it
        win.addEventListener('mousedown', () => focusWindow(win));
        win.addEventListener('touchstart', () => focusWindow(win), { passive: true });
    });

    /* ═══════════════════════════════════════════════
       DRAG SYSTEM — mouse & touch on title bars
       ═══════════════════════════════════════════════ */

    function onDragStart(e) {
        if (isMobile) return;
        const titlebar = e.target.closest('[data-drag-handle]');
        if (!titlebar) return;
        const win = titlebar.closest('.window');
        if (!win || win.classList.contains('maximized')) return;

        e.preventDefault();
        drag.active = true;
        drag.el = win;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        drag.startX = clientX;
        drag.startY = clientY;
        drag.elStartX = win.offsetLeft;
        drag.elStartY = win.offsetTop;

        focusWindow(win);
        document.body.style.cursor = 'grabbing';
    }

    function onDragMove(e) {
        if (!drag.active || !drag.el) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let newX = drag.elStartX + (clientX - drag.startX);
        let newY = drag.elStartY + (clientY - drag.startY);

        // Constrain to viewport
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        newX = Math.max(-drag.el.offsetWidth + 80, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        drag.el.style.left = newX + 'px';
        drag.el.style.top = newY + 'px';
    }

    function onDragEnd() {
        drag.active = false;
        drag.el = null;
        document.body.style.cursor = '';
    }

    // Mouse events
    document.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    // Touch events
    document.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    /* ═══════════════════════════════════════════════
       DESKTOP ICONS — click to open
       ═══════════════════════════════════════════════ */
    desktopIcons.forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const winId = icon.dataset.window;
            openWindow(winId);
        });

        // Single click also opens (better UX)
        icon.addEventListener('click', () => {
            const winId = icon.dataset.window;
            openWindow(winId);
        });

        // Keyboard support
        icon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWindow(icon.dataset.window);
            }
        });
    });

    /* ═══════════════════════════════════════════════
       TASKBAR TABS
       ═══════════════════════════════════════════════ */

    const tabLabels = {
        about: '👤 About.exe',
        projects: '📁 Projects.folder',
        contact: '✉️ Contact.txt',
    };

    /**
     * Rebuild taskbar tabs from current window states.
     */
    function updateTaskbar() {
        taskbarTabs.innerHTML = '';

        windows.forEach(win => {
            if (!win.classList.contains('open')) return;
            const id = win.dataset.id;
            const tab = document.createElement('button');
            tab.className = 'taskbar-tab';
            tab.textContent = tabLabels[id] || id;

            // Highlight if this window is focused and visible
            const isVisible = win.style.display !== 'none';
            const isFocused = win.classList.contains('focused');
            if (isVisible && isFocused) tab.classList.add('active');

            tab.addEventListener('click', () => {
                if (win.style.display === 'none') {
                    // Minimized — restore
                    restoreWindow(win);
                } else if (win.classList.contains('focused')) {
                    // Already focused — minimize
                    minimizeWindow(win);
                } else {
                    // Not focused — bring to front
                    focusWindow(win);
                }
            });

            taskbarTabs.appendChild(tab);
        });
    }

    /* ═══════════════════════════════════════════════
       START MENU
       ═══════════════════════════════════════════════ */
    function toggleStartMenu() {
        const isOpen = !startMenu.hidden;
        startMenu.hidden = isOpen;
        startBtn.classList.toggle('active', !isOpen);
        startBtn.setAttribute('aria-expanded', String(!isOpen));
    }

    startBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleStartMenu();
    });

    // Start menu items open windows
    startMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            openWindow(item.dataset.window);
            startMenu.hidden = true;
            startBtn.classList.remove('active');
            startBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close start menu when clicking outside
    document.addEventListener('click', e => {
        if (!startMenu.hidden && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.hidden = true;
            startBtn.classList.remove('active');
            startBtn.setAttribute('aria-expanded', 'false');
        }
    });

    /* ═══════════════════════════════════════════════
       LIVE CLOCK
       ═══════════════════════════════════════════════ */
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ═══════════════════════════════════════════════
       CONTACT FORM (simple handler)
       ═══════════════════════════════════════════════ */
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const btn = contactForm.querySelector('.send-btn span');
        const originalText = btn.textContent;
        btn.textContent = 'Sent! ✓';
        contactForm.reset();
        setTimeout(() => { btn.textContent = originalText; }, 2500);
    });

    /* ═══════════════════════════════════════════════
       RESPONSIVE HANDLER — desktop ↔ mobile
       ═══════════════════════════════════════════════ */
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    function handleMobileChange(e) {
        isMobile = e.matches;
        if (isMobile) {
            // On mobile: show all windows as cards, reset positions
            windows.forEach(win => {
                win.classList.add('open');
                win.classList.remove('focused', 'maximized', 'minimizing');
                win.style.display = 'flex';
                win.style.zIndex = '';
            });
            // Close start menu
            startMenu.hidden = true;
            startBtn.classList.remove('active');
            updateTaskbar();
        }
    }

    mobileQuery.addEventListener('change', handleMobileChange);
    handleMobileChange(mobileQuery); // initial check

})();
