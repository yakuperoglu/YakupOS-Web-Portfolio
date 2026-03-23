const assert = require('assert');

let icons = [
    { dataset: { window: 'a' }, style: {} },
    { dataset: { window: 'b' }, style: {} }
];

let GRID = { cellW: 90, cellH: 100, padX: 20, padY: 20 };

function getGridDimensions(w, h) {
    const cols = Math.max(1, Math.floor((w - GRID.padX) / GRID.cellW));
    const rows = Math.max(1, Math.floor((h - GRID.padY) / GRID.cellH));
    return { cols, rows };
}

function pixelToCell(top, left) {
    const col = Math.round((left - GRID.padX) / GRID.cellW);
    const row = Math.round((top - GRID.padY) / GRID.cellH);
    return { row, col };
}

function cellToPixel(row, col) {
    return {
        top: GRID.padY + row * GRID.cellH,
        left: GRID.padX + col * GRID.cellW,
    };
}

function findNearestFreeCell(targetRow, targetCol, occupied, rows, cols) {
    targetRow = Math.max(0, Math.min(targetRow, rows - 1));
    targetCol = Math.max(0, Math.min(targetCol, cols - 1));
    if (!occupied[targetRow + ',' + targetCol]) {
        return { row: targetRow, col: targetCol };
    }
    const maxDist = rows + cols;
    for (let dist = 1; dist <= maxDist; dist++) {
        for (let dr = -dist; dr <= dist; dr++) {
            for (let dc = -dist; dc <= dist; dc++) {
                if (Math.abs(dr) + Math.abs(dc) !== dist) continue;
                const r = targetRow + dr;
                const c = targetCol + dc;
                if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                if (!occupied[r + ',' + c]) return { row: r, col: c };
            }
        }
    }
    return { row: targetRow, col: targetCol };
}

function simulateResize(w, h) {
    const { cols, rows } = getGridDimensions(w, h);
    const occupied = {};
    icons.forEach(icon => {
        let desiredR = parseInt(icon.dataset.desiredRow, 10);
        let desiredC = parseInt(icon.dataset.desiredCol, 10);
        let r = Math.max(0, Math.min(desiredR, rows - 1));
        let c = Math.max(0, Math.min(desiredC, cols - 1));
        if (occupied[r + ',' + c]) {
            const freeCell = findNearestFreeCell(r, c, occupied, rows, cols);
            r = freeCell.row;
            c = freeCell.col;
        }
        occupied[r + ',' + c] = icon;
        let pos = cellToPixel(r, c);
        icon.style.top = pos.top + "px";
        icon.style.left = pos.left + "px";
        icon.currentRow = r;
        icon.currentCol = c;
    });
}

// Init
icons[0].dataset.desiredRow = 0; icons[0].dataset.desiredCol = 14;
icons[1].dataset.desiredRow = 1; icons[1].dataset.desiredCol = 14;

// large screen
simulateResize(1920, 1080);
console.log("Large:", icons.map(i => [i.currentRow, i.currentCol]));

// small screen
simulateResize(300, 300);
console.log("Small:", icons.map(i => [i.currentRow, i.currentCol]));

// large screen again
simulateResize(1920, 1080);
console.log("Large again:", icons.map(i => [i.currentRow, i.currentCol]));

