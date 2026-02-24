/* ═══════════════════════════════════════════════
   SETTINGS MODULE
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const themeSelect = document.getElementById('setting-theme');
    const wallSelect = document.getElementById('setting-wallpaper');
    const fontSelect = document.getElementById('setting-fontsize');
    const colorDots = document.querySelectorAll('.color-dot');

    if (!themeSelect) return;

    // Theme toggle
    themeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'light') {
            document.documentElement.dataset.theme = 'light';
            document.documentElement.style.setProperty('--bg-dark', '#f8f9fa');
            document.documentElement.style.setProperty('--bg-surface', '#ffffff');
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.85)');
            document.documentElement.style.setProperty('--glass-bg-hover', 'rgba(255, 255, 255, 0.95)');
            document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.15)');
            document.documentElement.style.setProperty('--glass-border-strong', 'rgba(0, 0, 0, 0.25)');
            document.documentElement.style.setProperty('--text-primary', '#111827');
            document.documentElement.style.setProperty('--text-secondary', '#4b5563');
            document.documentElement.style.setProperty('--text-dim', '#9ca3af');
            document.documentElement.style.setProperty('--grid-line', 'rgba(0, 0, 0, 0.05)');
            document.documentElement.style.setProperty('--grid-glow', 'rgba(124, 92, 252, 0.08)');
        } else {
            // Reset to default dark
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
        }
    });

    // Wallpaper toggle
    wallSelect.addEventListener('change', (e) => {
        const gridBg = document.getElementById('grid-bg');
        if (e.target.value === 'gradient') {
            gridBg.style.background = 'linear-gradient(135deg, #1f1c2c, #928dab)';
        } else if (e.target.value === 'matrix') {
            gridBg.style.background = 'linear-gradient(to bottom, #000000, #001f00)';
        } else if (e.target.value === 'stars') {
            gridBg.style.background = 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)';
        } else {
            gridBg.style.background = ''; // Default
        }
    });

    // Accent color dots
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const color = dot.dataset.color;
            document.documentElement.style.setProperty('--accent', color);
            document.documentElement.style.setProperty('--accent-glow', color + '4d'); // Add alpha
        });
    });

    // Accessibility/Font Size
    fontSelect.addEventListener('change', (e) => {
        if (e.target.value === 'small') {
            document.documentElement.style.fontSize = '14px';
        } else if (e.target.value === 'large') {
            document.documentElement.style.fontSize = '18px';
        } else {
            document.documentElement.style.fontSize = '16px';
        }
    });
})();
