/**
 * SectionNav - Section-based Navigation Component
 * Phase 2A: Editor 2.0
 *
 * Creates a tablist navigation for editor sections.
 * Desktop: Vertical list in sidebar
 * Mobile: Horizontal tabs at bottom of panel
 *
 * @example
 * const nav = createSectionNav({
 *   container: document.querySelector('.section-nav-container'),
 *   onSectionChange: (sectionId) => showSection(sectionId)
 * });
 */

/**
 * Create a section navigation instance
 * @param {Object} options
 * @param {HTMLElement} options.container - Container element
 * @param {Array} [options.sections] - Section config array
 * @param {string} [options.initialSection] - Initial active section
 * @param {Function} [options.onSectionChange] - Callback when section changes
 * @returns {Object} Navigation instance
 */
function createSectionNav(options) {
  const {
    container,
    sections = null,
    initialSection = 'style',
    onSectionChange = null
  } = options;

  // Default sections (Editor 2.0 structure)
  const SECTIONS = sections || [
    { id: 'map', label: 'Map', labelSv: 'Karta', icon: '\uD83D\uDCCD' },      // 📍
    { id: 'labels', label: 'Labels', labelSv: 'Etiketter', icon: '\uD83C\uDFF7\uFE0F' },  // 🏷️
    { id: 'style', label: 'Style', labelSv: 'Stil', icon: '\uD83C\uDFA8' },    // 🎨
    { id: 'frames', label: 'Frames', labelSv: 'Ramar', icon: '\uD83D\uDDBC\uFE0F' },  // 🖼️
    { id: 'size', label: 'Size', labelSv: 'Storlek', icon: '\uD83D\uDCD0' },   // 📐
    { id: 'export', label: 'Export', labelSv: 'Exportera', icon: '\u2B07\uFE0F' }  // ⬇️
  ];

  let activeSection = initialSection;
  let navEl = null;
  let currentLang = 'en';

  /**
   * Build the navigation DOM
   */
  function buildDOM() {
    if (!container) {
      console.error('[SectionNav] Container not provided');
      return;
    }

    // Create nav element
    navEl = document.createElement('nav');
    navEl.className = 'section-nav';
    navEl.setAttribute('role', 'tablist');
    navEl.setAttribute('aria-label', 'Editor sections');

    // Build section buttons
    SECTIONS.forEach(section => {
      const btn = document.createElement('button');
      btn.className = 'section-nav__item';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-section', section.id);
      btn.setAttribute('aria-selected', section.id === activeSection ? 'true' : 'false');
      btn.setAttribute('aria-controls', `section-${section.id}`);
      btn.setAttribute('tabindex', section.id === activeSection ? '0' : '-1');
      btn.type = 'button';

      // Icon
      const icon = document.createElement('span');
      icon.className = 'section-nav__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = section.icon;
      btn.appendChild(icon);

      // Label
      const label = document.createElement('span');
      label.className = 'section-nav__label';
      label.textContent = currentLang === 'sv' ? section.labelSv : section.label;
      label.setAttribute('data-label-en', section.label);
      label.setAttribute('data-label-sv', section.labelSv);
      btn.appendChild(label);

      // Click handler
      btn.addEventListener('click', () => setActive(section.id));

      navEl.appendChild(btn);
    });

    // Keyboard navigation
    navEl.addEventListener('keydown', handleKeydown);

    container.appendChild(navEl);
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeydown(event) {
    const tabs = Array.from(navEl.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.findIndex(tab => tab.dataset.section === activeSection);

    let nextIndex = -1;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;

      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        // Already handled by click
        break;

      default:
        return;
    }

    if (nextIndex >= 0 && tabs[nextIndex]) {
      const sectionId = tabs[nextIndex].dataset.section;
      setActive(sectionId);
      tabs[nextIndex].focus();
    }
  }

  /**
   * Set active section
   * @param {string} sectionId
   */
  function setActive(sectionId) {
    if (sectionId === activeSection) return;
    if (!SECTIONS.find(s => s.id === sectionId)) {
      console.warn('[SectionNav] Unknown section:', sectionId);
      return;
    }

    const previousSection = activeSection;
    activeSection = sectionId;

    // Update ARIA attributes
    if (navEl) {
      navEl.querySelectorAll('[role="tab"]').forEach(tab => {
        const isActive = tab.dataset.section === sectionId;
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    // Callback
    if (onSectionChange) {
      onSectionChange(sectionId, previousSection);
    }

    console.log('[SectionNav] Section changed:', previousSection, '->', sectionId);
  }

  /**
   * Get current active section
   * @returns {string}
   */
  function getActive() {
    return activeSection;
  }

  /**
   * Update language for labels
   * @param {string} lang - 'en' or 'sv'
   */
  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'sv') return;
    currentLang = lang;

    if (navEl) {
      navEl.querySelectorAll('.section-nav__label').forEach(label => {
        const text = lang === 'sv'
          ? label.getAttribute('data-label-sv')
          : label.getAttribute('data-label-en');
        if (text) label.textContent = text;
      });
    }
  }

  /**
   * Destroy the navigation
   */
  function destroy() {
    if (navEl) {
      navEl.removeEventListener('keydown', handleKeydown);
      navEl.remove();
      navEl = null;
    }
  }

  // Initialize
  buildDOM();

  // Public API
  return {
    setActive,
    getActive,
    setLanguage,
    destroy,
    get element() { return navEl; }
  };
}

// Expose globally
window.createSectionNav = createSectionNav;
