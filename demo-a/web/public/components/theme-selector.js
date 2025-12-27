/**
 * ThemeSelector Component
 * Phase 15 - Coordinates CollectionTabs, CollectionHeader, and ThemeGrid
 *
 * Usage:
 *   await ThemeSelector.init(container, { presetId, onThemeSelect });
 *   ThemeSelector.setPreset(presetId);
 *   ThemeSelector.destroy();
 */

const ThemeSelector = {
  _container: null,
  _options: null,
  _unsubscribe: null,
  _tabsContainer: null,
  _headerContainer: null,
  _gridContainer: null,
  _initialized: false,
  _retryCount: 0,
  _maxRetries: 1,

  /**
   * Initialize the theme selector
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Configuration options
   * @param {string|null} options.presetId - Active preset ID (for default collection)
   * @param {Function} options.onThemeSelect - Callback when theme selected: (themeId) => void
   */
  async init(container, options = {}) {
    if (this._initialized) {
      console.warn('[ThemeSelector] Already initialized');
      return;
    }

    this._container = container;
    this._options = {
      presetId: options.presetId || null,
      onThemeSelect: options.onThemeSelect || (() => {})
    };

    // Add base class
    this._container.classList.add('theme-selector');

    // Create sub-containers
    this._createContainers();

    // Show loading state
    this._setLoadingState(true);

    try {
      // Load data
      await this._loadData();

      // Determine initial collection based on preset
      const initialCollectionId = window.EditorStore.getDefaultCollection(this._options.presetId);

      // Validate collection exists, fallback if not
      const collectionId = this._getCollectionWithFallback(initialCollectionId);

      // Set initial collection in store
      window.EditorStore.setCollection(collectionId);

      // Initialize sub-components
      this._initComponents();

      // Initial render
      this._render();

      // Subscribe to store changes
      this._unsubscribe = window.EditorStore.subscribe(this._onStoreChange.bind(this));

      this._initialized = true;
      this._setLoadingState(false);

      console.log('[ThemeSelector] Initialized with collection:', collectionId);

    } catch (err) {
      console.error('[ThemeSelector] Initialization failed:', err);
      this._handleError(err);
    }
  },

  /**
   * Update when preset changes
   * @param {string} presetId - New preset ID
   */
  setPreset(presetId) {
    if (!this._initialized) {
      console.warn('[ThemeSelector] Not initialized');
      return;
    }

    this._options.presetId = presetId;

    // Get default collection for new preset
    const defaultCollectionId = window.EditorStore.getDefaultCollection(presetId);
    const collectionId = this._getCollectionWithFallback(defaultCollectionId);

    // Update store (will trigger re-render via subscription)
    window.EditorStore.setCollection(collectionId);

    console.log('[ThemeSelector] Preset changed to:', presetId, '-> collection:', collectionId);
  },

  /**
   * Create sub-containers for components
   * @private
   */
  _createContainers() {
    // Tabs container
    this._tabsContainer = document.createElement('div');
    this._tabsContainer.className = 'theme-selector__tabs';
    this._container.appendChild(this._tabsContainer);

    // Header container
    this._headerContainer = document.createElement('div');
    this._headerContainer.className = 'theme-selector__header';
    this._container.appendChild(this._headerContainer);

    // Grid container
    this._gridContainer = document.createElement('div');
    this._gridContainer.className = 'theme-selector__grid';
    this._container.appendChild(this._gridContainer);
  },

  /**
   * Load collections and themes data
   * @private
   */
  async _loadData() {
    // Load collections (with retry)
    await window.EditorStore.loadCollections();

    // Themes should already be loaded by editor.js, but verify
    if (!window.EditorStore.themes || window.EditorStore.themes.length === 0) {
      console.warn('[ThemeSelector] No themes in store, waiting for themes to load');
    }
  },

  /**
   * Initialize sub-components
   * @private
   */
  _initComponents() {
    // Initialize CollectionTabs
    if (window.CollectionTabs) {
      window.CollectionTabs.init(this._tabsContainer, {
        onSelect: this._onCollectionSelect.bind(this)
      });
    }

    // Initialize CollectionHeader
    if (window.CollectionHeader) {
      window.CollectionHeader.init(this._headerContainer, {
        onHeroClick: this._onThemeSelect.bind(this)
      });
    }

    // Initialize ThemeGrid
    if (window.ThemeGrid) {
      window.ThemeGrid.init(this._gridContainer, {
        onSelect: this._onThemeSelect.bind(this)
      });
    }
  },

  /**
   * Render all sub-components
   * @private
   */
  _render() {
    const state = window.EditorStore._getState();
    const activeCollection = window.EditorStore.getActiveCollection();
    const collectionThemes = window.EditorStore.getCollectionThemes();

    // Get hero theme data if available
    let heroTheme = null;
    if (activeCollection && activeCollection.hero) {
      heroTheme = state.themes.find(t => t.id === activeCollection.hero);
      if (!heroTheme) {
        console.warn('[ThemeSelector] Hero theme not found:', activeCollection.hero);
        // Fallback to first theme in collection
        heroTheme = collectionThemes[0] || null;
      }
    }

    // Render tabs
    if (window.CollectionTabs && state.collections?.collections) {
      window.CollectionTabs.render(
        state.collections.collections,
        state.selection.collectionId || 'all-themes'
      );
    }

    // Render header
    if (window.CollectionHeader && activeCollection) {
      window.CollectionHeader.render(activeCollection, heroTheme);
    }

    // Render grid
    if (window.ThemeGrid) {
      window.ThemeGrid.render(
        collectionThemes,
        state.selection.themeId,
        activeCollection?.hero || null
      );
    }
  },

  /**
   * Handle store state changes
   * @private
   */
  _onStoreChange(state) {
    const activeCollection = window.EditorStore.getActiveCollection();
    const collectionThemes = window.EditorStore.getCollectionThemes();

    // Get hero theme
    let heroTheme = null;
    if (activeCollection && activeCollection.hero) {
      heroTheme = state.themes.find(t => t.id === activeCollection.hero);
    }

    // Update tabs active state
    if (window.CollectionTabs) {
      window.CollectionTabs.setActive(state.selection.collectionId || 'all-themes');
    }

    // Update header
    if (window.CollectionHeader && activeCollection) {
      window.CollectionHeader.render(activeCollection, heroTheme);
    }

    // Update grid
    if (window.ThemeGrid) {
      window.ThemeGrid.render(
        collectionThemes,
        state.selection.themeId,
        activeCollection?.hero || null
      );
    }
  },

  /**
   * Handle collection tab selection
   * @private
   */
  _onCollectionSelect(collectionId) {
    console.log('[ThemeSelector] Collection selected:', collectionId);
    window.EditorStore.setCollection(collectionId);
  },

  /**
   * Handle theme selection (from grid or hero)
   * @private
   */
  _onThemeSelect(themeId) {
    console.log('[ThemeSelector] Theme selected:', themeId);

    // Update store
    window.EditorStore.setTheme(themeId);

    // Call external callback
    if (this._options.onThemeSelect) {
      this._options.onThemeSelect(themeId);
    }
  },

  /**
   * Get collection with fallback to all-themes
   * @private
   */
  _getCollectionWithFallback(collectionId) {
    const collections = window.EditorStore.collections;

    // If 'all-themes', return it directly
    if (collectionId === 'all-themes') {
      return 'all-themes';
    }

    // Check if collection exists
    if (collections?.collections) {
      const found = collections.collections.find(c => c.id === collectionId);
      if (found) return collectionId;
    }

    // Fallback
    console.warn(`[ThemeSelector] Collection "${collectionId}" not found, using all-themes`);
    return 'all-themes';
  },

  /**
   * Set loading state
   * @private
   */
  _setLoadingState(isLoading) {
    if (this._container) {
      this._container.classList.toggle('theme-selector--loading', isLoading);
    }
  },

  /**
   * Handle initialization error
   * @private
   */
  _handleError(err) {
    this._setLoadingState(false);

    // Retry once
    if (this._retryCount < this._maxRetries) {
      this._retryCount++;
      console.log('[ThemeSelector] Retrying initialization...');
      setTimeout(() => this.init(this._container, this._options), 1000);
      return;
    }

    // Show error state
    this._container.classList.add('theme-selector--error');

    // Clear existing content
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    const errorEl = document.createElement('div');
    errorEl.className = 'theme-selector__error';

    const message = document.createElement('p');
    message.textContent = 'Could not load themes.';
    errorEl.appendChild(message);

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';
    retryBtn.addEventListener('click', () => {
      this._retryCount = 0;
      this._container.classList.remove('theme-selector--error');
      this.init(this._container, this._options);
    });
    errorEl.appendChild(retryBtn);

    this._container.appendChild(errorEl);
  },

  /**
   * Destroy the component (cleanup)
   */
  destroy() {
    // Unsubscribe from store
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    // Destroy sub-components
    if (window.CollectionTabs) {
      window.CollectionTabs.destroy();
    }
    if (window.CollectionHeader) {
      window.CollectionHeader.destroy();
    }
    if (window.ThemeGrid) {
      window.ThemeGrid.destroy();
    }

    // Clean up container
    if (this._container) {
      while (this._container.firstChild) {
        this._container.removeChild(this._container.firstChild);
      }
      this._container.classList.remove('theme-selector');
      this._container.classList.remove('theme-selector--loading');
      this._container.classList.remove('theme-selector--error');
    }

    this._container = null;
    this._options = null;
    this._tabsContainer = null;
    this._headerContainer = null;
    this._gridContainer = null;
    this._initialized = false;
    this._retryCount = 0;

    console.log('[ThemeSelector] Destroyed');
  }
};

// Expose globally for vanilla JS usage
window.ThemeSelector = ThemeSelector;
