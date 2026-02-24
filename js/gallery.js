/* ═══════════════════════════════════════════════
   GALLERY & LIGHTBOX MODULE
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    const modal = document.getElementById('lightbox-modal');
    const imgEl = document.getElementById('lightbox-img');
    const captionEl = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!modal) return;

    let currentIndex = 0;
    const images = [];

    // Collect all images data
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        const caption = item.querySelector('.gallery-caption');
        if (img) {
            images.push({
                src: img.dataset.full || img.src,
                caption: caption ? caption.textContent : ''
            });

            // Add click listener to open lightbox
            item.addEventListener('click', () => {
                openLightbox(index);
            });
            // Keyboard support
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(index);
                }
            });
        }
    });

    let hasPreloadedAll = false;

    function preloadAllImages() {
        if (hasPreloadedAll) return;
        hasPreloadedAll = true;
        images.forEach(imgData => {
            const img = new Image();
            img.src = imgData.src;
        });
    }

    function openLightbox(index) {
        preloadAllImages();
        currentIndex = index;
        updateLightboxContent();
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
    }

    function closeLightbox() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        // Return focus to the item that opened it
        if (galleryItems[currentIndex]) {
            galleryItems[currentIndex].focus();
        }
    }

    function updateLightboxContent() {
        if (!images[currentIndex]) return;
        imgEl.src = images[currentIndex].src;
        captionEl.textContent = images[currentIndex].caption;
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxContent();
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxContent();
    }

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', showNext);
    prevBtn.addEventListener('click', showPrev);

    // Click outside image to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeLightbox();
        }
    });

    // Keyboard navigation in modal
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });
})();
