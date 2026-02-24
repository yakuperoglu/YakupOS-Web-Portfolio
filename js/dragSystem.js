/* ═══════════════════════════════════════════════
   DRAG SYSTEM — mouse & touch on title bars
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    function onDragStart(e) {
        if (OS.isMobile) return;
        const titlebar = e.target.closest('[data-drag-handle]');
        if (!titlebar) return;
        const win = titlebar.closest('.window');
        if (!win || win.classList.contains('maximized')) return;

        e.preventDefault();
        OS.drag.active = true;
        OS.drag.el = win;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        OS.drag.startX = clientX;
        OS.drag.startY = clientY;
        OS.drag.elStartX = win.offsetLeft;
        OS.drag.elStartY = win.offsetTop;
        OS.drag.rafId = null;

        // GPU-accelerate and disable transitions during drag
        win.classList.add('dragging');
        OS.focusWindow(win);
        document.body.style.cursor = 'grabbing';
    }

    function onDragMove(e) {
        if (!OS.drag.active || !OS.drag.el) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Store target position, defer actual DOM update to rAF
        OS.drag.targetX = OS.drag.elStartX + (clientX - OS.drag.startX);
        OS.drag.targetY = OS.drag.elStartY + (clientY - OS.drag.startY);

        if (!OS.drag.rafId) {
            OS.drag.rafId = requestAnimationFrame(applyDragPosition);
        }
    }

    /**
     * Apply drag position inside rAF for smooth, jank-free movement.
     */
    function applyDragPosition() {
        OS.drag.rafId = null;
        if (!OS.drag.active || !OS.drag.el) return;

        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        const newX = Math.max(-OS.drag.el.offsetWidth + 80, Math.min(OS.drag.targetX, maxX));
        const newY = Math.max(0, Math.min(OS.drag.targetY, maxY));

        OS.drag.el.style.left = newX + 'px';
        OS.drag.el.style.top = newY + 'px';
    }

    function onDragEnd() {
        if (OS.drag.el) {
            OS.drag.el.classList.remove('dragging');
        }
        if (OS.drag.rafId) {
            cancelAnimationFrame(OS.drag.rafId);
            OS.drag.rafId = null;
        }
        OS.drag.active = false;
        OS.drag.el = null;
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
})();
