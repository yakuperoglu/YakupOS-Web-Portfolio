/* ═══════════════════════════════════════════════════════════════
   YakupOS — Core Module
   Shared state, DOM references, and utility bootstrapping.
   Must be loaded FIRST before all other modules.
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

    /* ─── Expose shared namespace ─── */
    window.YakupOS = {
        desktop,
        bootScreen,
        startBtn,
        startMenu,
        taskbarTabs,
        clockEl,
        desktopIcons,
        windows,
        startMenuItems,
        drag,
        get topZ() { return topZ; },
        set topZ(v) { topZ = v; },
        get isMobile() { return isMobile; },
        set isMobile(v) { isMobile = v; },
        get activeWindow() { return activeWindow; },
        set activeWindow(v) { activeWindow = v; },
    };
})();
