/* ═══════════════════════════════════════════════
   WEATHER WIDGET, EXPLORER, NOTEPAD, CALCULATOR
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

    /* ═══════════════════════════════════════════════
       WEATHER WIDGET MODULE
       ═══════════════════════════════════════════════ */
    (function initWeather() {
        const weatherEl = document.getElementById('weather-widget');
        const iconEl = document.getElementById('weather-icon');
        const tempEl = document.getElementById('weather-temp');
        if (!weatherEl) return;

        // Istanbul config
        const LAT = 41.0082;
        const LON = 28.9784;
        const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true`;

        const weatherIcons = {
            0: '☀️', // Clear sky
            1: '🌤️', // Mainly clear
            2: '⛅', // Partly cloudy
            3: '☁️', // Overcast
            45: '🌫️', // Fog
            48: '🌫️', // Depositing rime fog
            51: '🌧️', // Drizzle: Light
            53: '🌧️', // Drizzle: Moderate
            55: '🌧️', // Drizzle: Dense intensity
            61: '🌧️', // Rain: Slight
            63: '🌧️', // Rain: Moderate
            65: '🌧️', // Rain: Heavy intensity
            71: '❄️', // Snow fall: Slight
            73: '❄️', // Snow fall: Moderate
            75: '❄️', // Snow fall: Heavy intensity
            95: '⛈️'  // Thunderstorm
        };

        async function fetchWeather() {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                if (data && data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    const icon = weatherIcons[code] || '☁️';

                    iconEl.textContent = icon;
                    tempEl.textContent = `${temp}°`;
                    weatherEl.title = `Istanbul, ${temp}°C`;
                }
            } catch (error) {
                console.warn('Could not fetch weather data:', error);
                iconEl.textContent = '☁️';
                tempEl.textContent = '--°';
            }
        }

        fetchWeather();
        // Update every 30 minutes
        setInterval(fetchWeather, 30 * 60 * 1000);
    })();

    /* ═══════════════════════════════════════════════
       EXPLORER MODULE
       ═══════════════════════════════════════════════ */
    (function initExplorer() {
        const explorerGrid = document.getElementById('explorer-grid');
        const navItems = document.querySelectorAll('.explorer-nav-item');
        const pathEl = document.querySelector('.explorer-path');
        if (!explorerGrid) return;

        const fileSystem = {
            home: [
                { name: 'Documents', type: 'folder', icon: '📄' },
                { name: 'Games', type: 'folder', icon: '🎮' },
                { name: 'System', type: 'folder', icon: '⚙️' },
                { name: 'readme.txt', type: 'file', icon: '📝' }
            ],
            documents: [
                { name: 'Projects', type: 'folder', icon: '📁' },
                { name: 'Certificates', type: 'folder', icon: '🏆' },
                { name: 'cv.pdf', type: 'file', icon: '📋' }
            ],
            games: [
                { name: 'Snake.exe', type: 'app', icon: '🐍', appTarget: 'game-snake' },
                { name: 'TicTacToe.exe', type: 'app', icon: '❌', appTarget: 'game-tictactoe' },
                { name: 'Memory.exe', type: 'app', icon: '🧠', appTarget: 'game-memory' },
                { name: 'Minesweeper.exe', type: 'app', icon: '💣', appTarget: 'game-minesweeper' }
            ],
            system: [
                { name: 'Settings.sys', type: 'app', icon: '⚙️', appTarget: 'settings' },
                { name: 'Terminal.exe', type: 'app', icon: '💻', appTarget: 'terminal' },
                { name: 'Calculator.exe', type: 'app', icon: '🧮', appTarget: 'calculator' }
            ]
        };

        function renderFolder(pathKey) {
            const files = fileSystem[pathKey] || [];
            explorerGrid.innerHTML = '';

            let pathName = pathKey.charAt(0).toUpperCase() + pathKey.slice(1);
            pathEl.textContent = `C:\\Users\\Yakup\\${pathName}`;

            navItems.forEach(btn => btn.classList.remove('active'));
            const activeBtn = Array.from(navItems).find(btn => btn.dataset.path === pathKey);
            if (activeBtn) activeBtn.classList.add('active');

            files.forEach(item => {
                const el = document.createElement('div');
                el.className = 'folder-item';
                el.tabIndex = 0;

                const icon = document.createElement('div');
                icon.className = 'folder-item-icon';
                icon.textContent = item.icon;

                const label = document.createElement('span');
                label.className = 'folder-item-label';
                label.textContent = item.name;

                el.appendChild(icon);
                el.appendChild(label);

                el.addEventListener('click', () => handleItemClick(item, pathKey));
                el.addEventListener('keydown', e => {
                    if (e.key === 'Enter') handleItemClick(item, pathKey);
                });

                explorerGrid.appendChild(el);
            });
        }

        function handleItemClick(item, currentPath) {
            if (item.type === 'folder') {
                const targetKey = item.name.toLowerCase();
                if (fileSystem[targetKey]) {
                    renderFolder(targetKey);
                }
            } else if (item.type === 'app' && item.appTarget) {
                OS.openWindow(item.appTarget);
            } else if (item.type === 'file') {
                if (item.name === 'readme.txt') {
                    const npTextarea = document.getElementById('notepad-textarea');
                    if (npTextarea) {
                        npTextarea.value = "Welcome to YakupOS!\n\nThis is a retro modern web portfolio experience.\nEnjoy exploring!";
                        OS.openWindow('notepad');
                    }
                }
            }
        }

        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const path = btn.dataset.path;
                renderFolder(path);
            });
        });

        // Initialize with home
        renderFolder('home');
    })();

    /* ═══════════════════════════════════════════════
       NOTEPAD MODULE
       ═══════════════════════════════════════════════ */
    (function initNotepad() {
        const textarea = document.getElementById('notepad-textarea');
        const saveBtn = document.getElementById('notepad-save');
        const clearBtn = document.getElementById('notepad-clear');
        const statusEl = document.getElementById('notepad-status');
        if (!textarea) return;

        // Load saved content
        const savedText = localStorage.getItem('yakupos_notepad');
        if (savedText) {
            textarea.value = savedText;
        }

        saveBtn.addEventListener('click', () => {
            localStorage.setItem('yakupos_notepad', textarea.value);
            statusEl.textContent = 'Saved to local storage!';
            statusEl.style.opacity = '1';
            setTimeout(() => {
                statusEl.style.opacity = '0';
            }, 2000);
        });

        clearBtn.addEventListener('click', () => {
            textarea.value = '';
            localStorage.removeItem('yakupos_notepad');
            statusEl.textContent = 'Notes cleared.';
            statusEl.style.opacity = '1';
            setTimeout(() => {
                statusEl.style.opacity = '0';
            }, 2000);
        });
    })();

    /* ═══════════════════════════════════════════════
       CALCULATOR MODULE
       ═══════════════════════════════════════════════ */
    (function initCalculator() {
        const historyEl = document.getElementById('calc-history');
        const currentEl = document.getElementById('calc-current');
        const calcGrid = document.querySelector('.calc-grid');
        if (!calcGrid) return;

        let currentValue = '0';
        let previousValue = '';
        let operation = null;
        let shouldResetCurrent = false;

        function updateDisplay() {
            currentEl.textContent = currentValue;
            if (operation) {
                historyEl.textContent = `${previousValue} ${operation}`;
            } else {
                historyEl.textContent = '';
            }
        }

        function handleNumber(numStr) {
            if (shouldResetCurrent) {
                currentValue = numStr;
                shouldResetCurrent = false;
            } else {
                if (currentValue === '0' && numStr !== '.') {
                    currentValue = numStr;
                } else {
                    currentValue += numStr;
                }
            }
            updateDisplay();
        }

        function calculate() {
            if (!operation || !previousValue) return;
            const prev = parseFloat(previousValue);
            const current = parseFloat(currentValue);
            if (isNaN(prev) || isNaN(current)) return;

            let compute;
            switch (operation) {
                case '+':
                    compute = prev + current;
                    break;
                case '-':
                    compute = prev - current;
                    break;
                case '*':
                    compute = prev * current;
                    break;
                case '/':
                    compute = current === 0 ? 'Error' : prev / current;
                    break;
                case '%':
                    compute = prev % current;
                    break;
                default:
                    return;
            }

            if (compute === 'Error') {
                currentValue = compute;
            } else {
                // Formatting to avoid extremely long decimals
                currentValue = String(Math.round(compute * 1000000) / 1000000);
            }
            operation = null;
            previousValue = '';
            shouldResetCurrent = true;
            updateDisplay();
        }

        function handleOp(op) {
            if (currentValue === 'Error') return;
            if (operation && !shouldResetCurrent) {
                calculate();
            }
            operation = op;
            previousValue = currentValue;
            shouldResetCurrent = true;
            updateDisplay();
        }

        function handleAction(act) {
            if (act === 'clear') {
                currentValue = '0';
                previousValue = '';
                operation = null;
                updateDisplay();
            } else if (act === 'back') {
                if (currentValue.length === 1 || currentValue === 'Error') {
                    currentValue = '0';
                } else {
                    currentValue = currentValue.slice(0, -1);
                }
                updateDisplay();
            } else if (act === 'equal') {
                calculate();
            }
        }

        calcGrid.addEventListener('click', e => {
            const btn = e.target.closest('.calc-btn');
            if (!btn) return;

            if (btn.classList.contains('calc-num')) {
                const num = btn.dataset.num;
                handleNumber(num);
            } else if (btn.dataset.act === 'op') {
                handleOp(btn.dataset.op);
            } else if (btn.dataset.act) {
                handleAction(btn.dataset.act);
            }
        });
    })();
})();
