/* ═══════════════════════════════════════════════
   WINDOW MANAGER
   Uses data-state attribute for reliable state tracking:
   - 'open'      → visible on desktop
   - 'minimized' → hidden but still in taskbar
   - (absent)    → closed / never opened
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    /**
     * Open a window by its data-id.
     * If already open, just focus it. If minimized, restore it.
     */
    function openWindow(id) {
        const win = document.querySelector(`.window[data-id="${id}"]`);
        if (!win) return;

        const state = win.dataset.state;

        if (state === 'minimized') {
            restoreWindow(win);
            return;
        }

        if (state === 'open') {
            focusWindow(win);
            return;
        }

        // Fresh open
        win.dataset.state = 'open';
        win.classList.remove('minimizing');
        win.classList.add('open');
        win.style.display = 'flex';
        win.style.animation = '';
        // Force reflow so the CSS .open animation replays
        void win.offsetWidth;
        focusWindow(win);
        updateTaskbar();
    }

    /**
     * Close a window (with animation).
     * Uses setTimeout so we never depend on animationend.
     */
    function closeWindow(win) {
        // Mark closed immediately so nothing can re-focus it
        delete win.dataset.state;
        win.classList.remove('focused');
        if (OS.activeWindow === win) OS.activeWindow = null;

        // Play close animation
        win.style.animation = 'windowClose 0.25s cubic-bezier(0.22,1,0.36,1) forwards';

        setTimeout(() => {
            win.classList.remove('open', 'maximized', 'minimizing');
            win.style.display = 'none';
            win.style.animation = '';
            updateTaskbar();
        }, 280); // slightly longer than the 250ms animation

        // Update taskbar immediately so the tab disappears
        updateTaskbar();
    }

    /**
     * Minimize a window (animate out, keep in taskbar).
     */
    function minimizeWindow(win) {
        win.dataset.state = 'minimized';
        win.classList.add('minimizing');
        win.classList.remove('focused');
        if (OS.activeWindow === win) OS.activeWindow = null;

        setTimeout(() => {
            // Only hide if still minimized (user might have restored quickly)
            if (win.dataset.state === 'minimized') {
                win.style.display = 'none';
            }
        }, 320); // slightly longer than the 300ms animation

        updateTaskbar();
    }

    /**
     * Restore a minimized window.
     */
    function restoreWindow(win) {
        win.dataset.state = 'open';
        win.classList.remove('minimizing');
        win.style.display = 'flex';
        win.style.animation = 'windowOpen 0.3s cubic-bezier(0.34,1.56,0.64,1) both';

        setTimeout(() => {
            win.style.animation = '';
        }, 340);

        focusWindow(win);
    }

    /**
     * Toggle maximize/restore for a window.
     */
    function toggleMaximize(win) {
        // Add transition class BEFORE toggling so it animates both ways
        win.classList.add('animating');

        if (!win.classList.contains('maximized')) {
            // Maximizing — store current position first
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
            win.classList.add('maximized');
        } else {
            // Restoring — remove maximized and apply previous position
            win.classList.remove('maximized');
            win.style.top = win.dataset.prevTop || '';
            win.style.left = win.dataset.prevLeft || '';
            win.style.width = win.dataset.prevWidth || '';
            win.style.height = win.dataset.prevHeight || '';
        }

        // Remove .animating after the transition completes so it
        // doesn't interfere with dragging
        setTimeout(() => win.classList.remove('animating'), 380);

        focusWindow(win);
    }

    /**
     * Bring a window to the top of the stack.
     * Ignores windows that are not in 'open' state.
     */
    function focusWindow(win) {
        if (win.dataset.state !== 'open') return;

        OS.windows.forEach(w => w.classList.remove('focused'));
        OS.topZ += 1;
        win.style.zIndex = OS.topZ;
        win.classList.add('focused');
        OS.activeWindow = win;
        updateTaskbar();
    }

    // ─── Taskbar Tabs ───
    const tabLabels = {
        about: '👤 About.exe',
        projects: '📁 Projects',
        certificates: '🏆 Certificates',
        terminal: '💻 Terminal.exe',
        games: '📁 Games',
        'game-snake': '🐍 Snake.exe',
        'game-tictactoe': '❌ TicTacToe.exe',
        'game-memory': '🧠 Memory.exe',
        'game-minesweeper': '💣 Minesweeper.exe',
        stats: '📊 Stats',
        music: '🎵 Music.mp3',
        settings: '⚙️ Settings.sys',
        gallery: '🖼️ Gallery',
        contact: '✉️ Contact.txt',
        explorer: '🗂️ Explorer.exe',
        notepad: '📝 Notepad.txt',
        calculator: '🧮 Calculator.exe',
        paint: '🎨 Paint.exe',
        calendar: '📅 Calendar.exe',
        taskmanager: '📋 Task Manager',
        browser: '🌐 Browser.exe',
        'my-games': '🕹️ My Games',
    };

    /**
     * Rebuild taskbar tabs from current window states.
     */
    function updateTaskbar() {
        OS.taskbarTabs.innerHTML = '';

        OS.windows.forEach(win => {
            const state = win.dataset.state;
            // Only show tabs for open or minimized windows (not closed)
            if (state !== 'open' && state !== 'minimized') return;

            const id = win.dataset.id;
            const tab = document.createElement('button');
            tab.className = 'taskbar-tab';
            tab.textContent = tabLabels[id] || id;

            // Highlight if this window is focused and visible
            if (state === 'open' && win.classList.contains('focused')) {
                tab.classList.add('active');
            }

            tab.addEventListener('click', () => {
                const currentState = win.dataset.state;
                if (currentState === 'minimized') {
                    restoreWindow(win);
                } else if (currentState === 'open' && win.classList.contains('focused')) {
                    minimizeWindow(win);
                } else {
                    focusWindow(win);
                }
            });

            OS.taskbarTabs.appendChild(tab);
        });
    }

    /* ─── Window control button handler ─── */
    OS.windows.forEach(win => {
        const controls = win.querySelectorAll('.win-btn');
        controls.forEach(btn => {
            // Use mousedown + stopPropagation to prevent the window's
            // own mousedown from calling focusWindow after close/minimize
            btn.addEventListener('mousedown', e => e.stopPropagation());
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

    /* ─── Expose functions for other modules ─── */
    OS.openWindow = openWindow;
    OS.closeWindow = closeWindow;
    OS.minimizeWindow = minimizeWindow;
    OS.restoreWindow = restoreWindow;
    OS.focusWindow = focusWindow;
    OS.updateTaskbar = updateTaskbar;
})();
