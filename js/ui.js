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
    function toggleStartMenu() {
        const isOpen = !OS.startMenu.hidden;
        OS.startMenu.hidden = isOpen;
        OS.startBtn.classList.toggle('active', !isOpen);
        OS.startBtn.setAttribute('aria-expanded', String(!isOpen));
    }

    OS.startBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleStartMenu();
    });

    // Start menu items open windows
    OS.startMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            OS.openWindow(item.dataset.window);
            OS.startMenu.hidden = true;
            OS.startBtn.classList.remove('active');
            OS.startBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close start menu when clicking outside
    document.addEventListener('click', e => {
        if (!OS.startMenu.hidden && !OS.startMenu.contains(e.target) && !OS.startBtn.contains(e.target)) {
            OS.startMenu.hidden = true;
            OS.startBtn.classList.remove('active');
            OS.startBtn.setAttribute('aria-expanded', 'false');
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
            } else {
                btn.textContent = 'Failed — try again';
            }
        } catch {
            btn.textContent = 'Network error';
        }

        setTimeout(() => { btn.textContent = originalText; }, 3000);
    });

    /* ─── RESPONSIVE HANDLER — desktop ↔ mobile ─── */
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    function handleMobileChange(e) {
        OS.isMobile = e.matches;
        if (OS.isMobile) {
            // Close start menu
            OS.startMenu.hidden = true;
            OS.startBtn.classList.remove('active');

            // Remove maximized state from open windows so they flow naturally as cards
            OS.windows.forEach(win => {
                if (win.classList.contains('maximized')) {
                    win.classList.remove('maximized');
                }
            });
            OS.updateTaskbar();
        }
    }

    mobileQuery.addEventListener('change', handleMobileChange);
    handleMobileChange(mobileQuery); // initial check
})();
