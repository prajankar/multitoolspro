// MultiTools Pro - Common Shared JavaScript
(function() {
  'use strict';

  // --- Dynamic Component Loader (Header & Footer) ---
  async function loadComponent(selector, filePath) {
    const el = document.querySelector(selector);
    if (!el) return;
    // If already populated, just initialize
    if (el.children.length > 0) {
      if (selector === '#header-placeholder' || el.querySelector('#navbarMain')) {
        initHeader();
      }
      return;
    }

    try {
      // Determine root-relative path for components
      const isToolPage = window.location.pathname.includes('/tools/');
      const resolvedPath = isToolPage ? `../${filePath}` : `./${filePath}`;

      let res = await fetch(resolvedPath);
      if (!res.ok) {
        // Fallback to absolute root path
        res = await fetch(`/${filePath}`);
      }
      if (res.ok) {
        const html = await res.text();
        el.innerHTML = html;
        if (selector === '#header-placeholder' || el.querySelector('#navbarMain')) {
          initHeader();
        }
      } else {
        console.warn(`Could not load ${filePath}`);
      }
    } catch (err) {
      console.warn(`Error loading component ${filePath}:`, err);
    }
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('multitools_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('multitools_theme', theme);
    updateThemeIcons(theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  function updateThemeIcons(theme) {
    const icons = document.querySelectorAll('#theme-toggle-icon, #mobile-theme-icon');
    icons.forEach(icon => {
      if (theme === 'dark') {
        icon.className = 'bi bi-sun-fill text-warning';
      } else {
        icon.className = 'bi bi-moon-stars text-secondary';
      }
    });
  }

  // --- Favorites Manager ---
  window.getFavorites = function() {
    try {
      return JSON.parse(localStorage.getItem('multitools_favorites') || '[]');
    } catch {
      return [];
    }
  };

  window.isFavorite = function(toolId) {
    return window.getFavorites().includes(toolId);
  };

  window.toggleFavorite = function(toolId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const favs = window.getFavorites();
    const index = favs.indexOf(toolId);
    let isNowFav = false;

    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.push(toolId);
      isNowFav = true;
    }

    localStorage.setItem('multitools_favorites', JSON.stringify(favs));
    updateFavoritesUI();
    showToast(isNowFav ? 'Added to Favorites ⭐' : 'Removed from Favorites');

    // Trigger custom event for home page re-filtering
    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { toolId, isNowFav } }));
    return isNowFav;
  };

  function updateFavoritesUI() {
    const favs = window.getFavorites();
    const countEl = document.getElementById('header-fav-count');
    if (countEl) {
      countEl.textContent = favs.length;
    }

    // Update favorite buttons across page
    document.querySelectorAll('[data-favorite-tool-id]').forEach(btn => {
      const id = btn.getAttribute('data-favorite-tool-id');
      if (favs.includes(id)) {
        btn.classList.add('active', 'text-warning');
        btn.classList.remove('text-secondary', 'text-muted');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'bi bi-star-fill text-warning';
      } else {
        btn.classList.remove('active', 'text-warning');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'bi bi-star';
      }
    });
  }

  // --- Recent Tools Tracker ---
  function recordCurrentTool() {
    const path = window.location.pathname;
    if (!path.includes('/tools/')) return;

    const toolFile = path.split('/').pop();
    const toolId = toolFile.replace('.html', '');

    try {
      let recent = JSON.parse(localStorage.getItem('multitools_recent') || '[]');
      recent = recent.filter(id => id !== toolId);
      recent.unshift(toolId);
      if (recent.length > 8) recent = recent.slice(0, 8);
      localStorage.setItem('multitools_recent', JSON.stringify(recent));
    } catch (e) {
      console.warn(e);
    }
  }

  // --- Toast Notification ---
  window.showToast = function(message, type = 'info') {
    let container = document.getElementById('custom-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'custom-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    let iconClass = 'bi-info-circle-fill text-info';
    if (message.includes('Copied') || message.includes('Success') || message.includes('Added')) {
      iconClass = 'bi-check-circle-fill text-success';
    }

    toast.innerHTML = `<i class="bi ${iconClass} fs-5"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  };

  // --- Clipboard Helper ---
  window.copyToClipboard = function(text, successMsg = 'Copied to clipboard!') {
    if (!text) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg);
    });
  };

  // --- Header Initialization ---
  function initHeader() {
    // Theme toggle buttons
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const mobileToggleBtn = document.getElementById('mobile-theme-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', toggleTheme);
    updateThemeIcons(localStorage.getItem('multitools_theme') || 'light');

    // Favorites counter
    updateFavoritesUI();

    // Measure sticky navbar
    updateNavbarHeight();

    // Global Search Modal setup
    initGlobalSearchModal();
  }

  // --- Global Search Modal Logic ---
  function initGlobalSearchModal() {
    const modalInput = document.getElementById('globalModalSearchInput');
    const resultsList = document.getElementById('globalSearchResultsList');
    const countEl = document.getElementById('globalSearchResultsCount');
    const modalEl = document.getElementById('globalSearchModal');
    if (!modalInput || !resultsList) return;

    function renderModalResults(query) {
      const q = (query || '').toLowerCase().trim();
      const catalog = window.TOOLS_CATALOG || [];

      let filtered = [];
      if (!q) {
        // Show featured or popular tools initially
        filtered = catalog.filter(t => t.featured).slice(0, 10);
        if (countEl) countEl.textContent = 'Recommended Tools';
      } else {
        filtered = catalog.filter(t => {
          return t.name.toLowerCase().includes(q) ||
                 t.category.toLowerCase().includes(q) ||
                 t.description.toLowerCase().includes(q) ||
                 (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)));
        });
        if (countEl) countEl.textContent = `Found ${filtered.length} tool${filtered.length === 1 ? '' : 's'}`;
      }

      if (filtered.length === 0) {
        resultsList.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-emoji-frown fs-2 mb-2 d-block"></i>
            <div>No matching tools found for "<strong>${query}</strong>"</div>
            <div class="small mt-1">Try searching for keywords like "image", "calculate", "hash", "convert"</div>
          </div>
        `;
        return;
      }

      const isToolPage = window.location.pathname.includes('/tools/');

      resultsList.innerHTML = filtered.map((t, idx) => {
        const targetUrl = isToolPage ? t.url.replace('/tools/', './') : t.url;
        return `
          <a href="${targetUrl}" class="search-result-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <div class="tool-icon-wrapper mb-0" style="width: 36px; height: 36px; font-size: 1.1rem; border-radius: 8px;">
              <i class="bi ${t.icon}"></i>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center justify-content-between">
                <span class="fw-semibold text-body">${t.name}</span>
                <span class="badge bg-secondary-subtle text-secondary-emphasis" style="font-size: 0.7rem;">${t.category}</span>
              </div>
              <div class="small text-muted text-truncate" style="max-width: 520px;">${t.description}</div>
            </div>
            <i class="bi bi-chevron-right text-muted small ms-2"></i>
          </a>
        `;
      }).join('');
    }

    modalInput.addEventListener('input', (e) => {
      renderModalResults(e.target.value);
    });

    if (modalEl) {
      modalEl.addEventListener('shown.bs.modal', () => {
        modalInput.value = '';
        renderModalResults('');
        modalInput.focus();
      });
    }

    // Keyboard navigation in search results
    modalInput.addEventListener('keydown', (e) => {
      const items = resultsList.querySelectorAll('.search-result-item');
      if (!items.length) return;

      let currentIndex = -1;
      items.forEach((item, index) => {
        if (item.classList.contains('active')) currentIndex = index;
      });

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items.forEach(i => i.classList.remove('active'));
        items[nextIndex].classList.add('active');
        items[nextIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items.forEach(i => i.classList.remove('active'));
        items[prevIndex].classList.add('active');
        items[prevIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentIndex >= 0 && items[currentIndex]) {
          items[currentIndex].click();
        } else if (items[0]) {
          items[0].click();
        }
      }
    });
  }

  // --- Dynamic Sticky Measurement for Navbar & Category Nav ---
  function updateNavbarHeight() {
    const header = document.querySelector('header.sticky-top') || document.querySelector('.navbar.sticky-top') || document.querySelector('.navbar');
    if (header) {
      const height = header.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty('--navbar-height', height + 'px');
      }
    }
  }

  window.addEventListener('resize', updateNavbarHeight);
  window.addEventListener('orientationchange', updateNavbarHeight);

  // --- Keyboard Shortcut (Ctrl+K / Cmd+K) ---
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const modalEl = document.getElementById('globalSearchModal');
      if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }
  });

  // --- DOM Ready Lifecycle ---
  function onReady(fn) {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      setTimeout(fn, 1);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  // Initialize theme as soon as script evaluates to prevent flashing
  initTheme();

  onReady(() => {
    initTheme();
    updateNavbarHeight();
    loadComponent('#header-placeholder', 'components/header.html');
    loadComponent('#footer-placeholder', 'components/footer.html');
    recordCurrentTool();
  });
})();
