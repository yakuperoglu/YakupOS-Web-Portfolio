/* ═══════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   Must load before modules that use it.
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;
    const container = document.getElementById('toast-container');
    if (!container) return;

    const ICONS = {
        info:    '<i class="ti ti-info-circle"></i>',
        success: '<i class="ti ti-circle-check"></i>',
        warning: '<i class="ti ti-alert-triangle"></i>',
        error:   '<i class="ti ti-circle-x"></i>',
    };

    const MAX_TOASTS = 5;

    /**
     * Show a toast notification.
     * @param {string} message  - Text to display
     * @param {string} [type]   - 'info' | 'success' | 'warning' | 'error'
     * @param {number} [duration] - Auto-dismiss in ms (default 4000, 0 = no auto)
     */
    function toast(message, type, duration) {
        type = type || 'info';
        duration = duration !== undefined ? duration : 4000;

        const el = document.createElement('div');
        el.className = `toast toast-${type}`;

        el.innerHTML =
            `<span class="toast-icon">${ICONS[type] || ICONS.info}</span>` +
            `<span class="toast-msg"></span>` +
            `<button class="toast-close" aria-label="Close"><i class="ti ti-x"></i></button>`;

        el.querySelector('.toast-msg').textContent = message;

        if (duration > 0) {
            const bar = document.createElement('div');
            bar.className = 'toast-progress';
            bar.style.animationDuration = duration + 'ms';
            el.appendChild(bar);
        }

        const closeBtn = el.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => dismissToast(el));

        container.appendChild(el);

        while (container.children.length > MAX_TOASTS) {
            dismissToast(container.children[0]);
        }

        if (duration > 0) {
            setTimeout(() => dismissToast(el), duration);
        }

        return el;
    }

    function dismissToast(el) {
        if (!el || !el.parentNode) return;
        if (el.classList.contains('removing')) return;
        el.classList.add('removing');
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 320);
    }

    OS.toast = toast;
})();
