/**
 * KRONOS NUTRITION / NUTRI FORGE 10 - PRODUCTS CATALOG CONTROLLER (VANILLA JS)
 * Handles dedicated category views, sidebar toggle, real dynamic filtering,
 * instant transitions, and UI synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return; // Not on a products list page

  const catalogLayout = document.getElementById('catalog-layout');
  const headerTitle = document.getElementById('catalog-header-title');
  const headerSubtitle = document.getElementById('catalog-header-subtitle');
  const headerSectionTag = document.getElementById('catalog-section-tag');

  // Parse URL Parameters
  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get('category') || 'all';
  let searchQuery = urlParams.get('search') || '';
  let onlyPromo = urlParams.get('promo') === '1' || urlParams.get('promo') === 'true';
  let activeSort = 'featured';
  let inStockOnly = false;
  let maxPrice = 30000;

  // UI Elements
  const searchInput = document.getElementById('catalog-search');
  const sortSelect = document.getElementById('catalog-sort');
  const priceRange = document.getElementById('price-range');
  const priceDisplay = document.getElementById('price-range-val');
  const stockCheckbox = document.getElementById('filter-in-stock');
  const promoCheckbox = document.getElementById('filter-promo');
  const resultCount = document.getElementById('result-count');
  
  const topCategoryTabs = document.querySelectorAll('.category-nav-tab');
  const sidebarCategoryPills = document.querySelectorAll('.filter-pill-item');

  // Sync initial search / promo UI
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }
  if (promoCheckbox && onlyPromo) {
    promoCheckbox.checked = true;
  }

  // Sync active states across all category controls and navigation links
  function syncCategoryUI() {
    const isSpecific = activeCategory && activeCategory !== 'all';
    const normActive = typeof normalizeCategory === 'function' ? normalizeCategory(activeCategory) : activeCategory.toLowerCase();

    // 1. Top Category Tabs
    topCategoryTabs.forEach(tab => {
      const cat = tab.getAttribute('data-category') || 'all';
      const normCat = typeof normalizeCategory === 'function' ? normalizeCategory(cat) : cat.toLowerCase();
      if ((!isSpecific && cat === 'all') || (isSpecific && normCat === normActive)) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 2. Sidebar Category Pills
    sidebarCategoryPills.forEach(pill => {
      const cat = pill.getAttribute('data-category') || 'all';
      const normCat = typeof normalizeCategory === 'function' ? normalizeCategory(cat) : cat.toLowerCase();
      if ((!isSpecific && cat === 'all') || (isSpecific && normCat === normActive)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // 3. Header & Mobile Navigation Links
    document.querySelectorAll('.main-nav .nav-link, .mobile-nav-drawer .nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('category=')) {
        const linkCat = new URL(href, window.location.origin).searchParams.get('category');
        const normLinkCat = typeof normalizeCategory === 'function' ? normalizeCategory(linkCat) : (linkCat ? linkCat.toLowerCase() : '');
        if (isSpecific && normLinkCat === normActive) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      } else if (href === 'products.html' || href === 'products.html?category=all') {
        if (!isSpecific) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });

    // 4. Update Header Banners and Layout Mode
    if (catalogLayout) {
      if (isSpecific) {
        // Switch to Dedicated Category View: Hides filter sidebar completely
        catalogLayout.classList.add('is-category-view');

        if (headerTitle) headerTitle.textContent = activeCategory.toUpperCase();
        if (headerSectionTag) headerSectionTag.textContent = 'Catégorie Dédiée';
        if (headerSubtitle) headerSubtitle.textContent = `Affichage exclusif des compléments & produits de la catégorie ${activeCategory}.`;
      } else {
        // Switch to Full Catalog View: Displays filter sidebar
        catalogLayout.classList.remove('is-category-view');

        if (headerTitle) headerTitle.textContent = 'Boutique & Suppléments';
        if (headerSectionTag) headerSectionTag.textContent = 'Catalogue Officiel';
        if (headerSubtitle) headerSubtitle.textContent = 'Sélectionnez une catégorie pour afficher uniquement ses produits dédiés.';
      }
    }
  }

  // Function to set and switch category instantly
  function setCategory(cat) {
    activeCategory = (!cat || cat === 'all') ? 'all' : cat;
    syncCategoryUI();

    // Update URL history without page reload
    const newUrl = new URL(window.location);
    if (activeCategory === 'all') {
      newUrl.searchParams.delete('category');
    } else {
      newUrl.searchParams.set('category', activeCategory);
    }
    window.history.pushState({ category: activeCategory }, '', newUrl);

    renderCatalog();
  }

  window.filterCatalogByCategory = setCategory;

  // Bind Top Category Tabs
  topCategoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = tab.getAttribute('data-category') || 'all';
      setCategory(cat);
    });
  });

  // Bind Sidebar Category Pills
  sidebarCategoryPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = pill.getAttribute('data-category') || 'all';
      setCategory(cat);
    });
  });

  // Intercept category navigation in top navbar & mobile drawer if on products.html
  document.querySelectorAll('.main-nav a, .mobile-nav-drawer a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('products.html')) {
      link.addEventListener('click', (e) => {
        const targetUrl = new URL(href, window.location.origin);
        const cat = targetUrl.searchParams.get('category') || 'all';
        e.preventDefault();
        setCategory(cat);
        // Close mobile drawer if open
        const mobileDrawer = document.querySelector('.mobile-nav-drawer');
        if (mobileDrawer && mobileDrawer.classList.contains('active')) {
          mobileDrawer.classList.remove('active');
        }
      });
    }
  });

  // Handle browser Back / Forward navigation
  window.addEventListener('popstate', () => {
    const currentParams = new URLSearchParams(window.location.search);
    activeCategory = currentParams.get('category') || 'all';
    searchQuery = currentParams.get('search') || '';
    if (searchInput) searchInput.value = searchQuery;
    syncCategoryUI();
    renderCatalog();
  });

  // Bind Search Input (For All Products View)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderCatalog();
    });
  }

  // Bind Sort Select
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderCatalog();
    });
  }

  // Bind Price Range (For All Products View)
  if (priceRange) {
    priceRange.addEventListener('input', (e) => {
      maxPrice = parseInt(e.target.value, 10);
      if (priceDisplay) priceDisplay.textContent = formatPrice(maxPrice);
      renderCatalog();
    });
  }

  // Bind Stock & Promo Checkboxes (For All Products View)
  if (stockCheckbox) {
    stockCheckbox.addEventListener('change', (e) => {
      inStockOnly = e.target.checked;
      renderCatalog();
    });
  }

  if (promoCheckbox) {
    promoCheckbox.addEventListener('change', (e) => {
      onlyPromo = e.target.checked;
      renderCatalog();
    });
  }

  // Initial Sync & Render
  syncCategoryUI();
  renderCatalog();

  function renderCatalog() {
    const isSpecificCat = activeCategory && activeCategory !== 'all';
    const allStored = getProducts().filter(p => p.status !== 'hidden');
    let products = [];

    if (isSpecificCat) {
      // DEDICATED CATEGORY VIEW: Strictly filter by category only
      const targetNorm = typeof normalizeCategory === 'function' ? normalizeCategory(activeCategory) : activeCategory.toLowerCase();
      products = allStored.filter(p => {
        const prodCatNorm = typeof normalizeCategory === 'function' ? normalizeCategory(p.category) : (p.category ? p.category.toLowerCase() : '');
        return prodCatNorm === targetNorm;
      });
    } else {
      // ALL PRODUCTS VIEW: Full catalog with sidebar filters
      products = [...allStored];

      if (searchQuery) {
        products = products.filter(p => 
          (p.name && p.name.toLowerCase().includes(searchQuery)) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery)) ||
          (p.category && p.category.toLowerCase().includes(searchQuery)) ||
          (p.shortDesc && p.shortDesc.toLowerCase().includes(searchQuery))
        );
      }

      if (onlyPromo) {
        products = products.filter(p => p.isPromo || (p.oldPrice && p.oldPrice > p.price));
      }

      if (inStockOnly) {
        products = products.filter(p => p.stock > 0);
      }

      if (maxPrice) {
        products = products.filter(p => p.price <= maxPrice);
      }
    }

    // Sort Products
    products.sort((a, b) => {
      switch (activeSort) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'featured':
        default:
          return (b.stock > 0 ? 1 : -1) - (a.stock > 0 ? 1 : -1);
      }
    });

    // Update Result Counter
    if (resultCount) {
      if (isSpecificCat) {
        resultCount.textContent = `${products.length} référence${products.length > 1 ? 's' : ''} dans « ${activeCategory} »`;
      } else {
        resultCount.textContent = `${products.length} produit${products.length > 1 ? 's' : ''} au total`;
      }
    }

    // Render Empty State if no products match
    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center;">
          <div class="empty-state-icon" style="font-size: 2.6rem; margin-bottom: 12px;">🏷️</div>
          <h3 style="font-size: 1.4rem; text-transform: uppercase; margin-bottom: 8px; color: var(--text-primary);">
            ${isSpecificCat ? `Aucun produit dans « ${activeCategory} »` : 'Aucun produit trouvé'}
          </h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 460px; margin: 0 auto 24px;">
            ${isSpecificCat 
              ? `Il n'y a actuellement aucun article enregistré dans cette catégorie. Vous pouvez ajouter des produits depuis votre Dashboard.`
              : 'Essayez de modifier vos filtres ou termes de recherche.'
            }
          </p>
          <button class="btn btn-secondary" onclick="window.filterCatalogByCategory('all')">Voir tous les produits</button>
        </div>
      `;
      return;
    }

    // Render Products Grid
    productsGrid.innerHTML = products.map(product => {
      const isOutOfStock = product.stock <= 0;
      const isLowStock = product.stock > 0 && product.stock <= 5;
      const hasDiscount = product.isPromo || (product.oldPrice && product.oldPrice > product.price);
      const discountPercent = hasDiscount && product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

      return `
        <div class="product-card" data-id="${product.id}">
          <div class="product-image-wrap">
            <div class="badge-stack">
              ${hasDiscount ? `<span class="badge badge-promo">PROMO ${discountPercent ? `-${discountPercent}%` : ''}</span>` : ''}
              <span class="badge badge-category">${product.category}</span>
            </div>
            <a href="product.html?id=${product.id}">
              <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80'">
            </a>
          </div>
          
          <div class="product-card-body">
            <div class="product-meta-row">
              <span class="product-brand">${product.brand || 'NUTRI FORGE'}</span>
              ${
                isOutOfStock ? `<span class="badge badge-stock-out">Rupture</span>` :
                isLowStock ? `<span class="badge badge-stock-low">Reste ${product.stock}</span>` :
                `<span class="badge badge-stock-in">En Stock</span>`
              }
            </div>

            <h3 class="product-title">
              <a href="product.html?id=${product.id}">${product.name}</a>
            </h3>

            <p class="product-desc-short">${product.shortDesc || ''}</p>

            <div class="product-price-row">
              <span class="product-price">${formatPrice(product.price)}</span>
              ${product.oldPrice && product.oldPrice > product.price ? `<span class="product-old-price">${formatPrice(product.oldPrice)}</span>` : ''}
            </div>

            <div class="product-card-footer">
              <button 
                class="btn btn-primary btn-block ${isOutOfStock ? 'disabled' : ''}" 
                ${isOutOfStock ? 'disabled' : ''}
                onclick="addToCart('${product.id}', 1)"
              >
                ${isOutOfStock ? 'Épuisé' : 'Ajouter au panier'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
});

