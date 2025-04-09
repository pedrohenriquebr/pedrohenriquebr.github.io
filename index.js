document.addEventListener('DOMContentLoaded', function () {
    const menuButton = document.getElementById('mobile-menu-button');
    const closeButton = document.getElementById('mobile-menu-close-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu.querySelectorAll('.mobile-menu-link');

    function openMenu() {
        if (mobileMenu) mobileMenu.classList.remove('hidden');
        document.body.classList.add('modal-open'); // Prevent body scroll
    }

    function closeMenu() {
        if (mobileMenu) mobileMenu.classList.add('hidden');
        document.body.classList.remove('modal-open'); // Restore body scroll
    }

    if (menuButton) menuButton.addEventListener('click', openMenu);
    if (closeButton) closeButton.addEventListener('click', closeMenu);

    // Close menu when a link is clicked
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const hrefAttr = link.getAttribute('href');
            // Check if it's an internal link before closing
            if (hrefAttr && hrefAttr.startsWith('#')) {
                closeMenu();
                // Smooth scroll handled by the next block
            }
            // If it's an external link, the default behavior will navigate away
        });
    });

    // Smooth Scroll for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hrefAttr = this.getAttribute('href');
            // Ensure it's a valid internal link longer than just "#"
            if (hrefAttr && hrefAttr.length > 1 && hrefAttr.startsWith('#')) {
                try {
                    const targetElement = document.querySelector(hrefAttr);
                    if (targetElement) {
                        e.preventDefault(); // Prevent default jump
                        const header = document.querySelector('header');
                        const headerOffset = header ? header.offsetHeight : 0;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        // Calculate final scroll position considering the header offset and a small margin
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 10;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });

                        // Close mobile menu if it's open and was triggered by a link inside it
                        if (!mobileMenu.classList.contains('hidden') && this.closest('#mobile-menu')) {
                            closeMenu();
                        }
                    }
                } catch (error) {
                    console.warn(`Smooth scroll target not found for: ${hrefAttr}`, error);
                    // Fallback to default hash behavior if querySelector fails
                    window.location.hash = hrefAttr;
                }
            }
        });
    });

    // --- MODAL LOGIC ---
    const openModalButtons = document.querySelectorAll('.open-modal-button');
    const closeModalButtons = document.querySelectorAll('.modal-close-button');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    const openModal = (modal) => {
        if (modal == null) return;
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open'); // Prevent background scroll
    }

    const closeModal = (modal) => {
        if (modal == null) return;
        modal.classList.add('hidden');
        // Only remove modal-open if no other modals are open
        if (!document.querySelector('.project-modal:not(.hidden)')) {
            document.body.classList.remove('modal-open'); // Restore background scroll
        }
    }

    openModalButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = button.dataset.modalTarget;
            if (modalId) {
                const modal = document.querySelector(modalId);
                openModal(modal);
            } else {
                console.error("No data-modal-target attribute found on button:", button);
            }
        });
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.project-modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking the overlay
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.project-modal');
            closeModal(modal);
        });
    })

    // Close modal on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const visibleModal = document.querySelector('.project-modal:not(.hidden)');
            if (visibleModal) {
                closeModal(visibleModal);
            }
        }
    });
    // --- END MODAL LOGIC ---
});
