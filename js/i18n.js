/* ═══════════════════════════════════════════════
   SIMPLE I18N HELPER
   data-i18n-en / data-i18n-tr attribute tabanlı
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    var DEFAULT_LANG = 'en';   // Site always opens in English
    var SESSION_KEY  = 'yakupos-lang-session'; // session-scoped preference
    var SUPPORTED    = ['en', 'tr'];

    // CV file map: one per language
    var CV_FILES = {
        en: 'assets/cv/YAKUP_EROGLU_CV_English.pdf',
        tr: 'assets/cv/YAKUP_ERO\u011eLU_CV_T\u00fcrk\u00e7e.pdf'
    };
    var CV_NAMES = {
        en: 'YAKUP_EROGLU_CV_English.pdf',
        tr: 'YAKUP_EROĞLU_CV_Türkçe.pdf'
    };

    function getInitialLang() {
        // Use sessionStorage so the preference lives only for this tab/session.
        // A completely fresh tab always starts in English.
        try {
            var saved = sessionStorage.getItem(SESSION_KEY);
            if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
        } catch (_) { /* ignore */ }
        return DEFAULT_LANG;
    }

    function updateCVButton(lang) {
        var btn = document.getElementById('cv-download-btn');
        if (!btn) return;
        btn.href     = CV_FILES[lang] || CV_FILES.en;
        btn.download = CV_NAMES[lang] || CV_NAMES.en;
    }

    function applyLanguage(lang) {
        if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;

        try {
            sessionStorage.setItem(SESSION_KEY, lang);
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

        updateCVButton(lang);
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

