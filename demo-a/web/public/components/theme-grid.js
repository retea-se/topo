/**
 * ThemeGrid Component
 * Phase 15 - Wrapper around ThemeGallery with filtering and sorting
 *
 * Usage:
 *   ThemeGrid.init(container, { onSelect: (themeId) => {} });
 *   ThemeGrid.render(themes, selectedId, heroId);
 *   ThemeGrid.updateSelection(selectedId, loadingId);
 */

const ThemeGrid = {
  _container: null,
  _onSelect: null,
  _galleryInstance: null,

  /**
   * Initialize the grid component
   * @param {HTMLElement} container - Container element for grid
   * @param {Object} options - Configuration options
   * @param {Function} options.onSelect - Callback when theme selected: (themeId) => void
   */
  init(container, options = {}) {
    this._container = container;
    this._onSelect = options.onSelect || (() => {});
    this._container.classList.add('theme-grid');

    // Initialize the underlying ThemeGallery
    if (window.ThemeGallery) {
      window.ThemeGallery.init(this._container, {
        onSelect: (themeId) => {
          console.log('[ThemeGrid] Theme selected:', themeId);
          this._onSelect(themeId);
        }
      });
    } else {
      console.error('[ThemeGrid] ThemeGallery not loaded');
    }

    console.log('[ThemeGrid] Initialized');
  },

  /**
   * Render themes for a collection
   * @param {Array} themes - Array of theme objects (already filtered for collection)
   * @param {string|null} selectedId - Currently selected theme ID
   * @param {string|null} heroId - Hero theme ID (for sorting)
   */
  render(themes, selectedId, heroId = null) {
    if (!this._container) {
      console.error('[ThemeGrid] Not initialized');
      return;
    }

    // Sort themes: hero first, then alphabetically (Swedish locale)
    const sortedThemes = this._sortThemes(themes, heroId);

    // Use ThemeGallery to render
    if (window.ThemeGallery) {
      window.ThemeGallery.render(sortedThemes, selectedId, null);
    }

    // Show empty state if no themes
    if (sortedThemes.length === 0) {
      this._renderEmptyState();
    }

    console.log('[ThemeGrid] Rendered', sortedThemes.length, 'themes');
  },

  /**
   * Update selection state without full re-render
   * @param {string|null} selectedId - Currently selected theme ID
   * @param {string|null} loadingId - Theme ID currently loading
   */
  updateSelection(selectedId, loadingId = null) {
    if (window.ThemeGallery) {
      window.ThemeGallery.updateSelection(selectedId, loadingId);
    }
  },

  /**
   * Sort themes: hero first, then alphabetically
   * @private
   */
  _sortThemes(themes, heroId) {
    return [...themes].sort((a, b) => {
      // Hero theme always first
      if (a.id === heroId) return -1;
      if (b.id === heroId) return 1;
      // Then alphabetically by name (Swedish locale)
      return a.name.localeCompare(b.name, 'sv');
    });
  },

  /**
   * Render empty state when no themes match
   * @private
   */
  _renderEmptyState() {
    // Clear existing content
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    const empty = document.createElement('div');
    empty.className = 'theme-grid__empty';
    empty.textContent = 'No themes in this collection';
    this._container.appendChild(empty);
  },

  /**
   * Destroy the component (cleanup)
   */
  destroy() {
    if (window.ThemeGallery) {
      window.ThemeGallery.destroy();
    }
    if (this._container) {
      this._container.classList.remove('theme-grid');
    }
    this._container = null;
    this._onSelect = null;
  }
};

// Expose globally for vanilla JS usage
window.ThemeGrid = ThemeGrid;
