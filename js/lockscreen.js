/* ═══════════════════════════════════════════════
   LOCK SCREEN
   Shows time/date, unlocks on click or key press,
   then reveals the boot screen.
   Skips automatically on in-session refresh.
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    const lockScreen = document.getElementById('lock-screen');
    const lockTime   = document.getElementById('lock-time');
    const lockDate   = document.getElementById('lock-date');

    if (!lockScreen) return;

    // Skip lock screen if already unlocked this session (e.g. page refresh)
    if (sessionStorage.getItem('yakupos-unlocked')) {
        lockScreen.style.display = 'none';
        return;
    }

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    let clockInterval = null;

    function updateLockClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        lockTime.textContent = `${h}:${m}`;
        lockDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
    }

    updateLockClock();
    clockInterval = setInterval(updateLockClock, 1000);

    let unlocked = false;

    function unlock() {
        if (unlocked) return;
        unlocked = true;

        clearInterval(clockInterval);
        sessionStorage.setItem('yakupos-unlocked', '1');
        lockScreen.classList.add('dismissed');

        setTimeout(() => {
            lockScreen.style.display = 'none';
        }, 750);

        document.removeEventListener('keydown', unlock);
        lockScreen.removeEventListener('click', unlock);
        lockScreen.removeEventListener('touchstart', unlock);

        if (OS.toast) {
            setTimeout(() => {
                OS.toast('Welcome to YakupOS!', 'success', 3000);
            }, 3200);
        }
    }

    lockScreen.addEventListener('click', unlock);
    lockScreen.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
})();
