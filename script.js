/* ═══════════════════════════════════════════════════════════════
   YakupOS — Retro-Futuristic Portfolio
   Vanilla JavaScript: Window Manager, Drag System, Taskbar,
   Clock, Start Menu, Boot Screen, Mobile Responsive Handler
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─── DOM References ─── */
    const desktop = document.getElementById('desktop');
    const bootScreen = document.getElementById('boot-screen');
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    const taskbarTabs = document.getElementById('taskbar-tabs');
    const clockEl = document.getElementById('clock');
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    const windows = document.querySelectorAll('.window');
    const startMenuItems = document.querySelectorAll('.start-menu-item');

    /* ─── State ─── */
    let topZ = 100;                     // z-index counter for stacking
    let isMobile = false;               // mobile flag, set by media query
    let activeWindow = null;            // currently focused window ref

    // Drag state
    const drag = {
        active: false,
        el: null,
        startX: 0,
        startY: 0,
        elStartX: 0,
        elStartY: 0,
    };

    /* ═══════════════════════════════════════════════
       BOOT SCREEN
       ═══════════════════════════════════════════════ */
    function dismissBoot() {
        bootScreen.classList.add('hidden');
        // Open about window after boot finishes on desktop
        if (!isMobile) {
            setTimeout(() => openWindow('about'), 400);
        }
    }

    // Dismiss boot screen after progress bar animation (~2.2s)
    setTimeout(dismissBoot, 2400);

    /* ═══════════════════════════════════════════════
       WINDOW MANAGER
       Uses data-state attribute for reliable state tracking:
       - 'open'      → visible on desktop
       - 'minimized' → hidden but still in taskbar
       - (absent)    → closed / never opened
       ═══════════════════════════════════════════════ */

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
        if (activeWindow === win) activeWindow = null;

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
        if (activeWindow === win) activeWindow = null;

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

        windows.forEach(w => w.classList.remove('focused'));
        topZ += 1;
        win.style.zIndex = topZ;
        win.classList.add('focused');
        activeWindow = win;
        updateTaskbar();
    }

    /* ─── Window control button handler ─── */
    windows.forEach(win => {
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

    /* ═══════════════════════════════════════════════
       DRAG SYSTEM — mouse & touch on title bars
       ═══════════════════════════════════════════════ */

    function onDragStart(e) {
        if (isMobile) return;
        const titlebar = e.target.closest('[data-drag-handle]');
        if (!titlebar) return;
        const win = titlebar.closest('.window');
        if (!win || win.classList.contains('maximized')) return;

        e.preventDefault();
        drag.active = true;
        drag.el = win;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        drag.startX = clientX;
        drag.startY = clientY;
        drag.elStartX = win.offsetLeft;
        drag.elStartY = win.offsetTop;
        drag.rafId = null;

        // GPU-accelerate and disable transitions during drag
        win.classList.add('dragging');
        focusWindow(win);
        document.body.style.cursor = 'grabbing';
    }

    function onDragMove(e) {
        if (!drag.active || !drag.el) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Store target position, defer actual DOM update to rAF
        drag.targetX = drag.elStartX + (clientX - drag.startX);
        drag.targetY = drag.elStartY + (clientY - drag.startY);

        if (!drag.rafId) {
            drag.rafId = requestAnimationFrame(applyDragPosition);
        }
    }

    /**
     * Apply drag position inside rAF for smooth, jank-free movement.
     */
    function applyDragPosition() {
        drag.rafId = null;
        if (!drag.active || !drag.el) return;

        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        const newX = Math.max(-drag.el.offsetWidth + 80, Math.min(drag.targetX, maxX));
        const newY = Math.max(0, Math.min(drag.targetY, maxY));

        drag.el.style.left = newX + 'px';
        drag.el.style.top = newY + 'px';
    }

    function onDragEnd() {
        if (drag.el) {
            drag.el.classList.remove('dragging');
        }
        if (drag.rafId) {
            cancelAnimationFrame(drag.rafId);
            drag.rafId = null;
        }
        drag.active = false;
        drag.el = null;
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

    /* ═══════════════════════════════════════════════
       DESKTOP ICONS — grid-based drag & snap (Windows-style)
       ═══════════════════════════════════════════════ */

    // Grid configuration
    const GRID = {
        cellW: 90,      // cell width  (icon width ~80px + gap)
        cellH: 100,     // cell height (icon height ~90px + gap)
        padX: 20,       // left padding
        padY: 20,       // top padding
    };

    /**
     * Compute how many columns/rows the grid can fit based on viewport.
     */
    function getGridDimensions() {
        const container = document.getElementById('desktop-icons');
        const areaW = container.offsetWidth;
        const areaH = container.offsetHeight;
        const cols = Math.max(1, Math.floor((areaW - GRID.padX) / GRID.cellW));
        const rows = Math.max(1, Math.floor((areaH - GRID.padY) / GRID.cellH));
        return { cols, rows };
    }

    /**
     * Convert a grid cell (row, col) to pixel position (top, left).
     */
    function cellToPixel(row, col) {
        return {
            top: GRID.padY + row * GRID.cellH,
            left: GRID.padX + col * GRID.cellW,
        };
    }

    /**
     * Convert a pixel position to the nearest grid cell (row, col).
     */
    function pixelToCell(top, left) {
        const col = Math.round((left - GRID.padX) / GRID.cellW);
        const row = Math.round((top - GRID.padY) / GRID.cellH);
        return { row, col };
    }

    /**
     * Get a map of occupied cells: "row,col" → icon element
     */
    function getOccupiedCells(excludeIcon) {
        const occupied = {};
        desktopIcons.forEach(icon => {
            if (icon === excludeIcon) return;
            const cell = pixelToCell(
                parseInt(icon.style.top) || 0,
                parseInt(icon.style.left) || 0
            );
            occupied[cell.row + ',' + cell.col] = icon;
        });
        return occupied;
    }

    /**
     * Find the nearest free cell to the target (row, col).
     * Searches in expanding Manhattan distance.
     */
    function findNearestFreeCell(targetRow, targetCol, occupied) {
        const { cols, rows } = getGridDimensions();

        // Clamp target to valid range
        targetRow = Math.max(0, Math.min(targetRow, rows - 1));
        targetCol = Math.max(0, Math.min(targetCol, cols - 1));

        // Check target cell first
        if (!occupied[targetRow + ',' + targetCol]) {
            return { row: targetRow, col: targetCol };
        }

        // Expanding search
        const maxDist = rows + cols;
        for (let dist = 1; dist <= maxDist; dist++) {
            for (let dr = -dist; dr <= dist; dr++) {
                for (let dc = -dist; dc <= dist; dc++) {
                    if (Math.abs(dr) + Math.abs(dc) !== dist) continue;
                    const r = targetRow + dr;
                    const c = targetCol + dc;
                    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                    if (!occupied[r + ',' + c]) {
                        return { row: r, col: c };
                    }
                }
            }
        }
        // Fallback (shouldn't happen unless grid is fully packed)
        return { row: targetRow, col: targetCol };
    }

    /**
     * Place an icon at a specific cell with optional snap animation.
     */
    function placeIconAtCell(icon, row, col, animate) {
        const pos = cellToPixel(row, col);
        if (animate) {
            icon.classList.add('icon-snapping');
            icon.style.top = pos.top + 'px';
            icon.style.left = pos.left + 'px';
            setTimeout(() => icon.classList.remove('icon-snapping'), 250);
        } else {
            icon.style.top = pos.top + 'px';
            icon.style.left = pos.left + 'px';
        }
    }

    // Save grid positions to localStorage (as row,col)
    function saveIconPositions() {
        const positions = {};
        desktopIcons.forEach(icon => {
            const id = icon.dataset.window;
            const cell = pixelToCell(
                parseInt(icon.style.top) || 0,
                parseInt(icon.style.left) || 0
            );
            positions[id] = { row: cell.row, col: cell.col };
        });
        try { localStorage.setItem('yakupos-icon-grid', JSON.stringify(positions)); } catch { }
    }

    // Load saved grid positions
    function loadIconGridPositions() {
        try {
            const saved = localStorage.getItem('yakupos-icon-grid');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    }

    // Set initial grid positions
    (function initIconGrid() {
        const saved = loadIconGridPositions();
        const occupied = {};
        const iconList = Array.from(desktopIcons);
        const { rows } = getGridDimensions();

        // Default column layout: stack vertically, then wrap to next column
        let defaultIdx = 0;

        iconList.forEach(icon => {
            const id = icon.dataset.window;
            let row, col;

            if (saved && saved[id] != null) {
                row = saved[id].row;
                col = saved[id].col;
            } else {
                row = defaultIdx % rows;
                col = Math.floor(defaultIdx / rows);
                defaultIdx++;
            }

            // Make sure we don't overlap
            const key = row + ',' + col;
            if (occupied[key]) {
                const free = findNearestFreeCell(row, col, occupied);
                row = free.row;
                col = free.col;
            }
            occupied[row + ',' + col] = icon;
            placeIconAtCell(icon, row, col, false);
        });
    })();

    // Icon drag state
    const iconDrag = {
        active: false,
        el: null,
        startX: 0,
        startY: 0,
        elStartX: 0,
        elStartY: 0,
        moved: false,
        rafId: null,
        targetX: 0,
        targetY: 0,
    };
    const ICON_DRAG_THRESHOLD = 5;

    function onIconDragStart(e) {
        if (isMobile) return;
        const icon = e.target.closest('.desktop-icon');
        if (!icon) return;
        if (!e.touches && e.button !== 0) return;

        e.preventDefault();
        iconDrag.active = true;
        iconDrag.el = icon;
        iconDrag.moved = false;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        iconDrag.startX = clientX;
        iconDrag.startY = clientY;
        iconDrag.elStartX = icon.offsetLeft;
        iconDrag.elStartY = icon.offsetTop;
        iconDrag.rafId = null;
    }

    function onIconDragMove(e) {
        if (!iconDrag.active || !iconDrag.el) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - iconDrag.startX;
        const dy = clientY - iconDrag.startY;

        // Only start visual drag after threshold
        if (!iconDrag.moved && Math.abs(dx) < ICON_DRAG_THRESHOLD && Math.abs(dy) < ICON_DRAG_THRESHOLD) return;

        if (!iconDrag.moved) {
            iconDrag.moved = true;
            iconDrag.el.classList.add('icon-dragging');
        }

        e.preventDefault();

        iconDrag.targetX = iconDrag.elStartX + dx;
        iconDrag.targetY = iconDrag.elStartY + dy;

        if (!iconDrag.rafId) {
            iconDrag.rafId = requestAnimationFrame(applyIconDragPosition);
        }
    }

    function applyIconDragPosition() {
        iconDrag.rafId = null;
        if (!iconDrag.active || !iconDrag.el) return;

        const container = document.getElementById('desktop-icons');
        const maxX = container.offsetWidth - iconDrag.el.offsetWidth;
        const maxY = container.offsetHeight - iconDrag.el.offsetHeight;

        const newX = Math.max(0, Math.min(iconDrag.targetX, maxX));
        const newY = Math.max(0, Math.min(iconDrag.targetY, maxY));

        iconDrag.el.style.left = newX + 'px';
        iconDrag.el.style.top = newY + 'px';
    }

    function onIconDragEnd() {
        if (iconDrag.el) {
            iconDrag.el.classList.remove('icon-dragging');
        }
        if (iconDrag.rafId) {
            cancelAnimationFrame(iconDrag.rafId);
            iconDrag.rafId = null;
        }

        if (iconDrag.moved && iconDrag.el) {
            // Snap to nearest free grid cell
            const currentTop = parseInt(iconDrag.el.style.top) || 0;
            const currentLeft = parseInt(iconDrag.el.style.left) || 0;
            const targetCell = pixelToCell(currentTop, currentLeft);
            const occupied = getOccupiedCells(iconDrag.el);
            const freeCell = findNearestFreeCell(targetCell.row, targetCell.col, occupied);

            placeIconAtCell(iconDrag.el, freeCell.row, freeCell.col, true);
            saveIconPositions();
        } else if (iconDrag.el) {
            // Click — open window
            openWindow(iconDrag.el.dataset.window);
        }

        iconDrag.active = false;
        iconDrag.el = null;
    }

    // Attach icon drag events
    const iconsContainer = document.getElementById('desktop-icons');
    iconsContainer.addEventListener('mousedown', onIconDragStart);
    document.addEventListener('mousemove', onIconDragMove);
    document.addEventListener('mouseup', onIconDragEnd);
    iconsContainer.addEventListener('touchstart', onIconDragStart, { passive: false });
    document.addEventListener('touchmove', onIconDragMove, { passive: false });
    document.addEventListener('touchend', onIconDragEnd);

    // Keyboard support
    desktopIcons.forEach(icon => {
        icon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWindow(icon.dataset.window);
            }
        });
    });

    /* ═══════════════════════════════════════════════
       TASKBAR TABS
       ═══════════════════════════════════════════════ */

    const tabLabels = {
        about: '👤 About.exe',
        projects: '📁 Projects',
        certificates: '🏆 Certificates',
        terminal: '💻 Terminal.exe',
        games: '📁 Games',
        'game-snake': '🐍 Snake.exe',
        'game-tictactoe': '❌ TicTacToe.exe',
        'game-memory': '🧠 Memory.exe',
        stats: '📊 Stats',
        music: '🎵 Music.mp3',
        settings: '⚙️ Settings.sys',
        gallery: '🖼️ Gallery',
        contact: '✉️ Contact.txt',
    };

    /**
     * Rebuild taskbar tabs from current window states.
     */
    function updateTaskbar() {
        taskbarTabs.innerHTML = '';

        windows.forEach(win => {
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

            taskbarTabs.appendChild(tab);
        });
    }

    /* ═══════════════════════════════════════════════
       START MENU
       ═══════════════════════════════════════════════ */
    function toggleStartMenu() {
        const isOpen = !startMenu.hidden;
        startMenu.hidden = isOpen;
        startBtn.classList.toggle('active', !isOpen);
        startBtn.setAttribute('aria-expanded', String(!isOpen));
    }

    startBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleStartMenu();
    });

    // Start menu items open windows
    startMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            openWindow(item.dataset.window);
            startMenu.hidden = true;
            startBtn.classList.remove('active');
            startBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close start menu when clicking outside
    document.addEventListener('click', e => {
        if (!startMenu.hidden && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.hidden = true;
            startBtn.classList.remove('active');
            startBtn.setAttribute('aria-expanded', 'false');
        }
    });

    /* ═══════════════════════════════════════════════
       LIVE CLOCK
       ═══════════════════════════════════════════════ */
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ═══════════════════════════════════════════════
       CONTACT FORM (simple handler)
       ═══════════════════════════════════════════════ */
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const btn = contactForm.querySelector('.send-btn span');
        const originalText = btn.textContent;
        btn.textContent = 'Sent! ✓';
        contactForm.reset();
        setTimeout(() => { btn.textContent = originalText; }, 2500);
    });

    /* ═══════════════════════════════════════════════
       RESPONSIVE HANDLER — desktop ↔ mobile
       ═══════════════════════════════════════════════ */
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    function handleMobileChange(e) {
        isMobile = e.matches;
        if (isMobile) {
            // Close start menu
            startMenu.hidden = true;
            startBtn.classList.remove('active');

            // Remove maximized state from open windows so they flow naturally as cards
            windows.forEach(win => {
                if (win.classList.contains('maximized')) {
                    win.classList.remove('maximized');
                }
            });
            updateTaskbar();
        }
    }

    mobileQuery.addEventListener('change', handleMobileChange);
    handleMobileChange(mobileQuery); // initial check

    /* ═══════════════════════════════════════════════
       INTERACTIVE TERMINAL
       ═══════════════════════════════════════════════ */
    const termOutput = document.getElementById('terminal-output');
    const termInput = document.getElementById('terminal-input');
    const termHistory = [];
    let historyIdx = -1;
    const bootTime = Date.now();

    /**
     * Append a styled line to the terminal output.
     * @param {string} text  - Text content (can include HTML).
     * @param {string} cls   - CSS class for styling (term-echo, term-error, etc).
     */
    function termPrint(text, cls = 'term-echo') {
        const p = document.createElement('p');
        p.className = 'term-line ' + cls;
        p.innerHTML = text;
        termOutput.appendChild(p);
        termOutput.scrollTop = termOutput.scrollHeight;
    }

    /**
     * Process a command string typed by the user.
     */
    function processCommand(raw) {
        const input = raw.trim();
        // Echo the command
        termPrint(`<span class="term-cmd">yakup@portfolio:~$</span> ${input}`, 'term-input-echo');

        if (!input) return;

        const [cmd, ...args] = input.toLowerCase().split(/\s+/);

        switch (cmd) {
            case 'help':
                termPrint('Available commands:', 'term-system');
                termPrint('  <span class="term-cmd">whoami</span>      ─  Who am I?', 'term-echo');
                termPrint('  <span class="term-cmd">skills</span>      ─  My tech stack', 'term-echo');
                termPrint('  <span class="term-cmd">projects</span>    ─  List my projects', 'term-echo');
                termPrint('  <span class="term-cmd">contact</span>     ─  How to reach me', 'term-echo');
                termPrint('  <span class="term-cmd">education</span>   ─  My education', 'term-echo');
                termPrint('  <span class="term-cmd">neofetch</span>    ─  System info', 'term-echo');
                termPrint('  <span class="term-cmd">date</span>        ─  Current date & time', 'term-echo');
                termPrint('  <span class="term-cmd">uptime</span>      ─  Session uptime', 'term-echo');
                termPrint('  <span class="term-cmd">open</span> &lt;app&gt;  ─  Open a window (about, projects, certificates, contact)', 'term-echo');
                termPrint('  <span class="term-cmd">matrix</span>      ─  😏', 'term-echo');
                termPrint('  <span class="term-cmd">clear</span>       ─  Clear terminal', 'term-echo');
                break;

            case 'whoami':
                termPrint('<span class="term-accent">Yakup Eroğlu</span>', 'term-echo');
                termPrint('Full-Stack Developer · Creative Technologist', 'term-echo');
                termPrint('Building beautiful, performant web experiences.', 'term-system');
                break;

            case 'skills':
                termPrint('┌────────────────────────────────────┐', 'term-system');
                termPrint('│  <span class="term-cyan">Frontend</span>  │  React, Next.js, CSS3  │', 'term-echo');
                termPrint('│  <span class="term-cyan">Backend</span>   │  Node.js, Python, C#   │', 'term-echo');
                termPrint('│  <span class="term-cyan">Database</span>  │  PostgreSQL, MongoDB   │', 'term-echo');
                termPrint('│  <span class="term-cyan">DevOps</span>    │  Docker, Git, CI/CD    │', 'term-echo');
                termPrint('│  <span class="term-cyan">Game Dev</span>  │  Unity, C#, 3D         │', 'term-echo');
                termPrint('│  <span class="term-cyan">Design</span>    │  Figma, UI/UX          │', 'term-echo');
                termPrint('└────────────────────────────────────┘', 'term-system');
                break;

            case 'projects':
                termPrint('<span class="term-accent">▸</span> <span class="term-cmd">Escape Room Game</span>  ─  Unity 3D puzzle game', 'term-echo');
                termPrint('<span class="term-accent">▸</span> <span class="term-cmd">Social Dare App</span>   ─  React Native social platform', 'term-echo');
                termPrint('<span class="term-accent">▸</span> <span class="term-cmd">Portfolio OS</span>      ─  This retro-futuristic desktop!', 'term-echo');
                termPrint('<span class="term-accent">▸</span> <span class="term-cmd">AI Dashboard</span>     ─  Analytics + AI insights', 'term-echo');
                termPrint('\nType <span class="term-cmd">open projects</span> to view them.', 'term-system');
                break;

            case 'contact':
                termPrint('📧  <span class="term-cyan">Email:</span>    hello@example.com', 'term-echo');
                termPrint('🐙  <span class="term-cyan">GitHub:</span>   github.com/yakuperoglu', 'term-echo');
                termPrint('💼  <span class="term-cyan">LinkedIn:</span> linkedin.com/in/yakuperoglu', 'term-echo');
                break;

            case 'education':
                termPrint('<span class="term-accent">🎓</span> Computer Engineering', 'term-echo');
                termPrint('   University — 2022–2026', 'term-system');
                break;

            case 'neofetch':
                termPrint('', 'term-echo');
                termPrint('  <span class="term-accent">████████████</span>   <span class="term-cyan">yakup</span>@<span class="term-cyan">portfolio</span>', 'term-echo');
                termPrint('  <span class="term-accent">████████████</span>   ────────────────', 'term-echo');
                termPrint('  <span class="term-accent">██</span>        <span class="term-accent">██</span>   <span class="term-cmd">OS:</span>      YakupOS v2.0.26', 'term-echo');
                termPrint('  <span class="term-accent">████████████</span>   <span class="term-cmd">Shell:</span>   yakupsh 1.0', 'term-echo');
                termPrint('  <span class="term-accent">██</span>        <span class="term-accent">██</span>   <span class="term-cmd">WM:</span>      GlassWM', 'term-echo');
                termPrint('  <span class="term-accent">████████████</span>   <span class="term-cmd">Theme:</span>   Retro-Futuristic', 'term-echo');
                termPrint('  <span class="term-accent">████████████</span>   <span class="term-cmd">Stack:</span>   HTML/CSS/JS', 'term-echo');
                termPrint('', 'term-echo');
                break;

            case 'date':
                termPrint(new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 'term-cyan');
                termPrint(new Date().toLocaleTimeString('tr-TR'), 'term-echo');
                break;

            case 'uptime': {
                const diff = Math.floor((Date.now() - bootTime) / 1000);
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                termPrint(`Session uptime: <span class="term-accent">${mins}m ${secs}s</span>`, 'term-echo');
                break;
            }

            case 'open': {
                const target = args[0];
                const validWindows = ['about', 'projects', 'certificates', 'contact', 'terminal', 'games', 'game-snake', 'game-tictactoe', 'game-memory', 'stats', 'music', 'settings', 'gallery'];
                if (!target) {
                    termPrint('Usage: open &lt;window&gt;', 'term-error');
                    termPrint('Available: ' + validWindows.join(', '), 'term-system');
                } else if (validWindows.includes(target)) {
                    openWindow(target);
                    termPrint(`Opened <span class="term-cmd">${target}</span>`, 'term-success');
                } else {
                    termPrint(`Unknown window: "${target}"`, 'term-error');
                    termPrint('Available: ' + validWindows.join(', '), 'term-system');
                }
                break;
            }

            case 'clear':
                termOutput.innerHTML = '';
                break;

            case 'matrix': {
                const chars = 'アイウエオカキクケコサシスセソ01';
                for (let i = 0; i < 8; i++) {
                    let line = '';
                    for (let j = 0; j < 42; j++) {
                        line += chars[Math.floor(Math.random() * chars.length)];
                    }
                    termPrint(line, 'term-success');
                }
                termPrint('\n<span class="term-accent">Wake up, Neo...</span>', 'term-echo');
                break;
            }

            case 'sudo':
                termPrint('🚫 Permission denied. Nice try though!', 'term-error');
                break;

            case 'exit':
                termPrint('Closing terminal...', 'term-system');
                setTimeout(() => closeWindow(document.getElementById('window-terminal')), 500);
                break;

            default:
                termPrint(`Command not found: <span class="term-error">${cmd}</span>`, 'term-error');
                termPrint('Type <span class="term-cmd">help</span> for available commands.', 'term-system');
        }
    }

    // Terminal input handler
    if (termInput) {
        termInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const val = termInput.value;
                if (val.trim()) {
                    termHistory.push(val);
                    historyIdx = termHistory.length;
                }
                processCommand(val);
                termInput.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIdx > 0) {
                    historyIdx--;
                    termInput.value = termHistory[historyIdx];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIdx < termHistory.length - 1) {
                    historyIdx++;
                    termInput.value = termHistory[historyIdx];
                } else {
                    historyIdx = termHistory.length;
                    termInput.value = '';
                }
            }
        });

        // Auto-focus terminal input when terminal window is clicked
        const terminalWin = document.getElementById('window-terminal');
        if (terminalWin) {
            terminalWin.addEventListener('click', () => {
                termInput.focus();
            });
        }
    }

    /* ═══════════════════════════════════════════════
       GAMES MODULE — Snake, Tic-Tac-Toe, Memory
       ═══════════════════════════════════════════════ */
    (function initGames() {
        // Folder item clicks open individual game windows
        document.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                openWindow(item.dataset.window);
            });
            item.addEventListener('click', () => {
                // Visual selection on single click
                document.querySelectorAll('.folder-item').forEach(fi => fi.style.background = '');
                item.style.background = 'rgba(124,92,252,0.12)';
            });
        });

        /* ─── SNAKE ─── */
        const snakeCanvas = document.getElementById('snake-canvas');
        if (!snakeCanvas) return;
        const ctx = snakeCanvas.getContext('2d');
        const TILE = 20;
        const COLS = snakeCanvas.width / TILE;
        const ROWS = snakeCanvas.height / TILE;
        let snake, dir, nextDir, food, score, highScore, snakeRunning, snakeInterval;

        highScore = parseInt(localStorage.getItem('yakupos-snake-high') || '0');

        function snakeReset() {
            snake = [{ x: 5, y: 5 }];
            dir = { x: 1, y: 0 };
            nextDir = { x: 1, y: 0 };
            score = 0;
            snakeRunning = false;
            if (snakeInterval) clearInterval(snakeInterval);
            snakeInterval = null;
            placeFood();
            snakeDraw();
            updateSnakeHud();
        }

        function placeFood() {
            do {
                food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
            } while (snake.some(s => s.x === food.x && s.y === food.y));
        }

        function updateSnakeHud() {
            document.getElementById('snake-score').textContent = 'Score: ' + score;
            document.getElementById('snake-high').textContent = 'Best: ' + highScore;
        }

        function snakeDraw() {
            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

            // Grid lines
            ctx.strokeStyle = 'rgba(124,92,252,0.06)';
            ctx.lineWidth = 0.5;
            for (let x = 0; x <= snakeCanvas.width; x += TILE) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, snakeCanvas.height); ctx.stroke();
            }
            for (let y = 0; y <= snakeCanvas.height; y += TILE) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(snakeCanvas.width, y); ctx.stroke();
            }

            // Food
            ctx.fillStyle = '#ff5f57';
            ctx.shadowColor = '#ff5f57';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(food.x * TILE + TILE / 2, food.y * TILE + TILE / 2, TILE / 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Snake
            snake.forEach((seg, i) => {
                const t = i / snake.length;
                ctx.fillStyle = i === 0 ? '#7c5cfc' : `rgba(124,92,252,${1 - t * 0.6})`;
                ctx.shadowColor = '#7c5cfc';
                ctx.shadowBlur = i === 0 ? 8 : 3;
                const pad = i === 0 ? 1 : 2;
                ctx.fillRect(seg.x * TILE + pad, seg.y * TILE + pad, TILE - pad * 2, TILE - pad * 2);
            });
            ctx.shadowBlur = 0;

            // Start message
            if (!snakeRunning && score === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Click or press any key to start', snakeCanvas.width / 2, snakeCanvas.height / 2);
                ctx.textAlign = 'start';
            }
        }

        function snakeStep() {
            dir = nextDir;
            const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

            // Wall collision — wrap around
            if (head.x < 0) head.x = COLS - 1;
            if (head.x >= COLS) head.x = 0;
            if (head.y < 0) head.y = ROWS - 1;
            if (head.y >= ROWS) head.y = 0;

            // Self collision
            if (snake.some(s => s.x === head.x && s.y === head.y)) {
                snakeRunning = false;
                clearInterval(snakeInterval);
                snakeInterval = null;
                if (score > highScore) {
                    highScore = score;
                    try { localStorage.setItem('yakupos-snake-high', String(highScore)); } catch { }
                }
                updateSnakeHud();
                // Draw game over
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
                ctx.fillStyle = '#ff5f57';
                ctx.font = 'bold 20px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Game Over! Score: ' + score, snakeCanvas.width / 2, snakeCanvas.height / 2 - 10);
                ctx.fillStyle = '#aaa';
                ctx.font = '13px monospace';
                ctx.fillText('Click to restart', snakeCanvas.width / 2, snakeCanvas.height / 2 + 18);
                ctx.textAlign = 'start';
                return;
            }

            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score++;
                updateSnakeHud();
                placeFood();
            } else {
                snake.pop();
            }

            snakeDraw();
        }

        function startSnake() {
            if (snakeRunning) return;
            if (snake.length > 1 || score > 0) snakeReset();
            snakeRunning = true;
            snakeInterval = setInterval(snakeStep, 110);
        }

        snakeCanvas.addEventListener('click', () => {
            if (!snakeRunning) startSnake();
        });

        document.addEventListener('keydown', e => {
            const snakeWin = document.getElementById('window-game-snake');
            if (!snakeWin || snakeWin.dataset.state !== 'open') return;

            if (!snakeRunning) { startSnake(); return; }

            const key = e.key;
            if ((key === 'ArrowUp' || key === 'w') && dir.y !== 1) { nextDir = { x: 0, y: -1 }; e.preventDefault(); }
            if ((key === 'ArrowDown' || key === 's') && dir.y !== -1) { nextDir = { x: 0, y: 1 }; e.preventDefault(); }
            if ((key === 'ArrowLeft' || key === 'a') && dir.x !== 1) { nextDir = { x: -1, y: 0 }; e.preventDefault(); }
            if ((key === 'ArrowRight' || key === 'd') && dir.x !== -1) { nextDir = { x: 1, y: 0 }; e.preventDefault(); }
        });

        snakeReset();

        /* ─── TIC-TAC-TOE ─── */
        const tttBoard = document.getElementById('ttt-board');
        const tttStatus = document.getElementById('ttt-status');
        const tttResetBtn = document.getElementById('ttt-reset');
        let tttState, tttTurn, tttOver;

        const WINS = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        function tttReset() {
            tttState = Array(9).fill('');
            tttTurn = 'X';
            tttOver = false;
            tttStatus.textContent = 'Your turn (X)';
            tttRender();
        }

        function tttRender() {
            tttBoard.innerHTML = '';
            tttState.forEach((val, i) => {
                const cell = document.createElement('div');
                cell.className = 'ttt-cell' + (val ? ' taken ' + val.toLowerCase() : '');
                cell.textContent = val;
                cell.addEventListener('click', () => tttPlay(i));
                tttBoard.appendChild(cell);
            });
        }

        function checkWin(board, player) {
            return WINS.find(combo => combo.every(i => board[i] === player));
        }

        function tttPlay(i) {
            if (tttOver || tttState[i] || tttTurn !== 'X') return;
            tttState[i] = 'X';
            const win = checkWin(tttState, 'X');
            if (win) {
                tttOver = true;
                tttStatus.textContent = 'You win! 🎉';
                tttRender();
                win.forEach(idx => tttBoard.children[idx].classList.add('win'));
                return;
            }
            if (tttState.every(c => c)) {
                tttOver = true;
                tttStatus.textContent = "It's a draw!";
                tttRender();
                return;
            }
            tttTurn = 'O';
            tttStatus.textContent = 'AI thinking...';
            tttRender();
            setTimeout(tttAI, 350);
        }

        function tttAI() {
            // Simple minimax
            function minimax(board, player, depth) {
                const xWin = checkWin(board, 'X');
                const oWin = checkWin(board, 'O');
                if (xWin) return -10 + depth;
                if (oWin) return 10 - depth;
                if (board.every(c => c)) return 0;

                const moves = [];
                board.forEach((c, i) => {
                    if (!c) {
                        board[i] = player;
                        const s = minimax(board, player === 'O' ? 'X' : 'O', depth + 1);
                        moves.push({ i, s });
                        board[i] = '';
                    }
                });

                if (player === 'O') return Math.max(...moves.map(m => m.s));
                return Math.min(...moves.map(m => m.s));
            }

            let bestScore = -Infinity, bestMove = -1;
            tttState.forEach((c, i) => {
                if (!c) {
                    tttState[i] = 'O';
                    const s = minimax(tttState, 'X', 0);
                    tttState[i] = '';
                    if (s > bestScore) { bestScore = s; bestMove = i; }
                }
            });

            if (bestMove >= 0) tttState[bestMove] = 'O';
            const win = checkWin(tttState, 'O');
            if (win) {
                tttOver = true;
                tttStatus.textContent = 'AI wins! 🤖';
                tttRender();
                win.forEach(idx => tttBoard.children[idx].classList.add('win'));
                return;
            }
            if (tttState.every(c => c)) {
                tttOver = true;
                tttStatus.textContent = "It's a draw!";
                tttRender();
                return;
            }
            tttTurn = 'X';
            tttStatus.textContent = 'Your turn (X)';
            tttRender();
        }

        tttResetBtn.addEventListener('click', tttReset);
        tttReset();

        /* ─── MEMORY CARD GAME ─── */
        const memBoard = document.getElementById('mem-board');
        const memMovesEl = document.getElementById('mem-moves');
        const memPairsEl = document.getElementById('mem-pairs');
        const memResetBtn = document.getElementById('mem-reset');
        const EMOJIS = ['🚀', '🌟', '🔥', '🌺', '🌻', '🌜', '🦄', '💎'];
        let memCards, memFlipped, memMatched, memMoves, memLocked;

        function memReset() {
            const pairs = [...EMOJIS, ...EMOJIS];
            // Shuffle
            for (let i = pairs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
            }
            memCards = pairs;
            memFlipped = [];
            memMatched = new Set();
            memMoves = 0;
            memLocked = false;
            memRender();
            memUpdateHud();
        }

        function memUpdateHud() {
            memMovesEl.textContent = 'Moves: ' + memMoves;
            memPairsEl.textContent = 'Pairs: ' + (memMatched.size / 2) + '/8';
        }

        function memRender() {
            memBoard.innerHTML = '';
            memCards.forEach((emoji, i) => {
                const card = document.createElement('div');
                card.className = 'mem-card';
                if (memFlipped.includes(i) || memMatched.has(i)) {
                    card.textContent = emoji;
                    card.classList.add('flipped');
                } else {
                    card.textContent = '?';
                }
                if (memMatched.has(i)) card.classList.add('matched');
                card.addEventListener('click', () => memFlip(i));
                memBoard.appendChild(card);
            });
        }

        function memFlip(i) {
            if (memLocked || memFlipped.includes(i) || memMatched.has(i)) return;
            memFlipped.push(i);
            memRender();

            if (memFlipped.length === 2) {
                memMoves++;
                memUpdateHud();
                const [a, b] = memFlipped;
                if (memCards[a] === memCards[b]) {
                    memMatched.add(a);
                    memMatched.add(b);
                    memFlipped = [];
                    memRender();
                    memUpdateHud();
                    if (memMatched.size === memCards.length) {
                        memPairsEl.textContent = '🎉 Complete!';
                    }
                } else {
                    memLocked = true;
                    setTimeout(() => {
                        memFlipped = [];
                        memLocked = false;
                        memRender();
                    }, 700);
                }
            }
        }

        memResetBtn.addEventListener('click', memReset);
        memReset();
    })();

    /* ═══════════════════════════════════════════════
       STATS DASHBOARD MODULE
       ═══════════════════════════════════════════════ */
    (function initStats() {
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

    /* ═══════════════════════════════════════════════
       MUSIC PLAYER MODULE
       ═══════════════════════════════════════════════ */
    (function initMusic() {
        const playBtn = document.getElementById('music-play');
        const prevBtn = document.getElementById('music-prev');
        const nextBtn = document.getElementById('music-next');
        const progFill = document.getElementById('music-progress-fill');
        const currTimeEl = document.getElementById('music-current');
        const durTimeEl = document.getElementById('music-duration');
        const volSlider = document.getElementById('music-volume');
        const trackNameEl = document.getElementById('music-track-name');
        const playlistItems = document.querySelectorAll('.playlist-item');

        if (!playBtn) return;

        let isPlaying = false;
        let progress = 0;
        let currentTrack = 0;
        let progressInterval;
        let audioCtx;
        let nextNoteTime = 0;
        let currentNote = 0;
        let schedulerId;

        // Simple 8-bit melodies [midi_note, duration_in_16ths]
        const melodies = [
            // Retro Vibes
            [[60, 2], [63, 2], [67, 2], [72, 2], [67, 2], [63, 2], [60, 2], [55, 2]],
            // Neon Dreams
            [[55, 4], [58, 4], [62, 4], [67, 4], [62, 4], [58, 4]],
            // Cyber Drift
            [[48, 2], [48, 2], [60, 2], [48, 2], [63, 2], [60, 2], [65, 2], [63, 2]],
            // Pixel Sunset
            [[72, 4], [71, 4], [67, 4], [64, 4], [67, 8]],
            // Digital Rain
            [[84, 1], [83, 1], [79, 1], [76, 1], [72, 1], [67, 1], [64, 1], [60, 1]],
            // Synthwave Drive
            [[60, 2], [60, 2], [63, 2], [65, 2], [67, 4], [65, 2], [63, 2]],
            // Arcade Boss
            [[45, 1], [48, 1], [51, 1], [54, 1], [57, 1], [60, 1], [63, 1], [66, 4]],
            // Cosmic Journey
            [[72, 2], [79, 2], [76, 4], [74, 2], [72, 2], [71, 4]],
            // Midnight City
            [[55, 2], [62, 2], [67, 2], [74, 2], [79, 4], [74, 4]],
            // 8-Bit Hero
            [[60, 2], [64, 2], [67, 2], [72, 4], [72, 2], [76, 4]]
        ];

        const tracks = [
            { name: 'Retro Vibes', duration: '3:24', time: 204 },
            { name: 'Neon Dreams', duration: '4:12', time: 252 },
            { name: 'Cyber Drift', duration: '2:58', time: 178 },
            { name: 'Pixel Sunset', duration: '3:45', time: 225 },
            { name: 'Digital Rain', duration: '5:01', time: 301 },
            { name: 'Synthwave Drive', duration: '4:30', time: 270 },
            { name: 'Arcade Boss', duration: '2:45', time: 165 },
            { name: 'Cosmic Journey', duration: '5:15', time: 315 },
            { name: 'Midnight City', duration: '3:55', time: 235 },
            { name: '8-Bit Hero', duration: '2:30', time: 150 }
        ];

        function formatTime(secs) {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }

        function midiToFreq(m) {
            return Math.pow(2, (m - 69) / 12) * 440;
        }

        function playNote(midi, time, duration) {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            // Retro waves
            osc.type = (currentTrack % 2 === 0) ? 'square' : 'sawtooth';
            osc.frequency.value = midiToFreq(midi);

            const baseVol = parseInt(volSlider.value) / 100;
            const vol = baseVol * 0.15; // Keep it quiet

            gainNode.gain.setValueAtTime(vol, time);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start(time);
            osc.stop(time + duration);
        }

        function scheduler() {
            if (!isPlaying) return;
            while (nextNoteTime < audioCtx.currentTime + 0.1) {
                const seq = melodies[currentTrack % melodies.length];
                const note = seq[currentNote % seq.length];
                const noteDuration = note[1] * 0.13; // tempo

                playNote(note[0], nextNoteTime, noteDuration);

                nextNoteTime += noteDuration;
                currentNote++;
            }
            schedulerId = requestAnimationFrame(scheduler);
        }

        function updateTrackUI() {
            trackNameEl.textContent = tracks[currentTrack].name;
            durTimeEl.textContent = tracks[currentTrack].duration;
            playlistItems.forEach(item => item.classList.remove('active'));
            if (playlistItems[currentTrack]) playlistItems[currentTrack].classList.add('active');
            progress = 0;
            progFill.style.width = '0%';
            currTimeEl.textContent = '0:00';
            currentNote = 0;
            if (isPlaying) {
                nextNoteTime = audioCtx.currentTime + 0.1;
            }
        }

        function startPlaying() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();

            isPlaying = true;
            playBtn.textContent = '⏸';
            nextNoteTime = audioCtx.currentTime + 0.1;
            scheduler();

            progressInterval = setInterval(() => {
                progress += 1;
                if (progress >= tracks[currentTrack].time) {
                    nextTrack();
                } else {
                    progFill.style.width = (progress / tracks[currentTrack].time * 100) + '%';
                    currTimeEl.textContent = formatTime(progress);
                }
            }, 1000);

            document.getElementById('music-visualizer').style.animationPlayState = 'running';
        }

        function pausePlaying() {
            isPlaying = false;
            playBtn.textContent = '▶';
            clearInterval(progressInterval);
            cancelAnimationFrame(schedulerId);
            document.getElementById('music-visualizer').style.animationPlayState = 'paused';
        }

        // Seek functionality
        const progressBar = document.getElementById('music-progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                const percentage = Math.max(0, Math.min(1, clickX / width));

                progress = Math.floor(percentage * tracks[currentTrack].time);
                progFill.style.width = (percentage * 100) + '%';
                currTimeEl.textContent = formatTime(progress);

                // Recalculate roughly where we are in the sequence for note playback
                if (audioCtx) {
                    const seq = melodies[currentTrack % melodies.length];
                    const totalSeqDuration = seq.reduce((acc, note) => acc + (note[1] * 0.13), 0);
                    const timeInSeq = progress % totalSeqDuration;

                    let timeAccum = 0;
                    currentNote = 0;
                    while (timeAccum < timeInSeq && currentNote < seq.length) {
                        timeAccum += seq[currentNote][1] * 0.13;
                        currentNote++;
                    }
                    if (isPlaying) {
                        nextNoteTime = audioCtx.currentTime + 0.1;
                    }
                }
            });
        }

        // Initially pause visualizer
        const viz = document.getElementById('music-visualizer');
        if (viz) viz.style.animationPlayState = 'paused';

        playBtn.addEventListener('click', () => {
            if (isPlaying) pausePlaying();
            else startPlaying();
        });

        function nextTrack() {
            currentTrack = (currentTrack + 1) % tracks.length;
            updateTrackUI();
        }

        function prevTrack() {
            currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
            updateTrackUI();
        }

        nextBtn.addEventListener('click', nextTrack);
        prevBtn.addEventListener('click', prevTrack);

        const allIcons = document.querySelectorAll('.playlist-item');

        allIcons.forEach(item => {
            item.addEventListener('click', () => {
                currentTrack = parseInt(item.dataset.track);
                updateTrackUI();
                if (!isPlaying) startPlaying();
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    currentTrack = parseInt(item.dataset.track);
                    updateTrackUI();
                    if (!isPlaying) startPlaying();
                }
            });
        });

        // Stop playing when the music window is closed
        const musicWin = document.getElementById('window-music');
        if (musicWin) {
            const observer = new MutationObserver(() => {
                if (!musicWin.dataset.state && isPlaying) {
                    pausePlaying();
                }
            });
            observer.observe(musicWin, { attributes: true, attributeFilter: ['data-state'] });
        }
    })();

    /* ═══════════════════════════════════════════════
       SETTINGS MODULE
       ═══════════════════════════════════════════════ */
    (function initSettings() {
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

    /* ═══════════════════════════════════════════════
       GALLERY & LIGHTBOX MODULE
       ═══════════════════════════════════════════════ */
    (function initGallery() {
        const modal = document.getElementById('lightbox-modal');
        const imgEl = document.getElementById('lightbox-img');
        const captionEl = document.getElementById('lightbox-caption');
        const closeBtn = document.getElementById('lightbox-close');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        const galleryItems = document.querySelectorAll('.gallery-item');

        if (!modal) return;

        let currentIndex = 0;
        const images = [];

        // Collect all images data
        galleryItems.forEach((item, index) => {
            const img = item.querySelector('img');
            const caption = item.querySelector('.gallery-caption');
            if (img) {
                images.push({
                    src: img.src,
                    caption: caption ? caption.textContent : ''
                });

                // Add click listener to open lightbox
                item.addEventListener('click', () => {
                    openLightbox(index);
                });
                // Keyboard support
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLightbox(index);
                    }
                });
            }
        });

        function openLightbox(index) {
            currentIndex = index;
            updateLightboxContent();
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            closeBtn.focus();
        }

        function closeLightbox() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            // Return focus to the item that opened it
            if (galleryItems[currentIndex]) {
                galleryItems[currentIndex].focus();
            }
        }

        function updateLightboxContent() {
            if (!images[currentIndex]) return;
            imgEl.src = images[currentIndex].src;
            captionEl.textContent = images[currentIndex].caption;
        }

        function showNext() {
            currentIndex = (currentIndex + 1) % images.length;
            updateLightboxContent();
        }

        function showPrev() {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            updateLightboxContent();
        }

        closeBtn.addEventListener('click', closeLightbox);
        nextBtn.addEventListener('click', showNext);
        prevBtn.addEventListener('click', showPrev);

        // Click outside image to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLightbox();
            }
        });

        // Keyboard navigation in modal
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'ArrowLeft') showPrev();
        });
    })();

})();
