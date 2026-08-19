/**
 * KRONOS NUTRITION - CHECKOUT CONTROLLER (VANILLA JS)
 * Handles checkout form, Wilaya/Commune selector, dynamic shipping fees,
 * live order summary calculation, stock deduction, and order placement.
 */

document.addEventListener('DOMContentLoaded', () => {
  const checkoutContainer = document.getElementById('checkout-page-content');
  if (!checkoutContainer) return; // Not on checkout page

  const cart = getCart();
  if (cart.length === 0) {
    checkoutContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h2 style="font-size: 1.5rem; text-transform: uppercase; margin-bottom: 12px;">Votre panier est vide</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Veuillez ajouter des produits avant de passer commande.</p>
        <a href="products.html" class="btn btn-primary">Retour à la boutique</a>
      </div>
    `;
    return;
  }

  let selectedWilaya = WILAYAS_LIST[0]; // Default: Alger
  let selectedDeliveryType = 'domicile';
  let selectedPayment = 'cod';

  renderCheckoutLayout();

  function renderCheckoutLayout() {
    const subtotal = getCartSubtotal();
    const settings = getSettings();
    const isFreeShipping = subtotal >= (settings.freeShippingThreshold || 20000);
    const shippingFee = isFreeShipping ? 0 : (selectedDeliveryType === 'relais' ? Math.max(200, selectedWilaya.fee - 150) : selectedWilaya.fee);
    const grandTotal = subtotal + shippingFee;

    checkoutContainer.innerHTML = `
      <div class="checkout-layout">
        <!-- Left: Order Form -->
        <div class="checkout-form-card">
          <form id="checkout-form" onsubmit="event.preventDefault(); submitOrder();">
            <!-- 1. Customer Information -->
            <div style="margin-bottom: 32px;">
              <h3 class="form-section-title">
                <span>01.</span> Informations Personnelles
              </h3>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="cust-nom">Nom *</label>
                  <input type="text" id="cust-nom" class="form-input" placeholder="Ex: Benali" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="cust-prenom">Prénom *</label>
                  <input type="text" id="cust-prenom" class="form-input" placeholder="Ex: Sofiane" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="cust-tel">Numéro de Téléphone *</label>
                <input type="tel" id="cust-tel" class="form-input" placeholder="Ex: 0555 12 34 56 ou 0661 00 00 00" required pattern="^(05|06|07|02)[0-9]{8}$" title="Veuillez saisir un numéro algérien valide (ex: 0550123456)">
                <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: block;">Le livreur vous contactera sur ce numéro avant la livraison.</span>
              </div>
            </div>

            <!-- 2. Shipping Address -->
            <div style="margin-bottom: 32px;">
              <h3 class="form-section-title">
                <span>02.</span> Adresse de Livraison
              </h3>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="cust-wilaya">Wilaya *</label>
                  <select id="cust-wilaya" class="form-select" required>
                    ${WILAYAS_LIST.map(w => `
                      <option value="${w.code}" ${w.code === selectedWilaya.code ? 'selected' : ''}>
                        ${w.name} (${w.fee} DA)
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="cust-commune">Commune *</label>
                  <input type="text" id="cust-commune" class="form-input" placeholder="Ex: Hydra, Chéraga, Bir El Djir..." required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="cust-adresse">Adresse Complète *</label>
                <input type="text" id="cust-adresse" class="form-input" placeholder="N° Rue, Bâtiment, Étage ou repère proche..." required>
              </div>

              <div class="form-group">
                <label class="form-label" for="cust-notes">Notes de commande (Facultatif)</label>
                <textarea id="cust-notes" class="form-textarea" placeholder="Instructions spéciales pour le livreur (heures préférées, code d'accès...)"></textarea>
              </div>
            </div>

            <!-- 3. Delivery Method -->
            <div style="margin-bottom: 32px;">
              <h3 class="form-section-title">
                <span>03.</span> Mode de Livraison
              </h3>

              <div class="radio-options-group">
                <label class="radio-card-label ${selectedDeliveryType === 'domicile' ? 'selected' : ''}" onclick="selectDelivery('domicile')">
                  <div class="radio-card-left">
                    <span class="custom-radio-dot"></span>
                    <div>
                      <strong style="display: block; font-size: 0.9rem; text-transform: uppercase;">Livraison à Domicile</strong>
                      <span style="font-size: 0.78rem; color: var(--text-secondary);">Directement à votre porte sous 24h à 48h</span>
                    </div>
                  </div>
                  <span style="font-weight: 800; font-family: var(--font-display);">${isFreeShipping ? 'GRATUIT' : formatPrice(selectedWilaya.fee)}</span>
                </label>

                <label class="radio-card-label ${selectedDeliveryType === 'relais' ? 'selected' : ''}" onclick="selectDelivery('relais')">
                  <div class="radio-card-left">
                    <span class="custom-radio-dot"></span>
                    <div>
                      <strong style="display: block; font-size: 0.9rem; text-transform: uppercase;">Point Relais / Stop Desk</strong>
                      <span style="font-size: 0.78rem; color: var(--text-secondary);">À récupérer dans l'agence de transport la plus proche</span>
                    </div>
                  </div>
                  <span style="font-weight: 800; font-family: var(--font-display);">${isFreeShipping ? 'GRATUIT' : formatPrice(Math.max(200, selectedWilaya.fee - 150))}</span>
                </label>
              </div>
            </div>

            <!-- 4. Payment Method -->
            <div style="margin-bottom: 36px;">
              <h3 class="form-section-title">
                <span>04.</span> Mode de Paiement
              </h3>

              <div class="radio-options-group">
                <label class="radio-card-label ${selectedPayment === 'cod' ? 'selected' : ''}" onclick="selectPayment('cod')">
                  <div class="radio-card-left">
                    <span class="custom-radio-dot"></span>
                    <div>
                      <strong style="display: block; font-size: 0.9rem; text-transform: uppercase;">Paiement à la Livraison (Cash)</strong>
                      <span style="font-size: 0.78rem; color: var(--text-secondary);">Payez en espèces lors de la réception de votre colis</span>
                    </div>
                  </div>
                  <span style="font-size: 1.1rem;">💵</span>
                </label>

                <label class="radio-card-label ${selectedPayment === 'cib' ? 'selected' : ''}" onclick="selectPayment('cib')">
                  <div class="radio-card-left">
                    <span class="custom-radio-dot"></span>
                    <div>
                      <strong style="display: block; font-size: 0.9rem; text-transform: uppercase;">Carte CIB / Edahabia</strong>
                      <span style="font-size: 0.78rem; color: var(--text-secondary);">Paiement électronique certifié GIE Monétique</span>
                    </div>
                  </div>
                  <span style="font-size: 1.1rem;">💳</span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" style="padding: 18px;">
              CONFIRMER LA COMMANDE (${formatPrice(grandTotal)})
            </button>
          </form>
        </div>

        <!-- Right: Live Order Summary -->
        <div class="cart-summary-card">
          <h3 class="summary-title">Votre Panier (${cart.reduce((s, i) => s + i.qty, 0)} articles)</h3>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; max-height: 280px; overflow-y: auto; padding-right: 6px;">
            ${cart.map(item => `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${item.image}" alt="${item.name}" style="width: 44px; height: 44px; object-fit: contain; background: var(--bg-surface); padding: 4px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 700; color: var(--text-primary); line-height: 1.3;">${item.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">Qté: ${item.qty} × ${formatPrice(item.price)}</div>
                  </div>
                </div>
                <div style="font-family: var(--font-display); font-weight: 700; white-space: nowrap;">
                  ${formatPrice(item.price * item.qty)}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="summary-row">
            <span>Sous-total</span>
            <span style="font-weight: 700;">${formatPrice(subtotal)}</span>
          </div>

          <div class="summary-row">
            <span>Frais de livraison (${selectedWilaya.name.split(' - ')[1]})</span>
            <span style="font-weight: 700;">${isFreeShipping ? '<span class="badge badge-stock-in" style="font-size: 0.7rem;">OFFERT</span>' : formatPrice(shippingFee)}</span>
          </div>

          <div class="summary-row total">
            <span>TOTAL À PAYER</span>
            <span class="total-amount">${formatPrice(grandTotal)}</span>
          </div>

          <div style="margin-top: 20px; background: var(--bg-surface); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.78rem; color: var(--text-secondary);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-weight: 700; color: var(--text-primary); text-transform: uppercase;">
              <span>⚡</span> Expédition Prioritaire NUTRI FORGE
            </div>
            Votre colis est préparé dans un emballage thermique scellé anti-choc pour garantir l'intégrité de vos compléments.
          </div>
        </div>
      </div>
    `;

    // Bind Wilaya change listener
    const wilayaSelect = document.getElementById('cust-wilaya');
    if (wilayaSelect) {
      wilayaSelect.addEventListener('change', (e) => {
        const found = WILAYAS_LIST.find(w => w.code === e.target.value);
        if (found) {
          selectedWilaya = found;
          renderCheckoutLayout();
        }
      });
    }
  }

  // Global option switchers
  window.selectDelivery = function(type) {
    selectedDeliveryType = type;
    renderCheckoutLayout();
  };

  window.selectPayment = function(method) {
    selectedPayment = method;
    renderCheckoutLayout();
  };

  // Order Submission Handler
  window.submitOrder = function() {
    const nom = document.getElementById('cust-nom').value.trim();
    const prenom = document.getElementById('cust-prenom').value.trim();
    const phone = document.getElementById('cust-tel').value.trim();
    const commune = document.getElementById('cust-commune').value.trim();
    const adresse = document.getElementById('cust-adresse').value.trim();
    const notes = document.getElementById('cust-notes').value.trim();

    if (!nom || !prenom || !phone || !commune || !adresse) {
      showToast('Veuillez remplir tous les champs obligatoires (*)', 'error');
      return;
    }

    const currentCart = getCart();
    if (currentCart.length === 0) {
      showToast('Votre panier est vide', 'error');
      return;
    }

    // Verify stock availability one more time
    const products = getProducts();
    for (const item of currentCart) {
      const prod = products.find(p => p.id === item.id);
      if (prod && prod.stock < item.qty) {
        showToast(`Stock insuffisant pour "${item.name}". Disponible: ${prod.stock}`, 'error');
        return;
      }
    }

    const subtotal = getCartSubtotal();
    const isFreeShipping = subtotal >= (getSettings().freeShippingThreshold || 20000);
    const shippingFee = isFreeShipping ? 0 : (selectedDeliveryType === 'relais' ? Math.max(200, selectedWilaya.fee - 150) : selectedWilaya.fee);
    const total = subtotal + shippingFee;

    const orderPayload = {
      customer: {
        firstName: prenom,
        lastName: nom,
        phone: phone,
        wilaya: selectedWilaya.name,
        commune: commune,
        address: adresse
      },
      items: currentCart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image
      })),
      subtotal: subtotal,
      shippingFee: shippingFee,
      total: total,
      deliveryType: selectedDeliveryType,
      paymentMethod: selectedPayment,
      notes: notes
    };

    const savedOrder = addOrder(orderPayload);
    clearCart(); // Empty cart

    // Show Confirmation Modal
    showOrderSuccessModal(savedOrder);
  };

  function showOrderSuccessModal(order) {
    let modal = document.getElementById('order-success-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'order-success-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 60px; height: 60px; background: var(--accent-white); color: var(--text-inverse); font-size: 2rem; font-weight: 900; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            ✓
          </div>
          <h2 style="font-size: 1.5rem; text-transform: uppercase; font-weight: 900; margin-bottom: 6px;">Commande Confirmée !</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Votre commande a été enregistrée avec succès.</p>
        </div>

        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.85rem;">
            <span style="color: var(--text-muted);">Numéro de Commande :</span>
            <strong style="color: var(--accent-white); font-family: var(--font-display);">${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.85rem;">
            <span style="color: var(--text-muted);">Client :</span>
            <strong style="color: var(--text-primary);">${order.customer.firstName} ${order.customer.lastName} (${order.customer.phone})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.85rem;">
            <span style="color: var(--text-muted);">Destination :</span>
            <strong style="color: var(--text-primary);">${order.customer.wilaya}, ${order.customer.commune}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 1rem;">
            <span style="font-weight: 800;">Total à régler :</span>
            <strong style="color: var(--accent-white); font-family: var(--font-display);">${formatPrice(order.total)}</strong>
          </div>
        </div>

        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px; text-align: center;">
          Notre service logistique vous contactera par téléphone pour valider l'expédition. Le stock de la boutique a été mis à jour automatiquement.
        </p>

        <div style="display: flex; gap: 12px;">
          <a href="index.html" class="btn btn-primary btn-block">Retour à l'accueil</a>
          <a href="products.html" class="btn btn-secondary btn-block">Boutique</a>
        </div>
      </div>
    `;

    modal.classList.add('open');
  }
});
