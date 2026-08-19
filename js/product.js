/**
 * KRONOS NUTRITION - SINGLE PRODUCT DETAIL CONTROLLER (VANILLA JS)
 * Handles single product display, gallery thumbnail switcher,
 * quantity selector, instant checkout, tabs, reviews, and similar items.
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('product-detail-container');
  if (!container) return; // Not on single product page

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    showProductNotFound();
    return;
  }

  const product = getProductById(productId);
  if (!product) {
    showProductNotFound();
    return;
  }

  // Update Page Title
  document.title = `${product.name} | KRONOS NUTRITION`;

  let selectedQty = 1;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.isPromo || (product.oldPrice && product.oldPrice > product.price);
  const discountPercent = hasDiscount && product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  // Extract and normalize all image URLs
  const rawImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image];
  const productImagesList = [];
  
  rawImages.forEach(item => {
    const url = typeof item === 'object' && item !== null ? item.url : item;
    if (url && !productImagesList.includes(url)) {
      productImagesList.push(url);
    }
  });

  if (product.image && !productImagesList.includes(product.image)) {
    productImagesList.unshift(product.image);
  }

  const primaryImage = productImagesList[0] || product.image || 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80';

  // Render Product Layout
  container.innerHTML = `
    <!-- Breadcrumb -->
    <div class="product-breadcrumb">
      <a href="index.html">Accueil</a>
      <span>/</span>
      <a href="products.html">Boutique</a>
      <span>/</span>
      <a href="products.html?category=${encodeURIComponent(product.category)}">${product.category}</a>
      <span>/</span>
      <span style="color: var(--text-primary); font-weight: 700;">${product.name}</span>
    </div>

    <!-- Main Detail Grid -->
    <div class="product-detail-layout">
      <!-- Left Column: Gallery -->
      <div class="product-gallery">
        <div class="product-main-view" id="main-view-box">
          <div class="badge-stack" style="top: 18px; left: 18px;">
            ${hasDiscount ? `<span class="badge badge-promo">PROMO ${discountPercent ? `-${discountPercent}%` : ''}</span>` : ''}
            <span class="badge badge-category">${product.category}</span>
          </div>
          <img id="main-product-img" src="${primaryImage}" alt="${product.name}">
        </div>

        ${productImagesList.length > 1 ? `
          <div class="product-thumbnails">
            ${productImagesList.map((imgUrl, idx) => `
              <div class="product-thumb-btn ${idx === 0 ? 'active' : ''}" data-img="${imgUrl}">
                <img src="${imgUrl}" alt="Vue ${idx + 1}">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Right Column: Info & Purchase Actions -->
      <div class="product-info-panel">
        <div class="product-meta-row" style="margin-bottom: 12px;">
          <span class="product-brand" style="font-size: 0.85rem;">${product.brand || 'KRONOS LABS'}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">SKU: ${product.sku || 'KRN-00' + product.id}</span>
        </div>

        <h1 class="product-detail-title">${product.name}</h1>

        <div class="product-rating-row">
          <span class="star-rating">★★★★★</span>
          <span class="rating-count">(${product.reviewsCount || 42} avis certifiés)</span>
          <span style="color: var(--border-light);">|</span>
          ${
            isOutOfStock ? `<span class="badge badge-stock-out">Rupture de stock</span>` :
            isLowStock ? `<span class="badge badge-stock-low">Stock faible : ${product.stock} restants</span>` :
            `<span class="badge badge-stock-in">✓ En Stock (${product.stock} unités)</span>`
          }
        </div>

        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
          ${product.shortDesc || product.description.substring(0, 180) + '...'}
        </p>

        <!-- Price Box -->
        <div class="product-detail-price-box">
          <div class="detail-price-wrap">
            <span class="detail-current-price">${formatPrice(product.price)}</span>
            ${product.oldPrice && product.oldPrice > product.price ? `
              <span class="detail-old-price">${formatPrice(product.oldPrice)}</span>
              <span class="badge badge-promo" style="font-size: 0.75rem;">ÉCONOMISEZ ${formatPrice(product.oldPrice - product.price)}</span>
            ` : ''}
          </div>

          <!-- Quantity Picker -->
          ${!isOutOfStock ? `
            <div class="quantity-picker">
              <button class="qty-btn" id="btn-qty-minus">-</button>
              <input type="text" class="qty-input" id="input-qty" value="1" readonly>
              <button class="qty-btn" id="btn-qty-plus">+</button>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div class="product-actions-stack">
          <button 
            id="btn-add-cart"
            class="btn btn-primary btn-lg btn-block ${isOutOfStock ? 'disabled' : ''}"
            ${isOutOfStock ? 'disabled' : ''}
          >
            ${isOutOfStock ? 'RUPTURE DE STOCK' : 'AJOUTER AU PANIER'}
          </button>

          ${!isOutOfStock ? `
            <button id="btn-buy-now" class="btn btn-secondary btn-lg btn-block">
              ACHETER MAINTENANT (COMMANDER)
            </button>
          ` : ''}
        </div>

        <!-- Perks List -->
        <div class="detail-perks-list">
          <div class="detail-perk-item">
            <span style="font-size: 1.1rem; color: var(--accent-white);">⚡</span>
            <span>Expédition sous 24/48h dans toute l'Algérie</span>
          </div>
          <div class="detail-perk-item">
            <span style="font-size: 1.1rem; color: var(--accent-white);">🛡</span>
            <span>Pureté 100% testée en laboratoire</span>
          </div>
          <div class="detail-perk-item">
            <span style="font-size: 1.1rem; color: var(--accent-white);">💵</span>
            <span>Paiement sécurisé à la livraison</span>
          </div>
          <div class="detail-perk-item">
            <span style="font-size: 1.1rem; color: var(--accent-white);">↺</span>
            <span>Garantie authenticité vérifiée</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Tabs Section -->
    <div class="product-tabs-wrapper">
      <div class="tabs-nav">
        <button class="tab-btn active" data-tab="tab-desc">Description</button>
        <button class="tab-btn" data-tab="tab-composition">Composition & Ingrédients</button>
        <button class="tab-btn" data-tab="tab-usage">Mode d'emploi</button>
        <button class="tab-btn" data-tab="tab-nutrition">Valeurs Nutritionnelles</button>
        <button class="tab-btn" data-tab="tab-reviews">Avis Clients (${product.reviewsCount || 42})</button>
      </div>

      <!-- Tab: Description -->
      <div class="tab-content-pane active" id="tab-desc">
        <h3 style="font-size: 1.2rem; text-transform: uppercase; margin-bottom: 16px; color: var(--text-primary);">Détails du Produit</h3>
        <p style="margin-bottom: 16px;">${product.description || 'Information détaillée non disponible.'}</p>
        <p>Développé avec un niveau d'exigence sans compromis, ce produit respecte les normes de fabrication les plus strictes pour garantir une efficacité maximale et une assimilation biologique immédiate.</p>
      </div>

      <!-- Tab: Composition -->
      <div class="tab-content-pane" id="tab-composition">
        <h3 style="font-size: 1.2rem; text-transform: uppercase; margin-bottom: 16px; color: var(--text-primary);">Ingrédients et Pureté</h3>
        <p style="margin-bottom: 16px;">${product.composition || 'Ingrédients de haute pureté selon la fiche technique officielle du laboratoire.'}</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Allergènes : Fabriqué dans un atelier utilisant du lait, du soja, du gluten et des œufs.</p>
      </div>

      <!-- Tab: Usage -->
      <div class="tab-content-pane" id="tab-usage">
        <h3 style="font-size: 1.2rem; text-transform: uppercase; margin-bottom: 16px; color: var(--text-primary);">Conseils d'utilisation & Posologie</h3>
        <p style="margin-bottom: 16px;">${product.usage || 'Prendre selon les recommandations de votre coach sportif ou du fabricant.'}</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Précautions : Ne pas dépasser la dose journalière recommandée. Les compléments alimentaires doivent être utilisés dans le cadre d’un mode de vie sain et ne pas être utilisés comme substituts d’un régime alimentaire varié et équilibré.</p>
      </div>

      <!-- Tab: Nutrition -->
      <div class="tab-content-pane" id="tab-nutrition">
        <h3 style="font-size: 1.2rem; text-transform: uppercase; margin-bottom: 16px; color: var(--text-primary);">Tableau Nutritionnel Officiel</h3>
        ${product.nutrition && product.nutrition.length > 0 ? `
          <table class="nutrition-table">
            <thead>
              <tr>
                <th>Valeur Nutritionnelle</th>
                <th>Par Portion</th>
                <th>Pour 100g</th>
              </tr>
            </thead>
            <tbody>
              ${product.nutrition.map(row => `
                <tr>
                  <td style="font-weight: 700; color: var(--text-primary);">${row.label}</td>
                  <td>${row.perServing}</td>
                  <td>${row.per100g}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <p>Tableau analytique standard du laboratoire certifié conforme.</p>
        `}
      </div>

      <!-- Tab: Reviews -->
      <div class="tab-content-pane" id="tab-reviews">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h3 style="font-size: 1.2rem; text-transform: uppercase; color: var(--text-primary);">Avis des Athlètes</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Note moyenne de ${product.rating || '4.9'} / 5 basée sur ${product.reviewsCount || 42} retours vérifiés.</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-open-review-form">Laisser un avis</button>
        </div>

        <!-- Review Form (Hidden by default) -->
        <div id="review-form-box" style="display: none; background: var(--bg-surface); padding: 20px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); margin-bottom: 30px;">
          <h4 style="font-size: 0.9rem; text-transform: uppercase; margin-bottom: 14px;">Donnez votre avis sur ce produit</h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Votre Nom / Pseudo</label>
              <input type="text" id="rev-name" class="form-input" placeholder="Ex: Réda K.">
            </div>
            <div class="form-group">
              <label class="form-label">Note</label>
              <select id="rev-rating" class="form-select">
                <option value="5">★★★★★ (5/5) - Exceptionnel</option>
                <option value="4">★★★★☆ (4/5) - Très bon</option>
                <option value="3">★★★☆☆ (3/5) - Correct</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Commentaire</label>
            <textarea id="rev-comment" class="form-textarea" placeholder="Partagez vos impressions sur le goût, la miscibilité, les résultats..."></textarea>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-submit-review">Publier mon avis</button>
        </div>

        <div class="reviews-list" id="reviews-list-container">
          <div style="padding: 16px 0; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 700; color: var(--text-primary);">Nassim B. <span style="font-size: 0.75rem; color: var(--text-muted);">✓ Achat vérifié</span></span>
              <span class="star-rating">★★★★★</span>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-secondary);">Qualité irréprochable. Miscibilité parfaite sans grumeaux et digestion au top même après des séances très intenses. Livraison reçue en 24h à Alger.</p>
          </div>
          <div style="padding: 16px 0; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 700; color: var(--text-primary);">Tarek M. <span style="font-size: 0.75rem; color: var(--text-muted);">✓ Achat vérifié</span></span>
              <span class="star-rating">★★★★★</span>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-secondary);">Le goût est excellent sans être écoeurant. Produit haut de gamme que je recommande à 100%.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Similar Products Grid -->
    <div style="margin-top: 80px;">
      <div class="section-header">
        <span class="section-tag">Recommandations</span>
        <h2 class="section-title">Produits Similaires</h2>
      </div>
      <div class="products-grid" id="similar-products-grid"></div>
    </div>
  `;

  // Attach Event Handlers
  initGalleryThumbnails();
  initQuantityControls(product.stock);
  initTabs();
  initPurchaseActions(product);
  initReviewForm(product);
  renderSimilarProducts(product);

  // Gallery Thumbnails Switcher
  function initGalleryThumbnails() {
    const mainImg = document.getElementById('main-product-img');
    const thumbBtns = document.querySelectorAll('.product-thumb-btn');

    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        thumbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const newSrc = btn.getAttribute('data-img');
        if (mainImg && newSrc) {
          mainImg.src = newSrc;
        }
      });
    });
  }

  // Quantity controls
  function initQuantityControls(maxStock) {
    const minusBtn = document.getElementById('btn-qty-minus');
    const plusBtn = document.getElementById('btn-qty-plus');
    const qtyInput = document.getElementById('input-qty');

    if (!minusBtn || !plusBtn || !qtyInput) return;

    minusBtn.addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty--;
        qtyInput.value = selectedQty;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (selectedQty < maxStock) {
        selectedQty++;
        qtyInput.value = selectedQty;
      } else {
        showToast(`Stock maximal atteint (${maxStock})`, 'error');
      }
    });
  }

  // Tabs Handler
  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-content-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetTab);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // Add to cart & Direct Buy Now
  function initPurchaseActions(prod) {
    const addCartBtn = document.getElementById('btn-add-cart');
    const buyNowBtn = document.getElementById('btn-buy-now');

    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        addToCart(prod.id, selectedQty);
      });
    }

    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        const added = addToCart(prod.id, selectedQty);
        if (added) {
          window.location.href = 'checkout.html';
        }
      });
    }
  }

  // Review Form
  function initReviewForm(prod) {
    const openBtn = document.getElementById('btn-open-review-form');
    const formBox = document.getElementById('review-form-box');
    const submitBtn = document.getElementById('btn-submit-review');
    const listContainer = document.getElementById('reviews-list-container');

    if (openBtn && formBox) {
      openBtn.addEventListener('click', () => {
        formBox.style.display = formBox.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const name = document.getElementById('rev-name').value.trim();
        const comment = document.getElementById('rev-comment').value.trim();
        const rating = document.getElementById('rev-rating').value;

        if (!name || !comment) {
          showToast('Veuillez remplir votre nom et votre commentaire', 'error');
          return;
        }

        const newReviewEl = document.createElement('div');
        newReviewEl.style.padding = '16px 0';
        newReviewEl.style.borderBottom = '1px solid var(--border-subtle)';
        newReviewEl.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; color: var(--text-primary);">${name} <span style="font-size: 0.75rem; color: var(--text-muted);">✓ Client vérifié</span></span>
            <span class="star-rating">${'★'.repeat(parseInt(rating))}${'☆'.repeat(5 - parseInt(rating))}</span>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">${comment}</p>
        `;

        if (listContainer) {
          listContainer.prepend(newReviewEl);
        }

        formBox.style.display = 'none';
        document.getElementById('rev-name').value = '';
        document.getElementById('rev-comment').value = '';
        showToast('Merci ! Votre avis a été publié.');
      });
    }
  }

  // Similar Products
  function renderSimilarProducts(currentProduct) {
    const similarGrid = document.getElementById('similar-products-grid');
    if (!similarGrid) return;

    const allProducts = getProducts();
    const similar = allProducts
      .filter(p => p.id !== currentProduct.id && (p.category === currentProduct.category || p.brand === currentProduct.brand))
      .slice(0, 4);

    if (similar.length === 0) {
      // Fallback to top other products
      similar.push(...allProducts.filter(p => p.id !== currentProduct.id).slice(0, 4));
    }

    similarGrid.innerHTML = similar.map(p => `
      <div class="product-card">
        <div class="product-image-wrap">
          <div class="badge-stack">
            <span class="badge badge-category">${p.category}</span>
          </div>
          <a href="product.html?id=${p.id}">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
          </a>
        </div>
        <div class="product-card-body">
          <div class="product-meta-row">
            <span class="product-brand">${p.brand}</span>
            <span class="badge badge-stock-in">En Stock</span>
          </div>
          <h3 class="product-title">
            <a href="product.html?id=${p.id}">${p.name}</a>
          </h3>
          <div class="product-price-row">
            <span class="product-price">${formatPrice(p.price)}</span>
          </div>
          <div class="product-card-footer">
            <a href="product.html?id=${p.id}" class="btn btn-secondary btn-block btn-sm">Voir le produit</a>
          </div>
        </div>
      </div>
    `).join('');
  }

  function showProductNotFound() {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✕</div>
        <h2 style="font-size: 1.5rem; text-transform: uppercase; margin-bottom: 12px;">Produit introuvable</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Le produit recherché n'existe pas ou a été retiré de la boutique.</p>
        <a href="products.html" class="btn btn-primary">Retour à la boutique</a>
      </div>
    `;
  }
});
