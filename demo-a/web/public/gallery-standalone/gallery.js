/**
 * Topo Gallery - Standalone Component
 * Accessible, responsive theme gallery
 *
 * @example
 * const gallery = createGallery({
 *   container: '#my-gallery',
 *   items: [...],
 *   selectedId: 'paper',
 *   onChange: (item) => console.log('Selected:', item)
 * });
 */

/**
 * Create a gallery instance
 * @param {Object} options
 * @param {HTMLElement|string} options.container - Container element or selector
 * @param {Array} options.items - Array of {id, name, category?, accentColor, secondaryColor?}
 * @param {string} [options.selectedId] - Initially selected item ID
 * @param {Function} [options.onChange] - Callback when selection changes
 * @returns {Object} Gallery instance
 */
function createGallery(options) {
  // === PRIVATE STATE ===
  let container = null;
  let gridEl = null;
  let items = [];
  let selectedId = null;
  let loadingId = null;
  const listeners = { change: [], focus: [] };

  // === INITIALIZATION ===

  function init() {
    // Resolve container
    if (typeof options.container === 'string') {
      container = document.querySelector(options.container);
    } else {
      container = options.container;
    }

    if (!container) {
      console.error('[TopoGallery] Container not found:', options.container);
      return;
    }

    // Set initial state
    items = options.items || [];
    selectedId = options.selectedId || null;

    // Register external onChange
    if (typeof options.onChange === 'function') {
      listeners.change.push(options.onChange);
    }

    // Build DOM
    buildDOM();
    render();

    // Attach event listeners
    attachEvents();
  }

  // === DOM CONSTRUCTION ===

  function buildDOM() {
    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Add gallery class
    container.classList.add('topo-gallery');

    // Header
    const header = document.createElement('div');
    header.className = 'topo-gallery__header';

    const title = document.createElement('span');
    title.className = 'topo-gallery__title';
    title.textContent = 'Themes';
    header.appendChild(title);

    const count = document.createElement('span');
    count.className = 'topo-gallery__count';
    count.textContent = items.length + ' items';
    header.appendChild(count);

    container.appendChild(header);

    // Grid
    gridEl = document.createElement('div');
    gridEl.className = 'topo-gallery__grid';
    gridEl.setAttribute('role', 'listbox');
    gridEl.setAttribute('aria-label', 'Theme selection');
    gridEl.setAttribute('tabindex', '0');
    container.appendChild(gridEl);
  }

  // === RENDERING ===

  function render() {
    if (!gridEl) return;

    // Clear grid
    while (gridEl.firstChild) {
      gridEl.removeChild(gridEl.firstChild);
    }

    // Render cards
    items.forEach((item, index) => {
      const card = createCard(item, index);
      gridEl.appendChild(card);
    });

    // Update count
    const countEl = container.querySelector('.topo-gallery__count');
    if (countEl) {
      countEl.textContent = items.length + ' items';
    }
  }

  function createCard(item, index) {
    const isSelected = item.id === selectedId;
    const isLoading = item.id === loadingId;

    // Card container (using div for semantic flexibility)
    const card = document.createElement('div');
    card.className = 'topo-gallery__card';
    card.dataset.itemId = item.id;
    card.dataset.index = index;
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    card.setAttribute('tabindex', isSelected ? '0' : '-1');

    if (isLoading) {
      card.dataset.loading = 'true';
    }

    // Preview area with color swatch
    const preview = document.createElement('div');
    preview.className = 'topo-gallery__card-preview';

    const swatch = document.createElement('div');
    swatch.className = 'topo-gallery__card-swatch';
    swatch.style.backgroundColor = item.accentColor || '#f0f0f0';
    if (item.secondaryColor) {
      swatch.style.setProperty('--card-secondary-color', item.secondaryColor);
    }
    preview.appendChild(swatch);

    // Spinner (hidden by default)
    const spinner = document.createElement('div');
    spinner.className = 'topo-gallery__card-spinner';
    preview.appendChild(spinner);

    // Checkmark
    const check = document.createElement('div');
    check.className = 'topo-gallery__card-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '\u2713';
    preview.appendChild(check);

    card.appendChild(preview);

    // Info area
    const info = document.createElement('div');
    info.className = 'topo-gallery__card-info';

    const name = document.createElement('p');
    name.className = 'topo-gallery__card-name';
    name.textContent = item.name;
    info.appendChild(name);

    if (item.category) {
      const category = document.createElement('p');
      category.className = 'topo-gallery__card-category';
      category.textContent = item.category;
      info.appendChild(category);
    }

    card.appendChild(info);

    return card;
  }

  // === EVENT HANDLING ===

  function attachEvents() {
    // Click/tap on cards
    gridEl.addEventListener('click', handleCardClick);

    // Keyboard navigation
    gridEl.addEventListener('keydown', handleKeydown);

    // Focus management
    gridEl.addEventListener('focusin', handleFocusIn);
  }

  function handleCardClick(event) {
    const card = event.target.closest('.topo-gallery__card');
    if (!card) return;

    const itemId = card.dataset.itemId;
    if (itemId && itemId !== selectedId) {
      selectById(itemId);
    }
  }

  function handleKeydown(event) {
    const cards = Array.from(gridEl.querySelectorAll('.topo-gallery__card'));
    if (cards.length === 0) return;

    const currentCard = gridEl.querySelector('.topo-gallery__card:focus');
    let currentIndex = currentCard ? parseInt(currentCard.dataset.index, 10) : -1;

    // Get grid dimensions
    const gridStyle = getComputedStyle(gridEl);
    const columns = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;

    let nextIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        break;

      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        break;

      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex + columns;
        if (nextIndex >= cards.length) nextIndex = currentIndex % columns;
        break;

      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex - columns;
        if (nextIndex < 0) nextIndex = cards.length - columns + (currentIndex % columns);
        if (nextIndex < 0 || nextIndex >= cards.length) nextIndex = cards.length - 1;
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentCard) {
          const itemId = currentCard.dataset.itemId;
          if (itemId && itemId !== selectedId) {
            selectById(itemId);
          }
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

      default:
        // Type-ahead: find item starting with pressed key
        if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
          const char = event.key.toLowerCase();
          const matchIndex = items.findIndex(item =>
            item.name.toLowerCase().startsWith(char)
          );
          if (matchIndex >= 0) {
            nextIndex = matchIndex;
          }
        }
        break;
    }

    // Focus next card
    if (nextIndex >= 0 && nextIndex < cards.length) {
      cards[nextIndex].focus();
    }
  }

  function handleFocusIn(event) {
    const card = event.target.closest('.topo-gallery__card');
    if (card) {
      const item = items.find(i => i.id === card.dataset.itemId);
      emit('focus', item);
    }
  }

  // === SELECTION ===

  function selectById(id, options = {}) {
    const { focus = false, emit: shouldEmit = true } = options;
    const item = items.find(i => i.id === id);
    if (!item) {
      console.warn('[TopoGallery] Item not found:', id);
      return;
    }

    const previousId = selectedId;
    selectedId = id;

    // Update card states
    updateSelectionState(previousId, selectedId);

    // Optionally focus the card
    if (focus && gridEl) {
      const card = gridEl.querySelector(`[data-item-id="${id}"]`);
      if (card) card.focus();
    }

    // Emit change event (unless suppressed for programmatic sync)
    if (shouldEmit) {
      emit('change', item);
    }
  }

  function updateSelectionState(previousId, newId) {
    // Remove from previous
    if (previousId) {
      const prevCard = gridEl.querySelector(`[data-item-id="${previousId}"]`);
      if (prevCard) {
        prevCard.setAttribute('aria-selected', 'false');
        prevCard.setAttribute('tabindex', '-1');
      }
    }

    // Add to new
    if (newId) {
      const newCard = gridEl.querySelector(`[data-item-id="${newId}"]`);
      if (newCard) {
        newCard.setAttribute('aria-selected', 'true');
        newCard.setAttribute('tabindex', '0');
      }
    }
  }

  function getSelected() {
    return items.find(i => i.id === selectedId) || null;
  }

  // === LOADING STATE ===

  function setLoading(id, isLoading) {
    loadingId = isLoading ? id : (loadingId === id ? null : loadingId);

    const card = gridEl?.querySelector(`[data-item-id="${id}"]`);
    if (!card) return;

    if (isLoading) {
      card.dataset.loading = 'true';
    } else {
      delete card.dataset.loading;
    }
  }

  // === DATA MANAGEMENT ===

  function setItems(newItems) {
    items = newItems || [];

    // Validate selection
    if (selectedId && !items.find(i => i.id === selectedId)) {
      selectedId = null;
    }

    render();
  }

  function getItems() {
    return [...items];
  }

  // === EVENTS ===

  function on(event, callback) {
    if (listeners[event]) {
      listeners[event].push(callback);
    }
  }

  function off(event, callback) {
    if (listeners[event]) {
      const index = listeners[event].indexOf(callback);
      if (index >= 0) {
        listeners[event].splice(index, 1);
      }
    }
  }

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(fn => {
        try {
          fn(data);
        } catch (err) {
          console.error('[TopoGallery] Event listener error:', err);
        }
      });
    }
  }

  // === LIFECYCLE ===

  function destroy() {
    if (gridEl) {
      gridEl.removeEventListener('click', handleCardClick);
      gridEl.removeEventListener('keydown', handleKeydown);
      gridEl.removeEventListener('focusin', handleFocusIn);
    }

    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.classList.remove('topo-gallery');
    }

    container = null;
    gridEl = null;
    items = [];
    selectedId = null;
    listeners.change = [];
    listeners.focus = [];
  }

  // === PUBLIC API ===

  const instance = {
    // Render
    render,

    // Selection
    select: selectById,
    getSelected,

    // Loading
    setLoading,

    // Data
    setItems,
    getItems,

    // Events
    on,
    off,

    // Lifecycle
    destroy
  };

  // Initialize
  init();

  return instance;
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createGallery };
}
