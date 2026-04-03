<div align="center">
  <img src="https://yakuperoglu.com/favicon.svg" alt="YakupOS Logo" width="80" height="80">
  <h1 align="center">YakupOS Web Portfolio</h1>
  <p align="center">
    <strong>A retro-futuristic, fully interactive OS-style personal portfolio</strong>
    <br />
    Built from scratch using Vanilla HTML, CSS, and JavaScript.
    <br />
    <br />
    <a href="https://yakuperoglu.com/"><strong>🌎 yakuperoglu.com (Live Demo)</strong></a>
    ·
    <a href="mailto:yakup.erogl@gmail.com">Contact</a>
  </p>
</div>

<hr />

## Overview

**YakupOS** is not just a personal website; it's a nostalgic yet modern web experience designed to look and behave like a fully functional desktop operating system. It features draggable windows, a functioning start menu, taskbar, applications, and games—all completely responsive and mobile-friendly without relying on bulky frameworks. 

## Features

- **Desktop Interface:** Movable, resizable, minimizable, and maximizable window system.
- **Start Menu & Taskbar:** Classic OS navigation with dynamic clock, pinned apps, and live task tracking.
- **Multilingual Support:** Seamlessly switch between English and Turkish via the UI (`en/tr`).
- **SEO Optimized:** Implements "Perfect SEO" with JSON-LD (Structured Data), fallback pages for crawlers (`noscript`), and deferred optimized scripting.
- **Responsive Layout:** Automatically scales from a widescreen desktop down to a mobile phone with a smooth grid-adjusting experience.

### Integrated Applications
- **Terminal.exe:** A custom command-line interface that responds to commands (`help`, `ls`, `whoami`, `clear`).
- **Browser.exe:** Faux web browser that renders the projects, about section, and blog within an inner viewport.
- **Paint.exe:** A fully functioning drawing tool utilizing the HTML5 `<canvas>` element (brush, eraser, shapes, custom colors).
- **Music.mp3:** Inner music player equipped with a visualizer, timeline, and playlist.
- **Calculator.exe:** A fully functional desktop calculator.
- **Stats.dashboard:** Real-time data visualization showing tech stack percentages, total projects, and session uptime.
- **Notepad.txt & Contact.txt:** Inner text editors with working form submissions.
- **Settings.sys:** Dynamic control panel allowing users to switch themes (Dark/Light), languages, wallpapers, and accent colors.
- **Calendar.exe & Explorer.exe:** Navigate mock files and keep track of dates.

### Retro Games Collection
- **Minesweeper.exe:** Classic mine puzzle game.
- **Snake.exe:** Eat the red dots and grow.
- **Memory.exe:** A challenging card-matching puzzle.
- **TicTacToe.exe:** The beloved pen-and-paper game.

## Built With

This project avoids heavy libraries and frameworks to showcase raw frontend skills:

- **HTML5:** Semantic architecture with high focus on web accessibility (ARIA) and search-ability.
- **CSS3:** Advanced modular CSS. Uses CSS Grid, Flexbox, Custom Properties (variables), and Glassmorphism effects.
- **Vanilla JavaScript (ES6+):** Complete logic engine for window management, drag systems, local storage, state handling, and canvas rendering.

## Installation & Running Locally

Since YakupOS is pure Vanilla JS, there is no build step or node package requirement. 

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yakuperoglu/YakupOS-Web-Portfolio.git
   ```
2. **Navigate to the directory:**
   ```bash
   cd YakupOS-Web-Portfolio
   ```
3. **Launch the project:**
   Simply open `index.html` in any modern web browser or use a live server extension (like VS Code Live Server) for a better development experience.
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

## Project Structure

```text
├── assets/             # Certificates, CV, and graphics
├── css/                # Modular cascading style sheets
│   ├── variables.css   # Theme colors and base dimensions
│   ├── windows.css     # Core window management styles
│   ├── desktop.css     # Layout for the desktop canvas
│   └── ...             # Specific styles for each app
├── js/                 # Vanilla JS Logic
│   ├── core.js         # Core event bus and utility functions
│   ├── windowManager.js# Spawning, closing, depth sorting
│   ├── dragSystem.js   # Draggable logic for windows
│   ├── ui.js           # Start menu and taskbar behaviors
│   └── ...             # Custom scripts for each OS app
├── index.html          # Main architecture and entry point
├── robots.txt          # Web crawler configuration
└── sitemap.xml         # XML Sitemap for indexing
```

## Contributing

Contributions, issues, and feature requests are always welcome! Feel free to check the [issues page](https://github.com/yakuperoglu/YakupOS-Web-Portfolio/issues).

## License

This project is open source and available under the [MIT License](LICENSE).

---
*Crafted with passion by Yakup Eroğlu.*