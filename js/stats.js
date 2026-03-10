/* ═══════════════════════════════════════════════
   STATS DASHBOARD MODULE
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const statsWin = document.getElementById('window-stats');
    if (!statsWin) return;

    let statsAnimated = false;

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

    // Session uptime timer — only tick while window is open
    const uptimeEl = document.getElementById('stats-uptime');
    const sessionStart = Date.now();
    let uptimeInterval = null;

    function startUptimeTick() {
        if (uptimeInterval) return;
        uptimeInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            if (uptimeEl) uptimeEl.textContent = `Session: ${m}m ${s}s`;
        }, 1000);
    }

    function stopUptimeTick() {
        if (uptimeInterval) { clearInterval(uptimeInterval); uptimeInterval = null; }
    }

    const stateObserver = new MutationObserver(() => {
        if (statsWin.dataset.state === 'open') {
            if (!statsAnimated) { statsAnimated = true; animateStats(); }
            startUptimeTick();
        } else {
            stopUptimeTick();
        }
    });
    stateObserver.observe(statsWin, { attributes: true, attributeFilter: ['data-state'] });
})();
