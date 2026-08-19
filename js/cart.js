/**
 * KRONOS NUTRITION - CART CONTROLLER (VANILLA JS)
 * Handles cart table rendering, live quantity modification,
 * promo code discount computation, shipping estimation, and checkout initiation.
 */

let activePromoDiscount = 0; // percentage e.g. 10

document.addEventListener('DOMContentLoaded', () => {
  const cartContainer = document.getElementById('cart-page-content');
  if (!cartContainer) return; // Not on cart page

  renderCartPage();

  function renderCartPage() {
    const cart = getCart();
    const settings = getSettings();

    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h2 style="font-size: 1.6rem; text-transform: uppercase; margin-bottom: 12px;">Votre Panier est Vide</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 28px; max-width: 480px; margin-left: auto; margin-right: auto;">
            Explorez notre sélection de nutrition sportive premium et préparez vos objectifs de performance.
          </p>
          <a href="products.html" class="btn btn-primary btn-lg">DÉCOUVRIR LA BOUTIQUE</a>
        </div>
      `;
      return;
    }

    const subtotal = getCartSubtotal();
    const discountAmount = activePromoDiscount > 0 ? (subtotal * (activePromoDiscount / 100)) : 0;
    const isFreeShipping = subtotal >= (settings.freeShippingThreshold || 20000);
    const estimatedShipping = isFreeShipping ? 0 : 500; // Base estimation
    const total = Math.max(0, subtotal - discountAmount + estimatedShipping);

    cartContainer.innerHTML = `
      <div class="cart-layout">
        <!-- Left: Cart Items Table -->
        <div class="cart-items-table">
          <div class="cart-table-header">
            <span>Produit</span>
            <span>Prix Unitaire</span>
            <span style="text-align: center;">Quantité</span>
            <span style="text-align: right;">Total</span>
            <span></span>
          </div>

          <div class="cart-items-body">
            ${cart.map(item => {
              const product = getProductById(item.id);
              const maxStock = product ? product.stock : item.stock || 99;
              const lineTotal = item.price * item.qty;

              return `
                <div class="cart-item-row" data-id="${item.id}">
                  <div class="cart-item-info">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div>
                      <div class="cart-item-cat">${item.category || 'Nutrition'}</div>
                      <a href="product.html?id=${item.id}" class="cart-item-title">${item.name}</a>
                    </div>
                  </div>

                  <div style="font-weight: 700; font-size: 0.95rem;">
                    ${formatPrice(item.price)}
                  </div>

                  <div style="display: flex; justify-content: center;">
                    <div class="quantity-picker" style="height: 38px;">
                      <button class="qty-btn" onclick="modifyItemQty('${item.id}', ${item.qty - 1})">-</button>
                      <input type="text" class="qty-input" style="width: 36px; font-size: 0.85rem;" value="${item.qty}" readonly>
                      <button class="qty-btn" onclick="modifyItemQty('${item.id}', ${item.qty + 1})">+</button>
                    </div>
                  </div>

                  <div style="text-align: right; font-family: var(--font-display); font-weight: 800; font-size: 1.05rem;">
                    ${formatPrice(lineTotal)}
                  </div>

                  <div style="text-align: right;">
                    <button class="cart-remove-btn" title="Supprimer" onclick="deleteCartItem('${item.id}')">✕</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="padding: 18px 24px; background: var(--bg-dark); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: gap; gap: 16px;">
            <a href="products.html" class="btn btn-outline btn-sm">← Continuer mes achats</a>
            <button class="btn btn-secondary btn-sm" onclick="emptyEntireCart()">Vider le panier</button>
          </div>
        </div>

        <!-- Right: Order Summary Card -->
        <div class="cart-summary-card">
          <h3 class="summary-title">Résumé de la Commande</h3>

          <div class="summary-row">
            <span>Sous-total articles</span>
            <span style="font-weight: 700; color: var(--text-primary);">${formatPrice(subtotal)}</span>
          </div>

          ${activePromoDiscount > 0 ? `
            <div class="summary-row" style="color: var(--accent-white);">
              <span>Code Promo (-${activePromoDiscount}%)</span>
              <span style="font-weight: 700;">-${formatPrice(discountAmount)}</span>
            </div>
          ` : ''}

          <div class="summary-row">
            <span>Estimation Livraison</span>
            <span style="font-weight: 700; color: var(--text-primary);">
              ${isFreeShipping ? '<span class="badge badge-stock-in" style="font-size: 0.7rem;">OFFERTE</span>' : formatPrice(estimatedShipping)}
            </span>
          </div>

          ${!isFreeShipping ? `
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px;">
              💡 Plus que <strong>${formatPrice(Math.max(0, (settings.freeShippingThreshold || 20000) - subtotal))}</strong> pour bénéficier de la livraison gratuite !
            </div>
          ` : ''}

          <!-- Promo Code Input -->
          <div class="promo-form">
            <input type="text" id="cart-promo-code" class="promo-input" placeholder="Code Promo (ex: FORGE10)" value="${activePromoDiscount > 0 ? 'FORGE10' : ''}">
            <button class="btn btn-secondary btn-sm" id="btn-apply-promo">Appliquer</button>
          </div>

          <div class="summary-row total">
            <span>TOTAL ESTIMÉ</span>
            <span class="total-amount">${formatPrice(total)}</span>
          </div>

          <div style="margin-top: 24px;">
            <a href="checkout.html" class="btn btn-primary btn-lg btn-block">PASSER LA COMMANDE →</a>
          </div>

          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-subtle); font-size: 0.75rem; color: var(--text-muted); text-align: center;">
            🔒 Paiement 100% sécurisé à la livraison partout en Algérie.
          </div>
        </div>
      </div>
    `;

    // Promo Code Listener
    const applyPromoBtn = document.getElementById('btn-apply-promo');
    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', () => {
        const input = document.getElementById('cart-promo-code');
        const code = input.value.trim().toUpperCase();
        if (code === 'FORGE10' || code === 'NUTRI10' || code === 'KRONOS10' || code === 'DISCIPLINE' || code === 'TITAN10') {
          activePromoDiscount = 10;
          showToast('Code promo activé : -10% sur votre commande !');
          renderCartPage();
        } else if (code === '') {
          activePromoDiscount = 0;
          renderCartPage();
        } else {
          showToast('Code promo invalide', 'error');
        }
      });
    }
  }

  // Global Cart Actions on Cart Page
  window.modifyItemQty = function(productId, qty) {
    updateCartQty(productId, qty);
    renderCartPage();
  };

  window.deleteCartItem = function(productId) {
    removeFromCart(productId);
    renderCartPage();
  };

  window.emptyEntireCart = function() {
    if (confirm('Voulez-vous vraiment vider l\'intégralité de votre panier ?')) {
      clearCart();
      renderCartPage();
    }
  };
});
