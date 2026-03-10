/* ═══════════════════════════════════════════════
   SETTINGS MODULE — persists to localStorage
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const STORAGE_KEY = 'yakupos-settings';

    const themeSelect = document.getElementById('setting-theme');
    const wallSelect = document.getElementById('setting-wallpaper');
    const fontSelect = document.getElementById('setting-fontsize');
    const colorDots = document.querySelectorAll('.color-dot');

    if (!themeSelect) return;

    function saveSettings() {
        try {
            const settings = {
                theme: themeSelect.value,
                wallpaper: wallSelect.value,
                fontSize: fontSelect.value,
                accent: document.documentElement.style.getPropertyValue('--accent').trim() || '#7c5cfc',
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) { /* quota exceeded or private mode */ }
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function applyTheme(value) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (value === 'light') {
            document.documentElement.dataset.theme = 'light';
            document.documentElement.style.setProperty('--bg-dark', '#f0f1f5');
            document.documentElement.style.setProperty('--bg-surface', '#ffffff');
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.88)');
            document.documentElement.style.setProperty('--glass-bg-hover', 'rgba(255, 255, 255, 0.95)');
            document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.12)');
            document.documentElement.style.setProperty('--glass-border-strong', 'rgba(0, 0, 0, 0.22)');
            document.documentElement.style.setProperty('--text-primary', '#111827');
            document.documentElement.style.setProperty('--text-secondary', '#4b5563');
            document.documentElement.style.setProperty('--text-dim', '#9ca3af');
            document.documentElement.style.setProperty('--grid-line', 'rgba(0, 0, 0, 0.05)');
            document.documentElement.style.setProperty('--grid-glow', 'rgba(124, 92, 252, 0.08)');
            if (metaThemeColor) metaThemeColor.content = '#f0f1f5';
        } else {
            delete document.documentElement.dataset.theme;
            document.documentElement.style.removeProperty('--bg-dark');
            document.documentElement.style.removeProperty('--bg-surface');
            document.documentElement.style.removeProperty('--glass-bg');
            document.documentElement.style.removeProperty('--glass-bg-hover');
            document.documentElement.style.removeProperty('--glass-border');
            document.documentElement.style.removeProperty('--glass-border-strong');
            document.documentElement.style.removeProperty('--text-primary');
            document.documentElement.style.removeProperty('--text-secondary');
            document.documentElement.style.removeProperty('--text-dim');
            document.documentElement.style.removeProperty('--grid-line');
            document.documentElement.style.removeProperty('--grid-glow');
            if (metaThemeColor) metaThemeColor.content = '#0a0a1a';
        }
    }

    function applyWallpaper(value) {
        const gridBg = document.getElementById('grid-bg');
        const wallpapers = {
            gradient: 'linear-gradient(135deg, #1f1c2c, #928dab)',
            matrix: 'linear-gradient(to bottom, #000000, #001f00)',
            stars: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
        };
        gridBg.style.background = wallpapers[value] || '';
    }

    function applyFontSize(value) {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.fontSize = sizes[value] || '16px';
    }

    function applyAccent(color) {
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-glow', color + '4d');
        colorDots.forEach(d => {
            d.classList.toggle('active', d.dataset.color === color);
        });
    }

    // Restore saved settings on load
    const saved = loadSettings();
    if (saved) {
        if (saved.theme) { themeSelect.value = saved.theme; applyTheme(saved.theme); }
        if (saved.wallpaper) { wallSelect.value = saved.wallpaper; applyWallpaper(saved.wallpaper); }
        if (saved.fontSize) { fontSelect.value = saved.fontSize; applyFontSize(saved.fontSize); }
        if (saved.accent) { applyAccent(saved.accent); }
    }

    const OS = window.YakupOS;

    // Event listeners
    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        saveSettings();
        if (OS.toast) OS.toast(`Theme: ${e.target.value}`, 'info', 2500);
    });
    wallSelect.addEventListener('change', (e) => {
        applyWallpaper(e.target.value);
        saveSettings();
    });
    fontSelect.addEventListener('change', (e) => {
        applyFontSize(e.target.value);
        saveSettings();
        if (OS.toast) OS.toast(`Font size: ${e.target.value}`, 'info', 2500);
    });

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            applyAccent(dot.dataset.color);
            saveSettings();
        });
    });
})();
