/**
 * CollectionHeader Component
 * Phase 15 - Displays collection name, description, and hero theme
 *
 * Usage:
 *   CollectionHeader.init(container, { onHeroClick: (themeId) => {} });
 *   CollectionHeader.render(collection, heroTheme);
 */

const CollectionHeader = {
  _container: null,
  _onHeroClick: null,

  /**
   * Initialize the header component
   * @param {HTMLElement} container - Container element for header
   * @param {Object} options - Configuration options
   * @param {Function} options.onHeroClick - Callback when hero clicked: (themeId) => void
   */
  init(container, options = {}) {
    this._container = container;
    this._onHeroClick = options.onHeroClick || (() => {});
    this._container.classList.add('collection-header');

    console.log('[CollectionHeader] Initialized');
  },

  /**
   * Render header for a collection
   * @param {Object} collection - Collection object
   * @param {Object|null} heroTheme - Hero theme data (with background color)
   */
  render(collection, heroTheme) {
    if (!this._container) {
      console.error('[CollectionHeader] Not initialized');
      return;
    }

    // Clear existing content safely
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    // For dynamic collections (all-themes), hide header or show minimal version
    if (collection.dynamic) {
      this._container.classList.add('collection-header--hidden');
      return;
    }

    this._container.classList.remove('collection-header--hidden');

    // Create hero section (if hero theme exists)
    if (heroTheme) {
      const heroEl = this._createHeroSection(collection.hero, heroTheme);
      this._container.appendChild(heroEl);
    }

    // Create info section
    const infoEl = this._createInfoSection(collection);
    this._container.appendChild(infoEl);

    console.log('[CollectionHeader] Rendered for', collection.id);
  },

  /**
   * Create hero section element
   * @private
   */
  _createHeroSection(heroId, heroTheme) {
    const hero = document.createElement('div');
    hero.className = 'collection-header__hero';
    hero.dataset.themeId = heroId;
    hero.setAttribute('role', 'button');
    hero.setAttribute('tabindex', '0');
    hero.setAttribute('aria-label', `Select hero theme: ${heroTheme.name}`);

    // Color swatch
    const swatch = document.createElement('div');
    swatch.className = 'collection-header__hero-swatch';
    const bgColor = heroTheme.background || '#f0f0f0';
    swatch.style.backgroundColor = bgColor;

    // Add accent color indicator if available
    if (heroTheme.meta?.accent) {
      swatch.style.borderColor = heroTheme.meta.accent;
    }

    hero.appendChild(swatch);

    // Hero label
    const label = document.createElement('span');
    label.className = 'collection-header__hero-label';
    label.textContent = heroTheme.name;
    hero.appendChild(label);

    // Click handler
    hero.addEventListener('click', () => {
      console.log('[CollectionHeader] Hero clicked:', heroId);
      this._onHeroClick(heroId);
    });

    // Keyboard support
    hero.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        hero.click();
      }
    });

    return hero;
  },

  /**
   * Create info section element
   * @private
   */
  _createInfoSection(collection) {
    const info = document.createElement('div');
    info.className = 'collection-header__info';

    // Name
    const name = document.createElement('h2');
    name.className = 'collection-header__name';
    name.textContent = collection.name;
    info.appendChild(name);

    // Description
    if (collection.description) {
      const desc = document.createElement('p');
      desc.className = 'collection-header__description';
      desc.textContent = collection.description;
      info.appendChild(desc);
    }

    return info;
  },

  /**
   * Destroy the component (cleanup)
   */
  destroy() {
    if (this._container) {
      while (this._container.firstChild) {
        this._container.removeChild(this._container.firstChild);
      }
      this._container.classList.remove('collection-header');
      this._container.classList.remove('collection-header--hidden');
    }
    this._container = null;
    this._onHeroClick = null;
  }
};

// Expose globally for vanilla JS usage
window.CollectionHeader = CollectionHeader;
