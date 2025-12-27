/**
 * ThemeGallery Component for Editor Gallery MVP
 * Phase 1 - Renders theme cards with selection and loading states
 * Uses safe DOM methods (no innerHTML)
 *
 * Usage:
 *   ThemeGallery.init(containerElement);
 *   ThemeGallery.render(themes, selectedThemeId);
 */

const ThemeGallery = {
  // Container element
  _container: null,

  // Callback when theme is selected
  _onSelect: null,

  // Debounce timer for rapid clicks
  _debounceTimer: null,
  _debounceDelay: 200,

  /**
   * Initialize the gallery
   * @param {HTMLElement} container - Container element for gallery
   * @param {Object} options - Configuration options
   * @param {Function} options.onSelect - Callback when theme selected: (themeId) => void
   */
  init(container, options = {}) {
    this._container = container;
    this._onSelect = options.onSelect || (() => {});

    // Add ARIA attributes for accessibility
    this._container.setAttribute('role', 'listbox');
    this._container.setAttribute('aria-label', 'Theme gallery');

    // Keyboard navigation
    this._container.addEventListener('keydown', this._handleKeydown.bind(this));

    console.log('[ThemeGallery] Initialized');
  },

  /**
   * Render the gallery with themes
   * @param {Array} themes - Array of theme objects {id, name, background, meta}
   * @param {string} selectedId - Currently selected theme ID
   * @param {string|null} loadingId - Theme ID currently loading (or null)
   */
  render(themes, selectedId, loadingId = null) {
    if (!this._container) {
      console.error('[ThemeGallery] Not initialized');
      return;
    }

    // Clear existing content safely
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    // Build cards using DOM methods
    themes.forEach(theme => {
      const card = this._createCard(theme, selectedId, loadingId);
      this._container.appendChild(card);
    });

    console.log('[ThemeGallery] Rendered', themes.length, 'themes');
  },

  /**
   * Update selected state without full re-render
   * @param {string} selectedId - New selected theme ID
   * @param {string|null} loadingId - Theme ID currently loading
   */
  updateSelection(selectedId, loadingId = null) {
    const cards = this._container.querySelectorAll('.gallery-card');
    cards.forEach(card => {
      const themeId = card.dataset.themeId;
      const isSelected = themeId === selectedId;
      const isLoading = themeId === loadingId;

      card.classList.toggle('selected', isSelected);
      card.classList.toggle('loading', isLoading);
      card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      card.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
  },

  /**
   * Set loading state for a specific theme
   * @param {string} themeId - Theme ID to show loading for
   * @param {boolean} isLoading - Whether loading
   */
  setLoading(themeId, isLoading) {
    const card = this._container.querySelector(`[data-theme-id="${themeId}"]`);
    if (card) {
      card.classList.toggle('loading', isLoading);
    }
  },

  /**
   * Create a single theme card element
   * @private
   */
  _createCard(theme, selectedId, loadingId) {
    const isSelected = theme.id === selectedId;
    const isLoading = theme.id === loadingId;

    // Main card container
    const card = document.createElement('div');
    card.className = 'gallery-card';
    if (isSelected) card.classList.add('selected');
    if (isLoading) card.classList.add('loading');
    card.dataset.themeId = theme.id;
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    card.setAttribute('tabindex', isSelected ? '0' : '-1');

    // Preview section
    const preview = document.createElement('div');
    preview.className = 'gallery-card__preview';

    // Color swatch
    const swatch = document.createElement('div');
    swatch.className = 'gallery-card__swatch';
    const bgColor = theme.background || '#f0f0f0';
    swatch.style.backgroundColor = bgColor;
    swatch.style.color = this._getContrastColor(bgColor);
    preview.appendChild(swatch);

    // Loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'gallery-card__spinner';
    preview.appendChild(spinner);

    // Checkmark
    const check = document.createElement('div');
    check.className = 'gallery-card__check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '\u2713'; // Checkmark character
    preview.appendChild(check);

    card.appendChild(preview);

    // Info section
    const info = document.createElement('div');
    info.className = 'gallery-card__info';

    const name = document.createElement('p');
    name.className = 'gallery-card__name';
    name.textContent = theme.name;
    info.appendChild(name);

    if (theme.meta?.mood) {
      const meta = document.createElement('p');
      meta.className = 'gallery-card__meta';
      meta.textContent = theme.meta.mood;
      info.appendChild(meta);
    }

    card.appendChild(info);

    // Attach click handler
    card.addEventListener('click', this._handleCardClick.bind(this));

    return card;
  },

  /**
   * Handle card click with debounce
   * @private
   */
  _handleCardClick(event) {
    const card = event.currentTarget;
    const themeId = card.dataset.themeId;

    if (!themeId) return;

    // Debounce rapid clicks
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      console.log('[ThemeGallery] Theme selected:', themeId);
      this._onSelect(themeId);
    }, this._debounceDelay);
  },

  /**
   * Handle keyboard navigation
   * @private
   */
  _handleKeydown(event) {
    const cards = Array.from(this._container.querySelectorAll('.gallery-card'));
    const currentIndex = cards.findIndex(card => card === document.activeElement);

    let nextIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0) {
          cards[currentIndex].click();
        }
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = cards.length - 1;
        break;
    }

    if (nextIndex >= 0 && cards[nextIndex]) {
      cards[nextIndex].focus();
    }
  },

  /**
   * Get contrasting color for text on background
   * @private
   */
  _getContrastColor(hexColor) {
    // Handle short hex and rgb formats
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) || 128;
    const g = parseInt(hex.substr(2, 2), 16) || 128;
    const b = parseInt(hex.substr(4, 2), 16) || 128;

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#2d3436' : '#ffffff';
  },

  /**
   * Destroy the gallery (cleanup)
   */
  destroy() {
    if (this._container) {
      while (this._container.firstChild) {
        this._container.removeChild(this._container.firstChild);
      }
      this._container.removeAttribute('role');
      this._container.removeAttribute('aria-label');
    }
    this._container = null;
    this._onSelect = null;
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
  }
};

// Expose globally for vanilla JS usage
window.ThemeGallery = ThemeGallery;
