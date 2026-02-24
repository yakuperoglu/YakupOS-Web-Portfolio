/* ═══════════════════════════════════════════════
   INTERACTIVE TERMINAL
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';
    const OS = window.YakupOS;

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
                const validWindows = ['about', 'projects', 'certificates', 'contact', 'terminal', 'games', 'game-snake', 'game-tictactoe', 'game-memory', 'stats', 'music', 'settings', 'gallery', 'explorer', 'notepad', 'calculator'];
                if (!target) {
                    termPrint('Usage: open &lt;window&gt;', 'term-error');
                    termPrint('Available: ' + validWindows.join(', '), 'term-system');
                } else if (validWindows.includes(target)) {
                    OS.openWindow(target);
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
                setTimeout(() => OS.closeWindow(document.getElementById('window-terminal')), 500);
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
})();
