/**
 * CollectionTabs Component
 * Phase 15 - Renders horizontal tabs for theme collections
 *
 * Usage:
 *   CollectionTabs.init(container, { onSelect: (id) => {} });
 *   CollectionTabs.render(collections, activeId);
 *   CollectionTabs.setActive(newId);
 */

const CollectionTabs = {
  _container: null,
  _onSelect: null,
  _collections: [],
  _activeId: null,

  /**
   * Initialize the tabs component
   * @param {HTMLElement} container - Container element for tabs
   * @param {Object} options - Configuration options
   * @param {Function} options.onSelect - Callback when tab selected: (collectionId) => void
   */
  init(container, options = {}) {
    this._container = container;
    this._onSelect = options.onSelect || (() => {});

    // Add ARIA attributes for accessibility
    this._container.setAttribute('role', 'tablist');
    this._container.setAttribute('aria-label', 'Theme collections');
    this._container.classList.add('collection-tabs');

    // Keyboard navigation
    this._container.addEventListener('keydown', this._handleKeydown.bind(this));

    console.log('[CollectionTabs] Initialized');
  },

  /**
   * Render tabs for all collections
   * @param {Array} collections - Array of collection objects from collections.json
   * @param {string} activeId - Currently active collection ID
   */
  render(collections, activeId) {
    if (!this._container) {
      console.error('[CollectionTabs] Not initialized');
      return;
    }

    this._collections = collections;
    this._activeId = activeId;

    // Clear existing content safely
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    // Render regular collections first
    collections.forEach(collection => {
      const tab = this._createTab(collection, activeId);
      this._container.appendChild(tab);
    });

    // Always add "All Themes" tab last
    const allThemesTab = this._createTab({
      id: 'all-themes',
      name: 'All Themes'
    }, activeId, true);
    this._container.appendChild(allThemesTab);

    console.log('[CollectionTabs] Rendered', collections.length + 1, 'tabs');
  },

  /**
   * Update active tab without full re-render
   * @param {string} activeId - New active collection ID
   */
  setActive(activeId) {
    if (this._activeId === activeId) return;
    this._activeId = activeId;

    const tabs = this._container.querySelectorAll('.collection-tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.collectionId === activeId;
      tab.classList.toggle('collection-tab--active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  },

  /**
   * Create a single tab element
   * @private
   */
  _createTab(collection, activeId, isAllThemes = false) {
    const isActive = collection.id === activeId;

    const tab = document.createElement('button');
    tab.className = 'collection-tab';
    if (isActive) tab.classList.add('collection-tab--active');
    if (isAllThemes) tab.classList.add('collection-tab--all');

    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
    tab.dataset.collectionId = collection.id;
    tab.textContent = collection.name;

    // Click handler
    tab.addEventListener('click', this._handleClick.bind(this));

    return tab;
  },

  /**
   * Handle tab click
   * @private
   */
  _handleClick(event) {
    const tab = event.currentTarget;
    const collectionId = tab.dataset.collectionId;

    if (!collectionId || collectionId === this._activeId) return;

    console.log('[CollectionTabs] Tab clicked:', collectionId);
    this._onSelect(collectionId);
  },

  /**
   * Handle keyboard navigation
   * @private
   */
  _handleKeydown(event) {
    const tabs = Array.from(this._container.querySelectorAll('.collection-tab'));
    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);

    let nextIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
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
        if (currentIndex >= 0) {
          tabs[currentIndex].click();
        }
        return;
    }

    if (nextIndex >= 0 && tabs[nextIndex]) {
      tabs[nextIndex].focus();
    }
  },

  /**
   * Destroy the component (cleanup)
   */
  destroy() {
    if (this._container) {
      while (this._container.firstChild) {
        this._container.removeChild(this._container.firstChild);
      }
      this._container.removeAttribute('role');
      this._container.removeAttribute('aria-label');
      this._container.classList.remove('collection-tabs');
    }
    this._container = null;
    this._onSelect = null;
    this._collections = [];
    this._activeId = null;
  }
};

// Expose globally for vanilla JS usage
window.CollectionTabs = CollectionTabs;
