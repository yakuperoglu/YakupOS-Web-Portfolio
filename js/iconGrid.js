/* ═══════════════════════════════════════════════
   DESKTOP ICONS — grid-based drag & snap (Windows-style)
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

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
        OS.desktopIcons.forEach(icon => {
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
        OS.desktopIcons.forEach(icon => {
            const id = icon.dataset.window;
            let r = parseInt(icon.dataset.desiredRow, 10);
            let c = parseInt(icon.dataset.desiredCol, 10);
            if (isNaN(r)) {
                const cell = pixelToCell(parseInt(icon.style.top) || 0, parseInt(icon.style.left) || 0);
                r = cell.row;
                c = cell.col;
            }
            positions[id] = { row: r, col: c };
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
        // Always start from the HTML configuration (data-row / data-col).
        // Saved positions are ignored so that the desktop layout is consistent
        // with the designed default every time the site loads.
        const saved = null;
        const occupied = {};
        const iconList = Array.from(OS.desktopIcons);
        const { rows } = getGridDimensions();

        // Default column layout: stack vertically, then wrap to next column.
        // If an icon has explicit data-row / data-col attributes in HTML,
        // use those as the initial configuration on first load.
        let defaultIdx = 0;

        iconList.forEach(icon => {
            const id = icon.dataset.window;
            let row, col;

            if (saved && saved[id] != null) {
                row = saved[id].row;
                col = saved[id].col;
            } else if (icon.dataset.row != null && icon.dataset.col != null) {
                row = parseInt(icon.dataset.row, 10) || 0;
                col = parseInt(icon.dataset.col, 10) || 0;
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
            // Save natural position so window resize can expand back
            icon.dataset.desiredRow = row;
            icon.dataset.desiredCol = col;
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
        if (OS.isMobile) return;
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

            // Save new intended position manually adjusted by user
            iconDrag.el.dataset.desiredRow = freeCell.row;
            iconDrag.el.dataset.desiredCol = freeCell.col;

            placeIconAtCell(iconDrag.el, freeCell.row, freeCell.col, true);
            saveIconPositions();
        } else if (iconDrag.el) {
            // Click — open window
            OS.openWindow(iconDrag.el.dataset.window);
        }

        iconDrag.active = false;
        iconDrag.el = null;
    }

    // Attach standard click for mobile and keyboard support
    OS.desktopIcons.forEach(icon => {
        icon.addEventListener('click', e => {
            // Only open if we didn't just drag it
            if (!iconDrag.moved && !iconDrag.active) {
                OS.openWindow(icon.dataset.window);
            }
        });
        icon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                OS.openWindow(icon.dataset.window);
            }
        });
    });

    // Attach icon drag events
    const iconsContainer = document.getElementById('desktop-icons');
    iconsContainer.addEventListener('mousedown', onIconDragStart);
    document.addEventListener('mousemove', onIconDragMove);
    document.addEventListener('mouseup', onIconDragEnd);
    iconsContainer.addEventListener('touchstart', onIconDragStart, { passive: false });
    document.addEventListener('touchmove', onIconDragMove, { passive: false });
    document.addEventListener('touchend', onIconDragEnd);

    function sortIcons() {
        const occupied = {};
        const iconList = Array.from(OS.desktopIcons);
        const { rows } = getGridDimensions();
        iconList.forEach((icon, idx) => {
            const row = idx % rows;
            const col = Math.floor(idx / rows);
            occupied[row + ',' + col] = icon;
            icon.dataset.desiredRow = row;
            icon.dataset.desiredCol = col;
            placeIconAtCell(icon, row, col, true);
        });
        saveIconPositions();
    }

    OS.sortIcons = sortIcons;

    // Window resize handler for responsive grid
    let resizeTimer;
    window.addEventListener('resize', () => {
        if (OS.isMobile) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const { cols, rows } = getGridDimensions();
            const occupied = {};
            
            OS.desktopIcons.forEach(icon => {
                // Determine logical cell using natural desired row/col first
                let desiredR = parseInt(icon.dataset.desiredRow, 10);
                let desiredC = parseInt(icon.dataset.desiredCol, 10);
                
                // Fallback to current position if somehow invalid
                if (isNaN(desiredR) || isNaN(desiredC)) {
                    const cell = pixelToCell(parseInt(icon.style.top) || 0, parseInt(icon.style.left) || 0);
                    desiredR = cell.row;
                    desiredC = cell.col;
                }
                
                // Clamp cell to valid rows/cols bounds to prevent falling off screen
                let r = Math.max(0, Math.min(desiredR, rows - 1));
                let c = Math.max(0, Math.min(desiredC, cols - 1));
                
                if (occupied[r + ',' + c]) {
                    const freeCell = findNearestFreeCell(r, c, occupied);
                    r = freeCell.row;
                    c = freeCell.col;
                }
                occupied[r + ',' + c] = icon;
                placeIconAtCell(icon, r, c, true);
            });
            saveIconPositions();
        }, 200);
    });
})();
