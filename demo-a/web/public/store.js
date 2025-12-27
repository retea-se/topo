/**
 * Minimal Reactive Store for Editor Gallery MVP
 * Phase 1 implementation - simple subscribe/notify pattern
 * Phase 15: Added collections support
 *
 * Usage:
 *   EditorStore.subscribe((state) => console.log('State changed:', state));
 *   EditorStore.setTheme('ink');
 *   EditorStore.setCollection('premium-poster');
 */

const EditorStore = {
  // === State ===

  // Catalog data (loaded once)
  themes: [],

  // Collections data (loaded once)
  collections: null,

  // Selection state (user choices)
  selection: {
    themeId: 'paper',
    frameId: 'classic',
    collectionId: null,  // Active collection (null = 'all-themes')
  },

  // UI state (transient)
  ui: {
    activeSection: 'theme',  // 'theme' | 'frame' | 'size' | 'export'
    isLoading: false,
    loadingThemeId: null,    // Which theme is currently loading
  },

  // Loaded theme data cache
  _themeCache: {},

  // === Listeners ===
  _listeners: new Set(),

  /**
   * Subscribe to state changes
   * @param {Function} fn - Callback receiving full state
   * @returns {Function} Unsubscribe function
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },

  /**
   * Notify all listeners of state change
   * @private
   */
  _notify() {
    const state = this._getState();
    this._listeners.forEach(fn => {
      try {
        fn(state);
      } catch (err) {
        console.error('[EditorStore] Listener error:', err);
      }
    });
  },

  /**
   * Get current state snapshot
   * @private
   */
  _getState() {
    return {
      themes: this.themes,
      collections: this.collections,
      selection: { ...this.selection },
      ui: { ...this.ui },
      currentTheme: this.getCurrentTheme(),
    };
  },

  // === Computed ===

  /**
   * Get current theme object from cache
   * @returns {Object|null}
   */
  getCurrentTheme() {
    return this._themeCache[this.selection.themeId] || null;
  },

  /**
   * Get active collection
   * @returns {Object|null}
   */
  getActiveCollection() {
    const id = this.selection.collectionId || 'all-themes';
    if (id === 'all-themes') {
      return this.collections?.specialCollections?.['all-themes'] || {
        id: 'all-themes',
        name: 'All Themes',
        description: 'Alla tillgängliga themes',
        themes: this.themes.map(t => t.id),
        dynamic: true
      };
    }
    return this.collections?.collections?.find(c => c.id === id) || null;
  },

  /**
   * Get themes for active collection
   * @returns {Array}
   */
  getCollectionThemes() {
    const collection = this.getActiveCollection();
    if (!collection) return this.themes;

    if (collection.dynamic) {
      return this.themes;
    }

    return this.themes.filter(t => collection.themes.includes(t.id));
  },

  /**
   * Get default collection for a preset
   * @param {string} presetId
   * @returns {string}
   */
  getDefaultCollection(presetId) {
    if (!this.collections?.presetDefaults) return 'all-themes';
    return this.collections.presetDefaults[presetId] || 'all-themes';
  },

  // === Actions ===

  /**
   * Load collections from config
   * @returns {Promise<void>}
   */
  async loadCollections() {
    try {
      const response = await fetch('/config/collections.json');
      if (!response.ok) {
        throw new Error(`Failed to load collections: ${response.status}`);
      }
      this.collections = await response.json();
      this._notify();
    } catch (err) {
      console.warn('[EditorStore] Failed to load collections, using fallback:', err.message);
      // Fallback: create minimal collections structure
      this.collections = {
        collections: [],
        specialCollections: {
          'all-themes': {
            id: 'all-themes',
            name: 'All Themes',
            description: 'Alla tillgängliga themes',
            dynamic: true
          }
        },
        presetDefaults: {}
      };
      this._notify();
    }
  },

  /**
   * Set available themes (called once on init)
   * @param {Array} themes - Array of theme catalog items
   */
  setThemes(themes) {
    this.themes = themes;
    this._notify();
  },

  /**
   * Set active theme by ID
   * @param {string} themeId
   */
  setTheme(themeId) {
    if (this.selection.themeId === themeId) return;
    this.selection.themeId = themeId;
    this._notify();
  },

  /**
   * Set active collection by ID
   * @param {string} collectionId
   */
  setCollection(collectionId) {
    if (this.selection.collectionId === collectionId) return;
    this.selection.collectionId = collectionId;
    this._notify();
  },

  /**
   * Set loading state for theme
   * @param {boolean} isLoading
   * @param {string|null} themeId - Which theme is loading
   */
  setLoading(isLoading, themeId = null) {
    this.ui.isLoading = isLoading;
    this.ui.loadingThemeId = themeId;
    this._notify();
  },

  /**
   * Cache loaded theme data
   * @param {string} themeId
   * @param {Object} themeData
   */
  cacheTheme(themeId, themeData) {
    this._themeCache[themeId] = themeData;
  },

  /**
   * Get cached theme data
   * @param {string} themeId
   * @returns {Object|null}
   */
  getCachedTheme(themeId) {
    return this._themeCache[themeId] || null;
  },

  /**
   * Set active frame/layout template
   * @param {string} frameId
   */
  setFrame(frameId) {
    if (this.selection.frameId === frameId) return;
    this.selection.frameId = frameId;
    this._notify();
  },

  /**
   * Set active UI section (for mobile navigation)
   * @param {string} section - 'theme' | 'frame' | 'size' | 'export'
   */
  setActiveSection(section) {
    if (this.ui.activeSection === section) return;
    this.ui.activeSection = section;
    this._notify();
  },

  // === Debug ===

  /**
   * Log current state (for debugging)
   */
  debug() {
    console.log('[EditorStore] State:', this._getState());
    console.log('[EditorStore] Theme cache:', Object.keys(this._themeCache));
    console.log('[EditorStore] Listeners:', this._listeners.size);
    console.log('[EditorStore] Collections:', this.collections);
  }
};

// Expose globally for vanilla JS usage
window.EditorStore = EditorStore;
