/**
 * Editor Integration for Topo Gallery
 * Phase 1 - Minimal integration with existing editor.js
 *
 * Prerequisites:
 * - gallery.js and gallery.css loaded
 * - themes array available (from themeToStyle.js or similar)
 * - map instance available for style updates
 */

/**
 * Initialize gallery in the editor sidebar
 * Call this from editor.js init() function
 *
 * @param {Object} options
 * @param {Array} options.themes - Array of theme objects from themeToStyle.js
 * @param {string} options.containerId - CSS selector for gallery container
 * @param {Object} options.map - MapLibre map instance
 * @param {Function} options.getStyleForTheme - Function to get style object for theme ID
 */
function initEditorGallery(options) {
  const {
    themes,
    containerId = '#theme-gallery-container',
    map,
    getStyleForTheme
  } = options;

  // Feature flag check (optional)
  const urlParams = new URLSearchParams(window.location.search);
  const useGallery = urlParams.get('gallery') === '1';

  if (!useGallery) {
    console.log('[EditorGallery] Gallery disabled (add ?gallery=1 to enable)');
    return null;
  }

  // Transform themes to gallery format
  const galleryItems = themes.map(theme => ({
    id: theme.id,
    name: theme.name,
    category: theme.meta?.mood || theme.meta?.category || '',
    accentColor: theme.background || '#f0f0f0',
    secondaryColor: theme.meta?.accent || null
  }));

  // Track loading state
  let isLoading = false;
  let currentThemeId = themes[0]?.id || null;

  // Create gallery instance
  const gallery = createGallery({
    container: containerId,
    items: galleryItems,
    selectedId: currentThemeId,
    onChange: handleThemeChange
  });

  // Handle theme selection
  async function handleThemeChange(item) {
    if (isLoading || item.id === currentThemeId) return;

    console.log('[EditorGallery] Changing theme to:', item.id);

    // Show loading state
    isLoading = true;
    gallery.setLoading(item.id, true);

    try {
      // Get style for this theme
      const style = await getStyleForTheme(item.id);

      if (style && map) {
        // Apply style to map
        map.setStyle(style);

        // Wait for style to load
        await new Promise(resolve => {
          map.once('style.load', resolve);
          // Timeout fallback
          setTimeout(resolve, 3000);
        });
      }

      currentThemeId = item.id;
      console.log('[EditorGallery] Theme applied:', item.id);

    } catch (error) {
      console.error('[EditorGallery] Failed to apply theme:', error);
      // Revert selection on error
      gallery.select(currentThemeId);
    } finally {
      // Hide loading state
      gallery.setLoading(item.id, false);
      isLoading = false;
    }
  }

  // Show the gallery container
  const container = document.querySelector(containerId);
  if (container) {
    container.classList.remove('hidden');
  }

  console.log('[EditorGallery] Initialized with', galleryItems.length, 'themes');

  // Return gallery instance for external control
  return {
    gallery,
    selectTheme: (id) => gallery.select(id),
    getCurrentTheme: () => currentThemeId,
    destroy: () => gallery.destroy()
  };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initEditorGallery };
}

// Expose globally
window.initEditorGallery = initEditorGallery;
