/* ═══════════════════════════════════════════════
   SIMPLE I18N HELPER
   data-i18n-en / data-i18n-tr attribute tabanlı
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    var DEFAULT_LANG = 'en';
    var STORAGE_KEY = 'yakupos-lang';
    var SUPPORTED = ['en', 'tr'];

    function getInitialLang() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
        } catch (_) { /* ignore */ }
        return DEFAULT_LANG;
    }

    function applyLanguage(lang) {
        if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;

        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (_) { /* private mode / quota */ }

        document.documentElement.setAttribute('data-lang', lang);

        var attrName = lang === 'tr' ? 'data-i18n-tr' : 'data-i18n-en';

        document.querySelectorAll('[data-i18n-en],[data-i18n-tr]').forEach(function (el) {
            var text = el.getAttribute(attrName);
            if (!text) return;

            var tag = el.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });
    }

    var initialLang = getInitialLang();

    // Expose to YakupOS namespace
    window.YakupOS = window.YakupOS || {};
    window.YakupOS.currentLang = initialLang;
    window.YakupOS.setLanguage = function (lang) {
        window.YakupOS.currentLang = lang;
        applyLanguage(lang);
    };

    // Apply on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyLanguage(initialLang);
        });
    } else {
        applyLanguage(initialLang);
    }
})();

