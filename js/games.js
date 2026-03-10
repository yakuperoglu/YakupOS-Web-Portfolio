/* ═══════════════════════════════════════════════
   GAMES MODULE — Snake, Tic-Tac-Toe, Memory
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    // Folder item clicks open individual game windows
    document.querySelectorAll('.folder-item').forEach(item => {
        item.addEventListener('dblclick', () => {
            OS.openWindow(item.dataset.window);
        });
        item.addEventListener('click', () => {
            document.querySelectorAll('.folder-item').forEach(fi => fi.style.background = '');
            item.style.background = 'rgba(124,92,252,0.12)';
            // On mobile, open immediately on single click since dblclick is hard
            if (window.YakupOS.isMobile) {
                OS.openWindow(item.dataset.window);
            }
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
