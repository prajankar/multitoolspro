// MultiTools Pro - Home Page Interactive Script
(function() {
  'use strict';

  let currentCategory = 'all';
  let searchQuery = '';

  const searchInput = document.getElementById('heroSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const toolsCountEl = document.getElementById('toolsCountDisplay');
  const categoriesContainer = document.getElementById('categoriesGridContainer');
  const recentSection = document.getElementById('recentSection');
  const recentGrid = document.getElementById('recentGrid');
  const noResultsEl = document.getElementById('noResultsContainer');

  // --- Render All Tools Grouped by Category ---
  function renderCatalog() {
    const catalog = window.TOOLS_CATALOG || [];
    const categories = window.TOOLS_CATEGORIES || [];
    const favorites = window.getFavorites();

    const q = searchQuery.toLowerCase().trim();

    // Filter tools
    let filtered = catalog.filter(t => {
      // Category filter
      if (currentCategory === 'favorites') {
        if (!favorites.includes(t.id)) return false;
      } else if (currentCategory !== 'all' && t.category !== currentCategory) {
        return false;
      }

      // Search query filter
      if (q) {
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesCat = t.category.toLowerCase().includes(q);
        const matchesTags = t.tags && t.tags.some(tag => tag.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesCat || matchesTags;
      }
      return true;
    });

    // Update count display
    if (toolsCountEl) {
      if (currentCategory === 'favorites') {
        toolsCountEl.textContent = `Showing ${filtered.length} favorite tool${filtered.length === 1 ? '' : 's'}`;
      } else if (q) {
        toolsCountEl.textContent = `Found ${filtered.length} of ${catalog.length} tools matching "${searchQuery}"`;
      } else if (currentCategory !== 'all') {
        toolsCountEl.textContent = `Showing ${filtered.length} tools in ${currentCategory}`;
      } else {
        toolsCountEl.textContent = `Showing all ${filtered.length} tools`;
      }
    }

    // Handle empty results
    if (filtered.length === 0) {
      categoriesContainer.innerHTML = '';
      if (noResultsEl) {
        noResultsEl.classList.remove('d-none');
        const queryTextEl = document.getElementById('noResultsQuery');
        if (queryTextEl) {
          queryTextEl.textContent = currentCategory === 'favorites' ? 'You have no favorited tools yet. Click the star icon on any tool card to bookmark it!' : `No tools found matching "${searchQuery}"`;
        }
      }
      return;
    } else {
      if (noResultsEl) noResultsEl.classList.add('d-none');
    }

    // If searching or in single category/favorites, display a single unified grid
    if (q || currentCategory !== 'all') {
      const cardsHtml = filtered.map(t => renderToolCard(t, favorites)).join('');
      categoriesContainer.innerHTML = `
        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mb-5">
          ${cardsHtml}
        </div>
      `;
      return;
    }

    // Default: Group by Category sections with headers
    let fullHtml = '';
    categories.forEach((cat, index) => {
      const catTools = filtered.filter(t => t.category === cat.name);
      if (catTools.length === 0) return;

      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cardsHtml = catTools.map(t => renderToolCard(t, favorites)).join('');

      // Insert Mid-Feed In-Content Ad after the 2nd category
      let adHtml = '';
      if (index === 2) {
        adHtml = `
          <div class="ad-slot-container ad-incontent my-4">
            <div class="d-flex justify-content-between w-100 align-items-center mb-1">
              <span class="ad-label text-uppercase small text-muted">Sponsored • Google AdSense</span>
              <span class="badge bg-secondary-subtle text-secondary-emphasis" style="font-size: 0.65rem;">Recommended</span>
            </div>
            <div class="d-flex flex-wrap align-items-center justify-content-between w-100 p-2 text-start">
              <div class="d-flex align-items-center gap-3">
                <i class="bi bi-speedometer2 text-primary fs-2"></i>
                <div>
                  <div class="fw-bold text-body small">Next-Gen Cloud Database & Storage</div>
                  <div class="text-muted small" style="font-size: 0.78rem;">Ultra-low latency serverless database with instant global replication.</div>
                </div>
              </div>
              <a href="https://cloud.google.com" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary rounded-pill px-3 mt-2 mt-sm-0">Get Started Free</a>
            </div>
          </div>
        `;
      }

      fullHtml += `
        <section class="category-section" id="${slug}">
          <div class="category-header">
            <h2 class="category-title h4 mb-0">
              <i class="bi ${cat.icon} text-primary me-2"></i>
              ${cat.name}
              <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill fs-6 ms-2">${catTools.length}</span>
            </h2>
            <a href="#top" class="text-muted small text-decoration-none d-none d-sm-inline">
              <i class="bi bi-arrow-up-short"></i> Top
            </a>
          </div>
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
            ${cardsHtml}
          </div>
        </section>
        ${adHtml}
      `;
    });

    categoriesContainer.innerHTML = fullHtml;
  }

  // Helper to get category theme class and display label
  function getToolThemeAndCategory(t) {
    let theme = 'theme-text';
    let catLabel = t.category;
    
    if (t.id && t.id.includes('pdf')) {
      theme = 'theme-pdf';
      catLabel = 'Pdf Tools';
    } else if (t.category === 'Image Tools') {
      theme = 'theme-image';
      catLabel = 'Image Tools';
    } else if (t.category === 'SEO Tools') {
      theme = 'theme-seo';
      catLabel = 'SEO Tools';
    } else if (t.category === 'Text Tools') {
      theme = 'theme-text';
      catLabel = 'Text Tools';
    } else if (t.category === 'Developer Tools') {
      theme = 'theme-dev';
      catLabel = 'Developer Tools';
    } else if (t.category === 'Math & Calculators') {
      theme = 'theme-math';
      catLabel = 'Calculators';
    } else if (t.category === 'Unit Converters') {
      theme = 'theme-unit';
      catLabel = 'Unit Converters';
    } else if (t.category === 'Security & Encryption') {
      theme = 'theme-security';
      catLabel = 'Security';
    } else if (t.category === 'Social Media Tools') {
      theme = 'theme-social';
      catLabel = 'Social Media';
    }
    return { theme, catLabel };
  }

  // --- Render Single Tool Card HTML ---
  function renderToolCard(tool, favorites) {
    const isFav = favorites.includes(tool.id);
    const { theme, catLabel } = getToolThemeAndCategory(tool);

    return `
      <div class="col">
        <a href="${tool.url}" class="tool-card ${theme}" id="card-${tool.id}">
          <button class="btn-favorite-card ${isFav ? 'active' : ''}" 
                  data-favorite-tool-id="${tool.id}" 
                  onclick="toggleFavorite('${tool.id}', event)" 
                  title="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
                  aria-label="Bookmark tool">
            <i class="bi ${isFav ? 'bi-star-fill' : 'bi-star'}"></i>
          </button>
          <div class="tool-card-top">
            <div class="tool-icon-wrapper">
              <i class="bi ${tool.icon}"></i>
            </div>
            <div class="tool-card-header-text">
              <h3 class="tool-card-title">${tool.name}</h3>
              <span class="tool-card-category">${catLabel}</span>
            </div>
          </div>
          <p class="tool-card-desc">${tool.description}</p>
        </a>
      </div>
    `;
  }

  // --- Render Recently Visited Tools ---
  function renderRecentTools() {
    if (!recentSection || !recentGrid) return;
    try {
      const recentIds = JSON.parse(localStorage.getItem('multitools_recent') || '[]');
      if (!recentIds.length) {
        recentSection.classList.add('d-none');
        return;
      }
      const catalog = window.TOOLS_CATALOG || [];
      const recentTools = recentIds.map(id => catalog.find(t => t.id === id)).filter(Boolean);

      if (!recentTools.length) {
        recentSection.classList.add('d-none');
        return;
      }

      const favorites = window.getFavorites();
      recentGrid.innerHTML = recentTools.slice(0, 4).map(t => renderToolCard(t, favorites)).join('');
      recentSection.classList.remove('d-none');
    } catch {
      recentSection.classList.add('d-none');
    }
  }

  // --- Category Filter Navigation Handler ---
  function initCategoryFilters() {
    document.querySelectorAll('.category-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category');

        // Scroll to category if specific anchor or top
        if (currentCategory !== 'all' && currentCategory !== 'favorites') {
          const slug = currentCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const targetEl = document.getElementById(slug);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }

        renderCatalog();
      });
    });

    // Check URL query parameters (e.g. ?filter=favorites or ?cat=...)
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam === 'favorites') {
      const favBtn = document.querySelector('[data-category="favorites"]');
      if (favBtn) {
        document.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
        favBtn.classList.add('active');
        currentCategory = 'favorites';
      }
    }
  }

  // --- Live Search Input ---
  function initSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('d-none', !searchQuery);
      }
      renderCatalog();
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('d-none');
        searchInput.focus();
        renderCatalog();
      });
    }
  }

  // Listen to favorite toggles to live update Home UI
  window.addEventListener('favoritesUpdated', () => {
    renderCatalog();
    renderRecentTools();
  });

  // --- Initialize on DOM Loaded ---
  function onReady(fn) {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      setTimeout(fn, 1);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(() => {
    initCategoryFilters();
    initSearch();
    renderCatalog();
    renderRecentTools();
  });
})();
