/* ═══════════════════════════════════════════════
   DESKTOP CONTEXT MENU (RIGHT-CLICK)
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    const ctxMenu = document.getElementById('ctx-menu');
    const desktop = document.getElementById('desktop');
    if (!ctxMenu || !desktop) return;

    function showCtx(x, y) {
        ctxMenu.style.display = 'block';
        ctxMenu.style.animation = 'none';
        void ctxMenu.offsetWidth;
        ctxMenu.style.animation = '';

        const mw = ctxMenu.offsetWidth;
        const mh = ctxMenu.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (x + mw > vw) x = vw - mw - 8;
        if (y + mh > vh) y = vh - mh - 8;
        if (x < 4) x = 4;
        if (y < 4) y = 4;

        ctxMenu.style.left = x + 'px';
        ctxMenu.style.top  = y + 'px';
    }

    function hideCtx() {
        ctxMenu.style.display = 'none';
    }

    desktop.addEventListener('contextmenu', (e) => {
        const isIcon  = e.target.closest('.desktop-icon');
        const isWindow = e.target.closest('.window');
        if (isIcon || isWindow) return;

        e.preventDefault();
        showCtx(e.clientX, e.clientY);
    });

    document.addEventListener('click', (e) => {
        if (!ctxMenu.contains(e.target)) hideCtx();
    });
    document.addEventListener('contextmenu', (e) => {
        if (!desktop.contains(e.target) || e.target.closest('.window') || e.target.closest('.desktop-icon')) {
            hideCtx();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideCtx();
    });
    window.addEventListener('blur', hideCtx);
    window.addEventListener('resize', hideCtx);

    /* ─── Action handlers ─── */
    const wallpaperCycle = ['default', 'gradient', 'matrix', 'stars'];

    let refreshing = false;

    function desktopRefresh() {
        if (refreshing) return;
        refreshing = true;

        const iconsContainer = document.getElementById('desktop-icons');
        if (!iconsContainer) { refreshing = false; return; }

        iconsContainer.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
        iconsContainer.style.opacity = '0';
        iconsContainer.style.transform = 'scale(0.97)';

        setTimeout(() => {
            if (OS.sortIcons) OS.sortIcons();

            iconsContainer.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
            iconsContainer.style.opacity = '1';
            iconsContainer.style.transform = 'scale(1)';

            setTimeout(() => {
                iconsContainer.style.transition = '';
                iconsContainer.style.transform = '';
                refreshing = false;
            }, 280);
        }, 180);
    }

    const actions = {
        'ctx-refresh': () => {
            desktopRefresh();
        },
        'ctx-terminal': () => {
            OS.openWindow('terminal');
        },
        'ctx-sort': () => {
            if (OS.sortIcons) {
                OS.sortIcons();
                if (OS.toast) OS.toast('Icons sorted', 'info', 2500);
            }
        },
        'ctx-wallpaper': () => {
            const wallSelect = document.getElementById('setting-wallpaper');
            if (!wallSelect) return;
            const idx = wallpaperCycle.indexOf(wallSelect.value);
            const next = wallpaperCycle[(idx + 1) % wallpaperCycle.length];
            wallSelect.value = next;
            wallSelect.dispatchEvent(new Event('change'));
            if (OS.toast) OS.toast(`Wallpaper: ${next}`, 'info', 2500);
        },
        'ctx-settings': () => {
            OS.openWindow('settings');
        },
        'ctx-about': () => {
            OS.openWindow('about');
        },
    };

    ctxMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.ctx-item');
        if (!item) return;
        const action = item.dataset.action;
        if (actions[action]) actions[action]();
        hideCtx();
    });
})();
