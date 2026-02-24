/* ═══════════════════════════════════════════════
   MINESWEEPER MODULE
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const boardEl = document.getElementById('mine-board');
    const flagEl = document.getElementById('mine-flag-count');
    const timerEl = document.getElementById('mine-timer');
    const resetBtn = document.getElementById('mine-reset');
    if (!boardEl) return;

    const ROWS = 10;
    const COLS = 10;
    const MINES = 10;
    let board = [];
    let flags = 0;
    let minesLeft = MINES;
    let timer = 0;
    let timerInterval = null;
    let isGameOver = false;
    let isFirstClick = true;
    let revealedCount = 0;

    function formatHUD(num) {
        if (num < 0) return '-' + String(Math.abs(num)).padStart(2, '0');
        return String(num).padStart(3, '0');
    }

    function createBoard() {
        boardEl.innerHTML = '';
        board = [];
        for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
                const el = document.createElement('div');
                el.className = 'mine-cell';
                el.dataset.r = r;
                el.dataset.c = c;

                el.addEventListener('mousedown', (e) => {
                    if (e.button === 0) handleLeftClick(r, c);
                    if (e.button === 2) handleRightClick(r, c);
                });

                // Prevent context menu
                el.addEventListener('contextmenu', e => e.preventDefault());

                boardEl.appendChild(el);
                row.push({
                    r, c, el,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                });
            }
            board.push(row);
        }
    }

    function placeMines(firstR, firstC) {
        let placed = 0;
        while (placed < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            // Don't place mine on first click or if already a mine
            if (!board[r][c].isMine && (Math.abs(r - firstR) > 1 || Math.abs(c - firstC) > 1)) {
                board[r][c].isMine = true;
                placed++;
            }
        }
        // Calculate neighbors
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (!board[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    board[r][c].neighborMines = count;
                }
            }
        }
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer++;
            if (timer > 999) timer = 999;
            timerEl.textContent = formatHUD(timer);
        }, 1000);
    }

    function handleLeftClick(r, c) {
        if (isGameOver || board[r][c].isFlagged || board[r][c].isRevealed) return;

        if (isFirstClick) {
            isFirstClick = false;
            placeMines(r, c);
            startTimer();
        }

        const cell = board[r][c];

        if (cell.isMine) {
            gameOver(false);
            cell.el.classList.add('boom');
            return;
        }

        revealCell(r, c);
        checkWin();
    }

    function handleRightClick(r, c) {
        if (isGameOver || board[r][c].isRevealed) return;
        const cell = board[r][c];

        if (cell.isFlagged) {
            cell.isFlagged = false;
            cell.el.textContent = '';
            cell.el.classList.remove('flagged');
            minesLeft++;
        } else {
            cell.isFlagged = true;
            cell.el.textContent = '🚩';
            cell.el.classList.add('flagged');
            minesLeft--;
        }
        flagEl.textContent = formatHUD(minesLeft);
    }

    function revealCell(r, c) {
        const cell = board[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        revealedCount++;
        cell.el.classList.add('revealed');

        if (cell.neighborMines > 0) {
            cell.el.textContent = cell.neighborMines;
            cell.el.classList.add(`mine-${cell.neighborMines}`);
        } else {
            // Flood fill
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        revealCell(nr, nc);
                    }
                }
            }
        }
    }

    function checkWin() {
        if (revealedCount === ROWS * COLS - MINES) {
            gameOver(true);
        }
    }

    function gameOver(win) {
        isGameOver = true;
        clearInterval(timerInterval);
        resetBtn.textContent = win ? '😎' : '😵';

        // Reveal mines
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = board[r][c];
                if (cell.isMine && !cell.isFlagged) {
                    cell.el.textContent = '💣';
                    cell.el.classList.add('revealed');
                } else if (!cell.isMine && cell.isFlagged) {
                    cell.el.textContent = '❌'; // Wrong flag
                }
            }
        }
    }

    function init() {
        isGameOver = false;
        isFirstClick = true;
        timer = 0;
        minesLeft = MINES;
        revealedCount = 0;
        if (timerInterval) clearInterval(timerInterval);
        timerEl.textContent = '000';
        flagEl.textContent = formatHUD(minesLeft);
        resetBtn.textContent = '🙂';
        createBoard();
    }

    resetBtn.addEventListener('click', init);

    // Disable global context menu in the minesweeper body
    document.querySelector('.window[data-id="game-minesweeper"] .window-body').addEventListener('contextmenu', e => e.preventDefault());

    init();
})();
