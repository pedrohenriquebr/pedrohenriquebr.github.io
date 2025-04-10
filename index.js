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


document.addEventListener('DOMContentLoaded', function () {
    
    const translationsCache = {}; // Cache para guardar o JSON carregado
    const localStorageKey = 'preferredLanguage';
    const elementsToTranslate = document.querySelectorAll('[data-i18n-key]');
    const heroTitleElement = document.getElementById('hero-title');
    const langToggleButton = document.getElementById('language-toggle');
    const langToggleButtonMobile = document.getElementById('language-toggle-mobile');
    const cvDownloadLink = document.getElementById('cv-download-link'); // Get CV link reference

    let typeItInstance = null; 
    let currentLang = 'pt'; 

    const cvPathPT = 'files/CV-PedroHenriqueBraga.pdf';
    const cvFilenamePT = 'CV-PedroHenriqueBraga.pdf';
    const cvPathEN = 'files/CV-PedroHenriqueBraga-EN.pdf'; // Adjust if your EN filename is different
    const cvFilenameEN = 'CV-PedroHenriqueBraga-EN.pdf'; // Adjust if your EN filename is different

    
    const greetingsPT = ["Olá! Eu sou Pedro Henrique Braga.", "Desenvolvedor Fullstack Pleno.", "Construindo aplicações .NET eficientes.", "Especialista em Backend e Frontend.", "Transformando ideias em código."];
    
    let greetingsEN = ["Hello! I am Pedro Henrique Braga.", "Fullstack Developer.", "Building efficient .NET applications.", "Specializing in Backend and Frontend.", "Turning ideas into code."]; // Default fallback

    
    const applyTranslations = (lang, translations) => {
        if (!translations) {
             console.warn(`No translations provided for language: ${lang}`);
             return;
        }

        elementsToTranslate.forEach(element => {
            const key = element.dataset.i18nKey;
            const targetAttribute = element.dataset.i18nTargetAttr;
            if (lang === 'en' && translations[key]) {
                const translation = translations[key];
                if (targetAttribute) {
                    if (element.hasAttribute(targetAttribute)) {
                        element.setAttribute(targetAttribute, translation);
                    } else {
                        console.warn(`Element with key "${key}" does not have attribute "${targetAttribute}".`);
                    }
                } else {
                    element.textContent = translation;
                }
            }
        });

         
        document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'pt-BR');

        console.log(`Translations applied for: ${lang}`);
    };


    const updateToggleButton = (lang) => {
        if (langToggleButton) {
            langToggleButton.textContent = lang === 'en' ? 'PT' : 'EN';
        }
        if (langToggleButtonMobile) { // Se adicionou
            langToggleButtonMobile.textContent = lang === 'en' ? 'PT' : 'EN';
        }
    };

    const updateCVLink = (lang) => {
        if (cvDownloadLink) {
            if (lang === 'en') {
                cvDownloadLink.href = cvPathEN;
                cvDownloadLink.download = cvFilenameEN;
                console.log("CV download link updated for EN.");
            } else { // lang === 'pt'
                cvDownloadLink.href = cvPathPT;
                cvDownloadLink.download = cvFilenamePT;
                console.log("CV download link reset for PT.");
            }
        } else {
            console.warn("CV download link element not found.");
        }
    };


    const updateTypeIt = (lang, translations) => {
         if (typeItInstance) {
             typeItInstance.destroy(); 
             typeItInstance = null;
         }

        let currentGreetings = greetingsPT; 
         if (lang === 'en') {
            currentGreetings = translations?.['hero.greeting'] 
                ? translations['hero.greeting'] 
                : greetingsEN; 
         }


         if (heroTitleElement) {
             typeItInstance = new TypeIt(heroTitleElement, {
                 strings: currentGreetings,
                 speed: 60,
                 waitUntilVisible: true,
                 loop: true,
                 breakLines: false,
                 loopDelay: 3500,
                 deleteSpeed: 40,
                 startDelay: 250 
             }).go();
         } else {
             console.error("Element with ID 'hero-title' not found for TypeIt.");
         }
     };


    const setLanguage = async (lang) => {
        currentLang = lang; // Atualiza a variável global
        console.log(`Setting language to: ${lang}`);

        try {
            if (lang === 'en') {
                // Carrega EN apenas se não estiver no cache
                if (!translationsCache['en']) {
                    console.log("Fetching English translations...");
                    const response = await fetch('/locales/en.json');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    translationsCache['en'] = await response.json();
                    console.log("English translations loaded and cached.");
                    // Atualiza o array de greetings EN com o valor do JSON, se existir
                    if (translationsCache['en']?.['typeit.greetings'] && Array.isArray(translationsCache['en']['typeit.greetings'])) {
                        greetingsEN = translationsCache['en']['typeit.greetings'];
                    }
                }
                // Aplica traduções EN do cache
                applyTranslations('en', translationsCache['en']);
                updateToggleButton('en');
                updateCVLink('en');
                updateTypeIt('en', translationsCache['en']);

            } else { 
                if (translationsCache['en']) {
                   window.location.reload(); 
                   return; 
                }

                 console.log("Applying default Portuguese content (from HTML).");
                 applyTranslations('pt', null); 
                 updateToggleButton('pt');
                 updateCVLink('pt');
                 updateTypeIt('pt', null); 
                 console.log("Manually reset state to Portuguese (no reload).");
            }
        } catch (error) {
            console.error("Error setting language:", error);
            currentLang = 'pt';
            applyTranslations('pt', null);
            updateToggleButton('pt');
            updateCVLink('pt');
            updateTypeIt('pt', null);
        }
    };

    const toggleLanguage = () => {
        const newLang = currentLang === 'pt' ? 'en' : 'pt';
        localStorage.setItem(localStorageKey, newLang); 
        setLanguage(newLang); 
    };
    const preferredLangStored = localStorage.getItem(localStorageKey);
    let initialLang = 'pt'; 

    if (preferredLangStored) {
        initialLang = preferredLangStored === 'en' ? 'en' : 'pt';
        console.log(`Using stored language preference: ${initialLang}`);
    } else {
        const browserLang = (navigator.languages && navigator.languages.length)
            ? navigator.languages[0].split('-')[0].toLowerCase()
            : navigator.language.split('-')[0].toLowerCase();
        if (browserLang !== 'pt') {
            initialLang = 'en';
            console.log(`Using browser language preference (non-PT): ${initialLang}`);
        } else {
            initialLang = 'pt';
             console.log(`Using browser language preference (PT): ${initialLang}`);
        }
    }

    setLanguage(initialLang);
    if (langToggleButton) {
        langToggleButton.addEventListener('click', toggleLanguage);
    }
    if (langToggleButtonMobile) { // Se adicionou
        langToggleButtonMobile.addEventListener('click', toggleLanguage);
    }

});