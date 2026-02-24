/* ═══════════════════════════════════════════════
   STATS DASHBOARD MODULE
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const statsWin = document.getElementById('window-stats');
    if (!statsWin) return;

    let statsAnimated = false;

    // Observe when stats window opens to trigger animations
    const observer = new MutationObserver(() => {
        if (statsWin.dataset.state === 'open' && !statsAnimated) {
            statsAnimated = true;
            animateStats();
        }
    });
    observer.observe(statsWin, { attributes: true, attributeFilter: ['data-state'] });

    function animateStats() {
        // Animate counter values
        statsWin.querySelectorAll('.stat-value').forEach(el => {
            const target = parseInt(el.dataset.count || '0');
            let current = 0;
            const step = Math.ceil(target / 30);
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = current;
            }, 40);
        });

        // Animate tech bars
        setTimeout(() => {
            statsWin.querySelectorAll('.tech-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width || '0%';
            });
        }, 200);
    }

    // Session uptime timer
    const uptimeEl = document.getElementById('stats-uptime');
    const sessionStart = Date.now();
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        if (uptimeEl) uptimeEl.textContent = `Session: ${m}m ${s}s`;
    }, 1000);
})();
