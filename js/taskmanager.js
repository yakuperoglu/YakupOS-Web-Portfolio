/* ═══════════════════════════════════════════════
   TASK MANAGER — System Monitor
   Running processes on top + End Task support
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    const tmContent = document.getElementById('tm-content');
    if (!tmContent) return;

    // Context menu element
    let ctxMenu = null;

    function createContextMenu() {
        ctxMenu = document.createElement('div');
        ctxMenu.className = 'tm-context-menu';
        ctxMenu.innerHTML = `
            <button class="tm-ctx-item tm-ctx-end">🛑 End Task</button>
            <button class="tm-ctx-item tm-ctx-focus">🔍 Bring to Front</button>
        `;
        ctxMenu.style.display = 'none';
        document.body.appendChild(ctxMenu);

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!ctxMenu.contains(e.target)) {
                ctxMenu.style.display = 'none';
            }
        });

        return ctxMenu;
    }

    // Tab switching
    document.querySelectorAll('.tm-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tm-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tm-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById(tab.dataset.panel);
            if (panel) panel.classList.add('active');
        });
    });

    // Simulated process data
    const processes = [
        { name: 'About.exe', icon: '👤', cpu: 0, mem: 12, id: 'about' },
        { name: 'Projects', icon: '📁', cpu: 0, mem: 8, id: 'projects' },
        { name: 'Terminal.exe', icon: '💻', cpu: 2, mem: 24, id: 'terminal' },
        { name: 'Games', icon: '📁', cpu: 0, mem: 6, id: 'games' },
        { name: 'Snake.exe', icon: '🐍', cpu: 8, mem: 18, id: 'game-snake' },
        { name: 'TicTacToe.exe', icon: '❌', cpu: 1, mem: 10, id: 'game-tictactoe' },
        { name: 'Memory.exe', icon: '🧠', cpu: 1, mem: 14, id: 'game-memory' },
        { name: 'Minesweeper.exe', icon: '💣', cpu: 2, mem: 16, id: 'game-minesweeper' },
        { name: 'Music.mp3', icon: '🎵', cpu: 4, mem: 32, id: 'music' },
        { name: 'Settings.sys', icon: '⚙️', cpu: 0, mem: 10, id: 'settings' },
        { name: 'Gallery', icon: '🖼️', cpu: 1, mem: 45, id: 'gallery' },
        { name: 'Explorer.exe', icon: '🗂️', cpu: 1, mem: 15, id: 'explorer' },
        { name: 'Calculator.exe', icon: '🧮', cpu: 0, mem: 5, id: 'calculator' },
        { name: 'Notepad.txt', icon: '📝', cpu: 0, mem: 4, id: 'notepad' },
        { name: 'Stats Dashboard', icon: '📊', cpu: 3, mem: 22, id: 'stats' },
        { name: 'Contact.txt', icon: '✉️', cpu: 0, mem: 3, id: 'contact' },
        { name: 'Certificates', icon: '🏆', cpu: 0, mem: 6, id: 'certificates' },
        { name: 'Paint.exe', icon: '🎨', cpu: 5, mem: 38, id: 'paint' },
        { name: 'Calendar.exe', icon: '📅', cpu: 1, mem: 8, id: 'calendar' },
        { name: 'Browser.exe', icon: '🌐', cpu: 12, mem: 64, id: 'browser' },
        { name: 'Task Manager', icon: '📋', cpu: 2, mem: 12, id: 'taskmanager' },
        { name: 'System (yakupos)', icon: '💎', cpu: 1, mem: 28, id: '_system' },
        { name: 'WindowManager', icon: '🪟', cpu: 2, mem: 16, id: '_wm' },
        { name: 'TaskbarService', icon: '📌', cpu: 0, mem: 8, id: '_taskbar' },
    ];

    function showContextMenu(e, proc, isOpen) {
        e.stopPropagation();
        if (!ctxMenu) createContextMenu();

        // Don't show menu for suspended processes
        if (!isOpen) return;

        // Position
        ctxMenu.style.left = e.clientX + 'px';
        ctxMenu.style.top = e.clientY + 'px';
        ctxMenu.style.display = 'block';

        // Update buttons
        const endBtn = ctxMenu.querySelector('.tm-ctx-end');
        const focusBtn = ctxMenu.querySelector('.tm-ctx-focus');

        // Remove old listeners
        const newEndBtn = endBtn.cloneNode(true);
        const newFocusBtn = focusBtn.cloneNode(true);
        endBtn.parentNode.replaceChild(newEndBtn, endBtn);
        focusBtn.parentNode.replaceChild(newFocusBtn, focusBtn);

        const isSystem = proc.id.startsWith('_') || proc.id === 'taskmanager';

        // End Task — always visible for running processes
        newEndBtn.style.display = 'block';
        newEndBtn.addEventListener('click', () => {
            ctxMenu.style.display = 'none';

            if (isSystem) {
                // Show confirmation dialog for system processes
                showSystemDialog(proc.name);
            } else {
                // Normal end task
                const win = document.querySelector(`.window[data-id="${proc.id}"]`);
                if (win) OS.closeWindow(win);
                setTimeout(update, 100);
            }
        });

        // Bring to Front — only for non-system
        newFocusBtn.style.display = isSystem ? 'none' : 'block';
        if (!isSystem) {
            newFocusBtn.addEventListener('click', () => {
                const win = document.querySelector(`.window[data-id="${proc.id}"]`);
                if (win && win.dataset.state === 'minimized') {
                    OS.restoreWindow(win);
                } else if (win) {
                    OS.focusWindow(win);
                }
                ctxMenu.style.display = 'none';
            });
        }
    }

    // System process End Task dialog
    function showSystemDialog(processName) {
        // Remove any existing dialog
        const existing = document.querySelector('.tm-dialog-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'tm-dialog-overlay';
        overlay.innerHTML = `
            <div class="tm-dialog">
                <div class="tm-dialog-icon">⚠️</div>
                <div class="tm-dialog-title">Sistemi Sonlandır</div>
                <div class="tm-dialog-text"><strong>${processName}</strong> sistem sürecidir.<br>Sonlandırmak istediğinize emin misiniz?</div>
                <div class="tm-dialog-buttons">
                    <button class="tm-dialog-btn tm-dialog-cancel">İptal</button>
                    <button class="tm-dialog-btn tm-dialog-confirm">Evet, Sonlandır</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Cancel
        overlay.querySelector('.tm-dialog-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        // Confirm → Access denied
        overlay.querySelector('.tm-dialog-confirm').addEventListener('click', () => {
            const dialog = overlay.querySelector('.tm-dialog');
            dialog.innerHTML = `
                <div class="tm-dialog-icon">🛑</div>
                <div class="tm-dialog-title">Erişim Reddedildi</div>
                <div class="tm-dialog-text"><strong>${processName}</strong> sonlandırılamadı.<br>Bu işlem için yetkiniz yok.</div>
                <div class="tm-dialog-buttons">
                    <button class="tm-dialog-btn tm-dialog-cancel">Tamam</button>
                </div>
            `;
            dialog.querySelector('.tm-dialog-cancel').addEventListener('click', () => {
                overlay.remove();
            });
        });

        // Click overlay to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    function renderProcesses() {
        const container = document.getElementById('tm-process-list');
        if (!container) return;
        container.innerHTML = '';

        // Check which windows are actually open
        const openWindows = new Set();
        OS.windows.forEach(w => {
            if (w.dataset.state === 'open' || w.dataset.state === 'minimized') {
                openWindows.add(w.dataset.id);
            }
        });

        let totalCpu = 0, totalMem = 0;
        let runningCount = 0, suspendedCount = 0;

        // Build process entries with computed status
        const entries = processes.map(proc => {
            const cpuJitter = proc.cpu + Math.floor(Math.random() * 3);
            const memJitter = proc.mem + Math.floor(Math.random() * 5);
            const isOpen = proc.id.startsWith('_') || openWindows.has(proc.id);

            totalCpu += cpuJitter;
            totalMem += memJitter;

            if (isOpen) runningCount++; else suspendedCount++;

            return { ...proc, cpuJitter, memJitter, isOpen };
        });

        // Sort: running first, then suspended
        entries.sort((a, b) => {
            if (a.isOpen && !b.isOpen) return -1;
            if (!a.isOpen && b.isOpen) return 1;
            return 0;
        });

        entries.forEach(proc => {
            const row = document.createElement('div');
            row.className = 'tm-process-row' + (proc.isOpen ? ' tm-running' : ' tm-suspended');
            row.innerHTML = `
                <div class="tm-process-name">
                    <span class="tm-process-status ${proc.isOpen ? '' : 'idle'}"></span>
                    <span class="tm-process-icon">${proc.icon}</span>
                    <span>${proc.name}</span>
                </div>
                <div>${proc.isOpen ? proc.cpuJitter + '%' : '0%'}</div>
                <div>${proc.memJitter} MB</div>
                <div>${proc.isOpen ? 'Running' : 'Suspended'}</div>
            `;

            // Right-click or click to show context menu
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, proc, proc.isOpen);
            });

            row.addEventListener('click', (e) => {
                showContextMenu(e, proc, proc.isOpen);
            });

            row.style.cursor = 'pointer';
            container.appendChild(row);
        });

        // Update counts
        const countEl = document.getElementById('tm-process-count');
        if (countEl) countEl.textContent = `Processes: ${entries.length} (${runningCount} running)`;
        const uptimeEl = document.getElementById('tm-uptime');
        if (uptimeEl) {
            const elapsed = Math.floor((Date.now() - performance.timeOrigin) / 1000);
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            uptimeEl.textContent = `Uptime: ${m}m ${s}s`;
        }

        return { totalCpu: Math.min(totalCpu, 100), totalMem };
    }

    function renderPerformance(stats) {
        const cpuValueEl = document.getElementById('tm-cpu-value');
        const memValueEl = document.getElementById('tm-mem-value');
        const cpuFillEl = document.getElementById('tm-cpu-fill');
        const memFillEl = document.getElementById('tm-mem-fill');
        const cpuSubEl = document.getElementById('tm-cpu-sub');
        const memSubEl = document.getElementById('tm-mem-sub');

        if (!cpuValueEl) return;

        const cpuPct = Math.min(stats.totalCpu, 98);
        const totalMem = 512;
        const memPct = Math.min(Math.round((stats.totalMem / totalMem) * 100), 95);

        cpuValueEl.textContent = cpuPct + '%';
        memValueEl.textContent = stats.totalMem + ' MB';
        cpuFillEl.style.width = cpuPct + '%';
        memFillEl.style.width = memPct + '%';
        cpuSubEl.textContent = `${cpuPct}% utilization`;
        memSubEl.textContent = `${stats.totalMem}/${totalMem} MB (${memPct}%)`;

        if (cpuPct > 70) cpuFillEl.classList.add('warning');
        else cpuFillEl.classList.remove('warning');
        if (memPct > 80) memFillEl.classList.add('warning');
        else memFillEl.classList.remove('warning');
    }

    function update() {
        const stats = renderProcesses();
        if (stats) renderPerformance(stats);
    }

    // Initial render and periodic updates
    update();
    setInterval(update, 2000);
})();
