/**
 * KRONOS NUTRITION - ADMIN DASHBOARD CONTROLLER (VANILLA JS)
 * Complete back-office management for products, stock, orders,
 * customers, promotions, analytics chart, and store settings.
 */

let activeTab = 'tab-dashboard';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('admin-app-root')) return;

  // Initialize Tab Navigation
  initSidebarTabs();
  // Render initial active view
  renderActiveView();

  // Mobile Toggle Button
  const mobileToggle = document.getElementById('admin-menu-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
});

// Switch Active View
function switchAdminTab(tabId) {
  activeTab = tabId;

  // Update sidebar active classes
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Close mobile sidebar if open
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) sidebar.classList.remove('open');

  renderActiveView();
}

function initSidebarTabs() {
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchAdminTab(target);
      });
    }
  });
}

function renderActiveView() {
  const contentBody = document.getElementById('admin-dynamic-content');
  const topbarTitle = document.getElementById('topbar-title');
  if (!contentBody) return;

  switch (activeTab) {
    case 'tab-dashboard':
      if (topbarTitle) topbarTitle.textContent = "Vue d'Ensemble";
      renderDashboardOverview(contentBody);
      break;
    case 'tab-products':
      if (topbarTitle) topbarTitle.textContent = "Gestion des Produits";
      renderProductsManager(contentBody);
      break;
    case 'tab-add-product':
      if (topbarTitle) topbarTitle.textContent = "Ajouter un Produit";
      renderAddProductForm(contentBody);
      break;
    case 'tab-orders':
      if (topbarTitle) topbarTitle.textContent = "Gestion des Commandes";
      renderOrdersManager(contentBody);
      break;
    case 'tab-customers':
      if (topbarTitle) topbarTitle.textContent = "Répertoire Clients";
      renderCustomersManager(contentBody);
      break;
    case 'tab-stock':
      if (topbarTitle) topbarTitle.textContent = "Gestion des Stocks";
      renderStockManager(contentBody);
      break;
    case 'tab-promotions':
      if (topbarTitle) topbarTitle.textContent = "Gestion des Promotions";
      renderPromotionsManager(contentBody);
      break;
    case 'tab-settings':
      if (topbarTitle) topbarTitle.textContent = "Paramètres de la Boutique";
      renderSettingsManager(contentBody);
      break;
    default:
      renderDashboardOverview(contentBody);
  }
}

// ==========================================================================
// 1. DASHBOARD OVERVIEW & MONTHLY ANALYTICS
// ==========================================================================
let selectedMonthFilter = null; // null for current month or specific 'YYYY-MM'

function renderDashboardOverview(container) {
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthLabel = getMonthLabel(currentMonthKey);
  const currentMonthStats = getCurrentMonthStats();
  const allMonthlyStats = getMonthlyStats();
  const products = getProducts();
  const orders = getOrders();

  const totalRevenueAllTime = orders.reduce((sum, o) => sum + (o.status !== 'Annulée' ? Number(o.total) : 0), 0);
  const totalOrdersAllTime = orders.length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  // Sorted list of all recorded months (newest first)
  const sortedMonths = Object.keys(allMonthlyStats).sort((a, b) => b.localeCompare(a));
  if (!sortedMonths.includes(currentMonthKey)) {
    sortedMonths.unshift(currentMonthKey);
  }

  const isSimulated = Boolean(localStorage.getItem(STORAGE_KEYS.SIMULATED_MONTH));

  container.innerHTML = `
    <!-- Top System & Monthly Status Banner -->
    <div style="margin-bottom: 24px; background: var(--admin-surface); border: 1px solid var(--admin-border-subtle); border-radius: var(--admin-radius-md); padding: 16px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 1.4rem;">📅</span>
        <div>
          <div style="font-size: 0.88rem; font-weight: 700; color: #FFFFFF;">
            Période Active : <span style="color: var(--admin-accent-gold); font-family: var(--admin-font-display);">${currentMonthLabel}</span>
            ${isSimulated ? '<span class="status-pill status-preparing" style="margin-left: 8px; font-size: 0.7rem;">Mode Simulation</span>' : '<span class="status-pill status-confirmed" style="margin-left: 8px; font-size: 0.7rem;">Temps Réel</span>'}
          </div>
          <div style="font-size: 0.76rem; color: var(--admin-text-muted); margin-top: 2px;">
            Les statistiques du mois actuel sont isolées. Les mois passés restent archivés en mémoire persistante.
          </div>
        </div>
      </div>

      <!-- Quick Test & Simulation Actions (TEST 1 to 7) -->
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-secondary btn-sm" onclick="quickCreateTestOrder()" title="Créer une commande de 3 000 DA (Test 1 & 2)">
          ⚡ +3 000 DA (Test)
        </button>
        <button class="btn btn-secondary btn-sm" onclick="quickSimulateMonth('2026-09')" title="Simuler passage à Septembre 2026 (Test 6 & 7)">
          🗓️ Passer à Septembre
        </button>
        <button class="btn btn-secondary btn-sm" onclick="quickSimulateMonth('2026-08')" title="Simuler Août 2026">
          🗓️ Revenir à Août
        </button>
        ${isSimulated ? `
          <button class="btn btn-secondary btn-sm" style="color: #ff9999;" onclick="quickSimulateMonth(null)">
            🔄 Date Réelle
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Key Metric Cards (Dynamic Monthly Tracking) -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Chiffre d'Affaires — ${currentMonthLabel}</span>
          <div class="stat-card-icon">💰</div>
        </div>
        <div class="stat-card-value">${formatPrice(currentMonthStats.revenue)}</div>
        <div class="stat-card-sub">Cumul global historique : ${formatPrice(totalRevenueAllTime)}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Commandes — ${currentMonthLabel}</span>
          <div class="stat-card-icon">📦</div>
        </div>
        <div class="stat-card-value">${currentMonthStats.orders}</div>
        <div class="stat-card-sub">Total commandes enregistrées : ${totalOrdersAllTime}</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Catalogue Produits</span>
          <div class="stat-card-icon">🏷️</div>
        </div>
        <div class="stat-card-value">${products.length}</div>
        <div class="stat-card-sub">Articles permanents en boutique</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Alertes Stock</span>
          <div class="stat-card-icon">⚠️</div>
        </div>
        <div class="stat-card-value">${outOfStockCount + lowStockCount}</div>
        <div class="stat-card-sub">${outOfStockCount} en rupture, ${lowStockCount} stock faible</div>
      </div>
    </div>

    <!-- Chart and Top Products -->
    <div class="dashboard-grid-2">
      <!-- Dynamic Sales Chart -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Évolution des Ventes Mensuelles</h3>
          <span class="admin-badge-pill">Données Réelles</span>
        </div>
        <div class="chart-container">
          <canvas id="salesChart"></canvas>
        </div>
      </div>

      <!-- Quick Inventory Alert -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Niveaux Critiques de Stock</h3>
          <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('tab-stock')">Gérer</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${products.filter(p => p.stock <= 5).slice(0, 4).map(p => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--admin-surface); border-radius: var(--admin-radius-sm); border: 1px solid var(--admin-border-subtle);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${p.image}" class="table-img-thumb" style="width: 32px; height: 32px;">
                <div>
                  <div style="font-weight: 700; font-size: 0.82rem;">${p.name}</div>
                  <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${p.category} (Réf: ${p.sku || p.id})</div>
                </div>
              </div>
              <span class="status-pill ${p.stock <= 0 ? 'status-cancelled' : 'status-preparing'}">
                ${p.stock <= 0 ? '0 restant' : p.stock + ' restants'}
              </span>
            </div>
          `).join('') || '<p style="color: var(--admin-text-muted); font-size: 0.85rem;">Tous les niveaux de stock sont optimaux.</p>'}
        </div>
      </div>
    </div>

    <!-- Monthly History Table (Requirement 2 & 7) -->
    <div class="admin-card" style="margin-bottom: 24px;">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Historique des Performances Mensuelles</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">
            Suivi consolidé mois par mois avec conservation permanente des chiffres d'affaires et commandes antérieurs.
          </p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Chiffre d'Affaires</th>
              <th>Commandes</th>
              <th>Panier Moyen</th>
              <th>Articles Vendus</th>
              <th>État de la Période</th>
            </tr>
          </thead>
          <tbody>
            ${sortedMonths.map(mKey => {
              const mStats = allMonthlyStats[mKey] || { revenue: 0, orders: 0, itemsCount: 0 };
              const isCurrent = mKey === currentMonthKey;
              const avgBasket = mStats.orders > 0 ? Math.round(mStats.revenue / mStats.orders) : 0;

              return `
                <tr style="${isCurrent ? 'background: rgba(255,255,255,0.02);' : ''}">
                  <td>
                    <strong style="color: ${isCurrent ? 'var(--admin-accent-gold)' : 'var(--admin-accent-white)'}; font-family: var(--admin-font-display);">
                      ${getMonthLabel(mKey)}
                    </strong>
                    ${isCurrent ? '<span class="status-pill status-confirmed" style="margin-left: 8px; font-size: 0.68rem;">En cours</span>' : ''}
                  </td>
                  <td>
                    <strong style="font-family: var(--admin-font-display); font-size: 0.95rem; color: ${mStats.revenue > 0 ? '#FFFFFF' : 'var(--admin-text-muted)'};">
                      ${formatPrice(mStats.revenue)}
                    </strong>
                  </td>
                  <td>
                    <span style="font-weight: 700;">${mStats.orders} cmd</span>
                  </td>
                  <td style="color: var(--admin-text-secondary); font-size: 0.85rem;">
                    ${formatPrice(avgBasket)}
                  </td>
                  <td style="color: var(--admin-text-muted); font-size: 0.85rem;">
                    ${mStats.itemsCount || 0} unités
                  </td>
                  <td>
                    <span class="status-pill ${isCurrent ? 'status-new' : 'status-delivered'}">
                      ${isCurrent ? 'Mois Actif' : 'Archivé & Sauvegardé'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Latest Orders Table -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Dernières Commandes Enregistrées</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">Toutes les commandes sont conservées définitivement.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('tab-orders')">Gérer toutes les commandes (${orders.length})</button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Client</th>
              <th>Destination</th>
              <th>Montant</th>
              <th>Paiement</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--admin-text-muted);">
                  <div style="font-size: 1.8rem; margin-bottom: 8px;">📦</div>
                  <strong style="color: #FFFFFF; font-size: 0.95rem;">Aucune commande enregistrée pour le moment (0 commande).</strong><br>
                  <span style="font-size: 0.8rem; color: #888888;">Dès qu'un client passe commande ou que vous effectuez un test, elle apparaîtra ici.</span>
                </td>
              </tr>
            ` : orders.slice(0, 5).map(o => `
              <tr>
                <td><strong style="color: var(--admin-accent-white); font-family: var(--admin-font-display);">${o.id}</strong></td>
                <td style="color: var(--admin-text-muted); font-size: 0.8rem;">${new Date(o.date).toLocaleDateString('fr-FR')}</td>
                <td><strong>${o.customer.firstName} ${o.customer.lastName}</strong><br><span style="font-size: 0.75rem; color: var(--admin-text-muted);">${o.customer.phone}</span></td>
                <td>${o.customer.wilaya}</td>
                <td><strong style="font-family: var(--admin-font-display);">${formatPrice(o.total)}</strong></td>
                <td><span style="font-size: 0.75rem; text-transform: uppercase;">${o.paymentMethod === 'cod' ? 'Espèces' : 'Carte'}</span></td>
                <td>
                  <span class="status-pill ${getStatusClass(o.status)}">${o.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Draw Real HTML5 Canvas Chart based on monthly data
  drawSalesChart();
}

// Quick Test Helpers for verifying test scenarios
window.quickCreateTestOrder = function() {
  const products = getProducts();
  const firstProd = products[0] || { id: 'k-whey-iso-01', name: 'HYDRO-ISOLATE 100% WHEY MATRIX' };
  
  const testOrder = {
    customer: {
      firstName: 'Sofiane',
      lastName: 'Benali',
      phone: '0555 12 34 56',
      wilaya: '16 - Alger',
      commune: 'Hydra',
      address: 'Résidence Les Pins, Bât B'
    },
    items: [
      {
        id: firstProd.id,
        name: firstProd.name,
        price: 2600,
        qty: 1,
        image: firstProd.image
      }
    ],
    subtotal: 2600,
    shippingFee: 400,
    total: 3000,
    deliveryType: 'domicile',
    paymentMethod: 'cod',
    notes: 'Commande de test automatique (3 000 DA)'
  };

  addOrder(testOrder);
  showToast('Commande test de 3 000 DA créée avec succès !');
  renderActiveView();
};

window.quickSimulateMonth = function(monthKey) {
  simulateMonth(monthKey);
  const label = monthKey ? getMonthLabel(monthKey) : 'Date réelle du système';
  showToast(`Période active définie sur : ${label}`);
  renderActiveView();
};

function drawSalesChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Build the last 6 months timeline dynamically
  const currentKey = getCurrentMonthKey();
  const currentParts = currentKey.split('-');
  let curYear = parseInt(currentParts[0], 10);
  let curMonth = parseInt(currentParts[1], 10);

  const timelineKeys = [];
  for (let i = 5; i >= 0; i--) {
    let targetM = curMonth - i;
    let targetY = curYear;
    while (targetM <= 0) {
      targetM += 12;
      targetY -= 1;
    }
    const key = `${targetY}-${String(targetM).padStart(2, '0')}`;
    timelineKeys.push(key);
  }

  const allMonthlyStats = getMonthlyStats();
  const months = timelineKeys.map(k => getShortMonthLabel(k));
  const values = timelineKeys.map(k => allMonthlyStats[k]?.revenue || 0);

  const maxVal = Math.max(...values, 10000) * 1.25;

  ctx.clearRect(0, 0, width, height);

  // Background Grid Lines
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = height - 30 - (i * (height - 60) / 4);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    // Value on y-axis
    ctx.fillStyle = '#666666';
    ctx.font = '9px Montserrat, sans-serif';
    ctx.textAlign = 'right';
    const gridVal = Math.round((maxVal / 4) * i);
    ctx.fillText(`${gridVal >= 1000 ? Math.round(gridVal/1000) + 'k' : gridVal} DA`, 36, y + 3);
  }

  // Draw Area Gradient
  const gradient = ctx.createLinearGradient(0, 20, 0, height - 30);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

  const stepX = (width - 70) / (values.length - 1);

  ctx.beginPath();
  values.forEach((v, idx) => {
    const x = 50 + (idx * stepX);
    const y = height - 30 - ((v / maxVal) * (height - 60));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.lineTo(50 + ((values.length - 1) * stepX), height - 30);
  ctx.lineTo(50, height - 30);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw Line
  ctx.beginPath();
  values.forEach((v, idx) => {
    const x = 50 + (idx * stepX);
    const y = height - 30 - ((v / maxVal) * (height - 60));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw Data Points & Labels
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '10px Montserrat, sans-serif';
  ctx.textAlign = 'center';

  values.forEach((v, idx) => {
    const x = 50 + (idx * stepX);
    const y = height - 30 - ((v / maxVal) * (height - 60));

    // Circle point
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = v > 0 ? '#E5A93C' : '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Value text above point if positive
    if (v > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Montserrat, sans-serif';
      ctx.fillText(formatPrice(v), x, y - 10);
    }

    // Month label
    ctx.fillStyle = '#888888';
    ctx.font = '10px Montserrat, sans-serif';
    ctx.fillText(months[idx], x, height - 10);
  });
}

function getStatusClass(status) {
  switch (status) {
    case 'Nouvelle': return 'status-new';
    case 'Confirmée': return 'status-confirmed';
    case 'En préparation': return 'status-preparing';
    case 'Expédiée': return 'status-shipped';
    case 'Livrée': return 'status-delivered';
    case 'Annulée': return 'status-cancelled';
    default: return 'status-confirmed';
  }
}

// ==========================================================================
// 2. PRODUCTS MANAGER (TABLE + CRUD + MODAL)
// ==========================================================================
function renderProductsManager(container) {
  const products = getProducts();

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Inventaire & Catalogue Produits (${products.length})</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">Toutes les modifications sont synchronisées instantanément avec la boutique publique.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="switchAdminTab('tab-add-product')">+ Ajouter un produit</button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Nom & Référence</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Ancien Prix</th>
              <th>Stock</th>
              <th>Promo</th>
              <th>Visibilité</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align: center; padding: 48px 20px; color: var(--admin-text-muted);">
                  <div style="font-size: 2.2rem; margin-bottom: 12px;">🏷️</div>
                  <strong style="color: #FFFFFF; font-size: 1.05rem;">Aucun produit dans le catalogue (0 produit).</strong><br>
                  <p style="font-size: 0.82rem; color: #888888; max-width: 480px; margin: 8px auto 16px;">
                    Votre boutique est actuellement vide. Cliquez sur le bouton ci-dessous pour ajouter votre premier produit personnalisé avec sa galerie photos.
                  </p>
                  <button class="btn btn-primary btn-sm" onclick="switchAdminTab('tab-add-product')">+ Ajouter mon premier produit</button>
                </td>
              </tr>
            ` : products.map(p => `
              <tr>
                <td>
                  <img src="${p.image}" class="table-img-thumb" alt="${p.name}">
                </td>
                <td>
                  <strong style="color: var(--admin-text-primary); font-size: 0.88rem;">${p.name}</strong>
                  <div style="font-size: 0.72rem; color: var(--admin-text-muted); font-family: monospace;">SKU: ${p.sku || p.id} | ${p.brand}</div>
                </td>
                <td><span class="admin-badge-pill" style="font-size: 0.7rem;">${p.category}</span></td>
                <td><strong style="font-family: var(--admin-font-display);">${formatPrice(p.price)}</strong></td>
                <td><span style="color: var(--admin-text-muted); text-decoration: line-through;">${p.oldPrice ? formatPrice(p.oldPrice) : '-'}</span></td>
                <td>
                  <span class="status-pill ${p.stock <= 0 ? 'status-cancelled' : p.stock <= 5 ? 'status-preparing' : 'status-confirmed'}">
                    ${p.stock} unités
                  </span>
                </td>
                <td>
                  <span class="status-pill ${p.isPromo ? 'status-new' : 'status-cancelled'}">
                    ${p.isPromo ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.7rem;" onclick="toggleProductVisibility('${p.id}')">
                    ${p.status === 'hidden' ? 'Masqué 👁' : 'Public ✓'}
                  </button>
                </td>
                <td style="text-align: right;">
                  <div class="table-actions" style="justify-content: flex-end;">
                    <button class="action-icon-btn" title="Modifier" onclick="openEditProductModal('${p.id}')">✏️</button>
                    <button class="action-icon-btn" title="Supprimer" onclick="confirmDeleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')">🗑</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.toggleProductVisibility = function(id) {
  const products = getProducts();
  const prod = products.find(p => p.id === id);
  if (prod) {
    prod.status = prod.status === 'hidden' ? 'active' : 'hidden';
    setProducts(products);
    showToast(`Visibilité mise à jour pour "${prod.name}"`);
    renderActiveView();
  }
};

window.confirmDeleteProduct = function(id, name) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit "${name}" de la boutique ?`)) {
    deleteProduct(id);
    showToast(`Produit "${name}" supprimé avec succès`);
    renderActiveView();
  }
};

// ==========================================================================
// MULTI-IMAGE PRODUCT GALLERY ENGINE (FILES & URLS)
// ==========================================================================
window.adminGalleryState = {
  add: [],
  edit: []
};

// Image Upload & Canvas Optimization Helper (Prevents storage quota overflow while keeping crisp quality)
function processImageFile(file, callback) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast(`Le fichier "${file.name}" n'est pas une image valide (JPG, PNG, WEBP acceptés).`, 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;
    
    const img = new Image();
    img.onload = function() {
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      callback(optimizedDataUrl, file.name);
    };
    img.onerror = function() {
      callback(rawDataUrl, file.name);
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

// Render dynamic thumbnail gallery grid with controls
function renderGalleryUI(prefix) {
  const container = document.getElementById(`${prefix}-gallery-grid-container`);
  const countEl = document.getElementById(`${prefix}-gallery-count`);
  if (!container) return;

  const images = window.adminGalleryState[prefix] || [];
  if (countEl) {
    countEl.textContent = `${images.length} photo(s) enregistrée(s)`;
  }

  if (images.length === 0) {
    container.innerHTML = `
      <div class="gallery-empty-notice">
        📷 Aucune photo ajoutée pour le moment. Ajoutez des photos depuis votre appareil ou par lien URL.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="gallery-grid">
      ${images.map((img, idx) => `
        <div class="gallery-card ${idx === 0 ? 'is-primary' : ''}">
          ${idx === 0 ? '<div class="gallery-badge-primary">★ Principale</div>' : ''}
          <div class="gallery-badge-type">${img.type === 'upload' ? 'Fichier' : 'URL'}</div>
          
          <div class="gallery-card-img-wrap">
            <img src="${img.url}" class="gallery-card-img" alt="Photo ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=400&q=80'">
          </div>

          <div class="gallery-card-toolbar">
            ${idx !== 0 ? `
              <button type="button" class="gallery-tool-btn btn-make-primary" onclick="setPrimaryGalleryImage('${prefix}', ${idx})" title="Définir comme photo principale">
                ★
              </button>
            ` : '<span style="width:20px;"></span>'}

            <div style="display: flex; gap: 2px;">
              ${idx > 0 ? `
                <button type="button" class="gallery-tool-btn" onclick="moveGalleryImage('${prefix}', ${idx}, -1)" title="Déplacer vers la gauche">
                  ◀
                </button>
              ` : ''}
              ${idx < images.length - 1 ? `
                <button type="button" class="gallery-tool-btn" onclick="moveGalleryImage('${prefix}', ${idx}, 1)" title="Déplacer vers la droite">
                  ▶
                </button>
              ` : ''}
            </div>

            <button type="button" class="gallery-tool-btn btn-delete" onclick="removeGalleryImage('${prefix}', ${idx})" title="Supprimer cette photo">
              ✕
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Add files from device (multi-selection support)
window.handleGalleryFilesSelect = function(prefix, inputEl) {
  if (!inputEl || !inputEl.files || inputEl.files.length === 0) return;

  const files = Array.from(inputEl.files);
  let processedCount = 0;

  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      showToast(`Le fichier "${file.name}" n'est pas une image valide.`, 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast(`Le fichier "${file.name}" dépasse 15 Mo.`, 'error');
      return;
    }

    processImageFile(file, (dataUrl, fileName) => {
      window.adminGalleryState[prefix] = window.adminGalleryState[prefix] || [];
      window.adminGalleryState[prefix].push({
        type: 'upload',
        url: dataUrl,
        name: fileName
      });
      processedCount++;

      renderGalleryUI(prefix);
      if (processedCount === files.length) {
        showToast(`${processedCount} photo(s) ajoutée(s) avec succès !`);
        inputEl.value = '';
      }
    });
  });
};

// Drag & drop handlers for gallery
window.handleGalleryDrop = function(prefix, event) {
  event.preventDefault();
  event.stopPropagation();
  const dropbox = document.getElementById(`${prefix}-gallery-dropbox`);
  if (dropbox) dropbox.classList.remove('dragover');

  if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    const files = Array.from(event.dataTransfer.files);
    let processedCount = 0;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast(`Le fichier "${file.name}" n'est pas une image valide.`, 'error');
        return;
      }

      processImageFile(file, (dataUrl, fileName) => {
        window.adminGalleryState[prefix] = window.adminGalleryState[prefix] || [];
        window.adminGalleryState[prefix].push({
          type: 'upload',
          url: dataUrl,
          name: fileName
        });
        processedCount++;
        renderGalleryUI(prefix);

        if (processedCount === files.length) {
          showToast(`${processedCount} photo(s) importée(s) avec succès !`);
        }
      });
    });
  }
};

window.handleGalleryDragOver = function(prefix, event) {
  event.preventDefault();
  event.stopPropagation();
  const dropbox = document.getElementById(`${prefix}-gallery-dropbox`);
  if (dropbox) dropbox.classList.add('dragover');
};

window.handleGalleryDragLeave = function(prefix, event) {
  event.preventDefault();
  event.stopPropagation();
  const dropbox = document.getElementById(`${prefix}-gallery-dropbox`);
  if (dropbox) dropbox.classList.remove('dragover');
};

// Add image from URL with immediate validation & preloading
window.addGalleryImageFromUrl = function(prefix) {
  const input = document.getElementById(`${prefix}-gallery-url-input`);
  if (!input) return;
  const url = input.value.trim();

  if (!url) {
    showToast("Veuillez coller ou saisir l'URL d'une image", "error");
    return;
  }

  if (!/^https?:\/\/.+/i.test(url) && !url.startsWith('data:image/')) {
    showToast("Format invalide. L'URL doit commencer par http:// ou https://", "error");
    return;
  }

  const testImg = new Image();
  testImg.onload = function() {
    window.adminGalleryState[prefix] = window.adminGalleryState[prefix] || [];
    window.adminGalleryState[prefix].push({
      type: 'url',
      url: url,
      name: 'Image Web'
    });
    input.value = '';
    renderGalleryUI(prefix);
    showToast("Photo URL ajoutée avec succès !");
  };
  testImg.onerror = function() {
    showToast("Impossible de charger cette image. Vérifiez que le lien est direct et accessible.", "error");
  };
  testImg.src = url;
};

// Set photo as primary (moves to position 0)
window.setPrimaryGalleryImage = function(prefix, index) {
  if (!window.adminGalleryState[prefix] || index <= 0) return;
  const list = window.adminGalleryState[prefix];
  const item = list.splice(index, 1)[0];
  list.unshift(item);
  renderGalleryUI(prefix);
  showToast("Photo définie comme image principale ★");
};

// Reorder photos (move left/right)
window.moveGalleryImage = function(prefix, index, delta) {
  if (!window.adminGalleryState[prefix]) return;
  const list = window.adminGalleryState[prefix];
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[newIndex];
  list[newIndex] = temp;
  renderGalleryUI(prefix);
};

// Delete photo
window.removeGalleryImage = function(prefix, index) {
  if (!window.adminGalleryState[prefix]) return;
  window.adminGalleryState[prefix].splice(index, 1);
  renderGalleryUI(prefix);
  showToast("Photo retirée du produit");
};

// Edit Product Modal
window.openEditProductModal = function(id) {
  const prod = getProductById(id);
  if (!prod) return;

  // Initialize gallery state for edit mode from existing product data
  const initialImages = [];
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    prod.images.forEach(img => {
      if (typeof img === 'object' && img !== null && img.url) {
        initialImages.push(img);
      } else if (typeof img === 'string') {
        initialImages.push({
          type: img.startsWith('data:') ? 'upload' : 'url',
          url: img,
          name: 'Photo'
        });
      }
    });
  } else if (prod.image) {
    initialImages.push({
      type: prod.image.startsWith('data:') ? 'upload' : 'url',
      url: prod.image,
      name: 'Photo principale'
    });
  }

  // Ensure primary image is at position 0
  if (prod.image && initialImages.length > 0 && initialImages[0].url !== prod.image) {
    const mainIdx = initialImages.findIndex(i => i.url === prod.image);
    if (mainIdx > 0) {
      const mainItem = initialImages.splice(mainIdx, 1)[0];
      initialImages.unshift(mainItem);
    }
  }

  window.adminGalleryState.edit = initialImages;

  let modal = document.getElementById('edit-product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-product-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 750px;">
      <div class="modal-close-btn" onclick="document.getElementById('edit-product-modal').classList.remove('open')">✕</div>
      <h3 style="font-size: 1.2rem; text-transform: uppercase; margin-bottom: 20px;">Modifier le Produit</h3>

      <form id="edit-product-form" onsubmit="event.preventDefault(); saveEditedProduct('${prod.id}');">
        <div class="admin-form-group">
          <label class="admin-form-label">Nom du Produit *</label>
          <input type="text" id="edit-name" class="admin-input" value="${prod.name}" required>
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Prix de vente (DA) *</label>
            <input type="number" id="edit-price" class="admin-input" value="${prod.price}" required>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Ancien Prix (Barré - DA)</label>
            <input type="number" id="edit-old-price" class="admin-input" value="${prod.oldPrice || ''}">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Catégorie *</label>
            <select id="edit-category" class="admin-select" required>
              ${(window.STORE_CATEGORIES || ['Créatine', 'Pré-workout', 'Vitamines', 'Accessoires']).map(cat => {
                const isSelected = (typeof normalizeCategory === 'function' ? normalizeCategory(cat) === normalizeCategory(prod.category) : cat.toLowerCase() === (prod.category || '').toLowerCase());
                return `<option value="${cat}" ${isSelected ? 'selected' : ''}>${cat}</option>`;
              }).join('')}
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Stock Actuel *</label>
            <input type="number" id="edit-stock" class="admin-input" value="${prod.stock}" min="0" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Marque</label>
            <input type="text" id="edit-brand" class="admin-input" value="${prod.brand || 'NUTRI FORGE'}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Référence SKU</label>
            <input type="text" id="edit-sku" class="admin-input" value="${prod.sku || ''}">
          </div>
        </div>

        <!-- Multi-Image Custom Gallery Manager -->
        <div class="admin-form-group">
          <label class="admin-form-label">Photos du Produit (Multi-Images) *</label>
          
          <div class="product-gallery-editor">
            <div class="gallery-editor-header">
              <span class="gallery-editor-title">Galerie Photos</span>
              <span class="gallery-editor-count" id="edit-gallery-count">0 photo(s)</span>
            </div>

            <div class="gallery-input-bar">
              <div class="gallery-upload-buttons">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('edit-file-input').click()">
                  📸 + Ajouter une photo (Appareil / Fichiers)
                </button>
                <input 
                  type="file" 
                  id="edit-file-input" 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  multiple 
                  style="display: none;" 
                  onchange="handleGalleryFilesSelect('edit', this)"
                >
              </div>

              <!-- URL Input Option -->
              <div class="gallery-url-group">
                <input 
                  type="url" 
                  id="edit-gallery-url-input" 
                  class="gallery-url-input" 
                  placeholder="Coller l'URL d'une image (ex: https://example.com/photo.jpg)"
                  onkeydown="if(event.key==='Enter'){event.preventDefault(); addGalleryImageFromUrl('edit');}"
                >
                <button type="button" class="btn btn-secondary btn-sm" onclick="addGalleryImageFromUrl('edit')">
                  + Ajouter l'URL
                </button>
              </div>

              <!-- Drag and drop zone -->
              <div 
                class="gallery-drop-box" 
                id="edit-gallery-dropbox"
                onclick="document.getElementById('edit-file-input').click()"
                ondragover="handleGalleryDragOver('edit', event)"
                ondragleave="handleGalleryDragLeave('edit', event)"
                ondrop="handleGalleryDrop('edit', event)"
              >
                <span class="gallery-drop-icon">📁</span>
                <div class="gallery-drop-text">Cliquez pour importer ou glissez-déposez vos photos ici</div>
                <div class="gallery-drop-subtext">JPG, PNG, WEBP • Plusieurs photos autorisées</div>
              </div>
            </div>

            <!-- Dynamic Interactive Thumbnails Grid -->
            <div id="edit-gallery-grid-container"></div>
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Description Courte</label>
          <input type="text" id="edit-short-desc" class="admin-input" value="${prod.shortDesc || ''}">
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Description Détaillée</label>
          <textarea id="edit-desc" class="admin-textarea" rows="3">${prod.description || ''}</textarea>
        </div>

        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" id="edit-is-promo" ${prod.isPromo ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #FFF;">
          <label for="edit-is-promo" style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">Activer le badge Promotion</label>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button type="submit" class="btn btn-primary btn-block">Enregistrer les modifications</button>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('edit-product-modal').classList.remove('open')">Annuler</button>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('open');
  renderGalleryUI('edit');
};

window.saveEditedProduct = function(id) {
  const gallery = window.adminGalleryState.edit || [];
  if (gallery.length === 0) {
    showToast('Veuillez ajouter au moins une photo pour ce produit', 'error');
    return;
  }

  const primaryImage = gallery[0].url;

  const updatedData = {
    id: id,
    name: document.getElementById('edit-name').value.trim(),
    price: parseInt(document.getElementById('edit-price').value, 10),
    oldPrice: document.getElementById('edit-old-price').value ? parseInt(document.getElementById('edit-old-price').value, 10) : null,
    category: document.getElementById('edit-category').value,
    stock: parseInt(document.getElementById('edit-stock').value, 10),
    brand: document.getElementById('edit-brand').value.trim(),
    sku: document.getElementById('edit-sku').value.trim(),
    image: primaryImage,
    images: gallery,
    shortDesc: document.getElementById('edit-short-desc').value.trim(),
    description: document.getElementById('edit-desc').value.trim(),
    isPromo: document.getElementById('edit-is-promo').checked
  };

  saveProduct(updatedData);
  document.getElementById('edit-product-modal').classList.remove('open');
  showToast('Produit et photos mis à jour avec succès !');
  renderActiveView();
};

// ==========================================================================
// 3. ADD PRODUCT FORM (MULTI-IMAGES CUSTOM GALLERY)
// ==========================================================================
function renderAddProductForm(container) {
  window.adminGalleryState.add = [];

  container.innerHTML = `
    <div class="admin-card" style="max-width: 800px; margin: 0 auto;">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Ajouter une Nouvelle Référence</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">Le produit sera automatiquement disponible à l'achat sur le site public.</p>
        </div>
      </div>

      <form id="add-product-form" onsubmit="event.preventDefault(); submitNewProduct();">
        <div class="admin-form-group">
          <label class="admin-form-label">Nom du Produit *</label>
          <input type="text" id="add-name" class="admin-input" placeholder="Ex: WHEY ISOLATE 100% PURE 2KG" required>
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Prix de Vente (DA) *</label>
            <input type="number" id="add-price" class="admin-input" placeholder="Ex: 8500" required>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Ancien Prix (Barré - Fac.)</label>
            <input type="number" id="add-old-price" class="admin-input" placeholder="Ex: 9900">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Catégorie *</label>
            <select id="add-category" class="admin-select" required>
              <option value="Créatine">Créatine</option>
              <option value="Pré-workout">Pré-workout</option>
              <option value="Vitamines">Vitamines</option>
              <option value="Accessoires">Accessoires</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Stock Initial *</label>
            <input type="number" id="add-stock" class="admin-input" placeholder="Ex: 20" min="0" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Marque</label>
            <input type="text" id="add-brand" class="admin-input" value="NUTRI FORGE" placeholder="Ex: NUTRI FORGE">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Code SKU (Facultatif)</label>
            <input type="text" id="add-sku" class="admin-input" placeholder="Ex: NF-WHEY-01">
          </div>
        </div>

        <!-- Multi-Image Custom Gallery Manager -->
        <div class="admin-form-group">
          <label class="admin-form-label">Photos du Produit (Multi-Images) *</label>

          <div class="product-gallery-editor">
            <div class="gallery-editor-header">
              <span class="gallery-editor-title">Galerie Photos</span>
              <span class="gallery-editor-count" id="add-gallery-count">0 photo(s)</span>
            </div>

            <div class="gallery-input-bar">
              <!-- Upload from device -->
              <div class="gallery-upload-buttons">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('add-file-input').click()">
                  📸 + Ajouter une photo (Appareil / Fichiers)
                </button>
                <input 
                  type="file" 
                  id="add-file-input" 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  multiple 
                  style="display: none;" 
                  onchange="handleGalleryFilesSelect('add', this)"
                >
              </div>

              <!-- URL Input Option -->
              <div class="gallery-url-group">
                <input 
                  type="url" 
                  id="add-gallery-url-input" 
                  class="gallery-url-input" 
                  placeholder="Coller l'URL d'une image (ex: https://example.com/photo.jpg)"
                  onkeydown="if(event.key==='Enter'){event.preventDefault(); addGalleryImageFromUrl('add');}"
                >
                <button type="button" class="btn btn-secondary btn-sm" onclick="addGalleryImageFromUrl('add')">
                  + Ajouter l'URL
                </button>
              </div>

              <!-- Drag and drop box -->
              <div 
                class="gallery-drop-box" 
                id="add-gallery-dropbox"
                onclick="document.getElementById('add-file-input').click()"
                ondragover="handleGalleryDragOver('add', event)"
                ondragleave="handleGalleryDragLeave('add', event)"
                ondrop="handleGalleryDrop('add', event)"
              >
                <span class="gallery-drop-icon">📁</span>
                <div class="gallery-drop-text">Cliquez pour importer ou glissez-déposez vos photos ici</div>
                <div class="gallery-drop-subtext">JPG, PNG, WEBP • Depuis votre téléphone, ordinateur ou galerie</div>
              </div>
            </div>

            <!-- Dynamic Interactive Thumbnails Grid -->
            <div id="add-gallery-grid-container"></div>
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Description Courte</label>
          <input type="text" id="add-short-desc" class="admin-input" placeholder="Une ligne d'accroche pour la carte produit...">
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Description Détaillée & Fiche Technique</label>
          <textarea id="add-desc" class="admin-textarea" rows="4" placeholder="Explications complètes sur les bénéfices, l'assimilation et la qualité..."></textarea>
        </div>

        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-bottom: 30px;">
          <input type="checkbox" id="add-is-promo" style="width: 18px; height: 18px; accent-color: #FFF;">
          <label for="add-is-promo" style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">Mettre immédiatement en Promotion</label>
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block">Publier le Produit dans la Boutique</button>
      </form>
    </div>
  `;

  renderGalleryUI('add');
}

window.submitNewProduct = function() {
  const gallery = window.adminGalleryState.add || [];
  if (gallery.length === 0) {
    showToast('Veuillez ajouter au moins une photo pour votre produit avant de publier', 'error');
    return;
  }

  const primaryImage = gallery[0].url;

  const newProduct = {
    id: 'nf-' + Date.now().toString(36),
    name: document.getElementById('add-name').value.trim(),
    price: parseInt(document.getElementById('add-price').value, 10),
    oldPrice: document.getElementById('add-old-price').value ? parseInt(document.getElementById('add-old-price').value, 10) : null,
    category: document.getElementById('add-category').value,
    stock: parseInt(document.getElementById('add-stock').value, 10),
    brand: document.getElementById('add-brand').value.trim() || 'NUTRI FORGE',
    sku: document.getElementById('add-sku').value.trim() || 'NF-' + Math.floor(100 + Math.random() * 900),
    image: primaryImage,
    images: gallery,
    shortDesc: document.getElementById('add-short-desc').value.trim(),
    description: document.getElementById('add-desc').value.trim(),
    isPromo: document.getElementById('add-is-promo').checked,
    status: 'active',
    rating: 5.0,
    reviewsCount: 0
  };

  saveProduct(newProduct);
  showToast(`Le produit "${newProduct.name}" a été ajouté avec succès avec ${gallery.length} photo(s) !`);
  switchAdminTab('tab-products');
};

// ==========================================================================
// 4. STOCK MANAGER
// ==========================================================================
function renderStockManager(container) {
  const products = getProducts();

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Contrôle des Stocks en Temps Réel (${products.length})</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">Ajustez directement les quantités avec les boutons d'incrémentation rapide.</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Stock Actuel</th>
              <th>Statut</th>
              <th style="text-align: right;">Ajustement Rapide</th>
            </tr>
          </thead>
          <tbody>
            ${products.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align: center; padding: 48px 20px; color: var(--admin-text-muted);">
                  <div style="font-size: 2.2rem; margin-bottom: 12px;">📊</div>
                  <strong style="color: #FFFFFF; font-size: 1.05rem;">Aucun stock à afficher (0 produit).</strong><br>
                  <p style="font-size: 0.82rem; color: #888888; max-width: 480px; margin: 8px auto 16px;">
                    Ajoutez vos articles dans le catalogue pour pouvoir gérer leurs quantités et alertes de réapprovisionnement.
                  </p>
                  <button class="btn btn-primary btn-sm" onclick="switchAdminTab('tab-add-product')">+ Ajouter un produit</button>
                </td>
              </tr>
            ` : products.map(p => {
              const statusClass = p.stock <= 0 ? 'status-cancelled' : p.stock <= 5 ? 'status-preparing' : 'status-confirmed';
              const statusLabel = p.stock <= 0 ? 'Rupture' : p.stock <= 5 ? 'Stock Faible' : 'En Stock';

              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <img src="${p.image}" class="table-img-thumb" alt="${p.name}">
                      <div>
                        <strong>${p.name}</strong>
                        <div style="font-size: 0.72rem; color: var(--admin-text-muted); font-family: monospace;">SKU: ${p.sku || p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>${p.category}</td>
                  <td><strong style="font-family: var(--admin-font-display); font-size: 1.1rem;">${p.stock}</strong></td>
                  <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                  <td style="text-align: right;">
                    <div class="stock-adjust-bar" style="justify-content: flex-end;">
                      <button class="stock-adjust-btn" title="-1" onclick="adjustProductStock('${p.id}', -1)">-1</button>
                      <button class="stock-adjust-btn" title="+1" onclick="adjustProductStock('${p.id}', 1)">+1</button>
                      <button class="stock-adjust-btn" title="+10" onclick="adjustProductStock('${p.id}', 10)">+10</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.adjustProductStock = function(id, delta) {
  const products = getProducts();
  const prod = products.find(p => p.id === id);
  if (prod) {
    prod.stock = Math.max(0, prod.stock + delta);
    setProducts(products);
    showToast(`Stock de "${prod.name}" ajusté à ${prod.stock}`);
    renderStockManager(document.getElementById('admin-dynamic-content'));
  }
};

// ==========================================================================
// 5. ORDERS MANAGER
// ==========================================================================
function renderOrdersManager(container) {
  const orders = getOrders();

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Toutes les Commandes (${orders.length})</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">Changement de statut direct avec sauvegarde automatique.</p>
        </div>
        ${orders.length > 0 ? `
          <button class="btn btn-secondary btn-sm" style="color: #ff6666; border-color: #552222;" onclick="resetAllOrders()">🗑️ Vider les commandes (0)</button>
        ` : ''}
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID & Date</th>
              <th>Client</th>
              <th>Destination</th>
              <th>Articles Commandés</th>
              <th>Total</th>
              <th>Paiement / Mode</th>
              <th>Statut de la Commande</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--admin-text-muted);">
                  <div style="font-size: 2.2rem; margin-bottom: 12px;">🛒</div>
                  <strong style="color: #FFFFFF; font-size: 1.05rem;">Aucune commande en attente (0 commande).</strong><br>
                  <p style="font-size: 0.82rem; color: #888888; max-width: 480px; margin: 8px auto 0;">
                    Votre boutique est prête à recevoir de véritables commandes. Dès qu'un client valide son panier, sa commande s'affichera immédiatement ici avec ses coordonnées et ses choix de livraison.
                  </p>
                </td>
              </tr>
            ` : orders.map(o => `
              <tr>
                <td>
                  <strong style="color: var(--admin-accent-white); font-family: var(--admin-font-display);">${o.id}</strong>
                  <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${new Date(o.date).toLocaleDateString('fr-FR')} ${new Date(o.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td>
                  <strong>${o.customer.firstName} ${o.customer.lastName}</strong>
                  <div style="font-size: 0.78rem; color: var(--admin-text-secondary);">${o.customer.phone}</div>
                </td>
                <td>
                  <div style="font-size: 0.82rem;">${o.customer.wilaya}</div>
                  <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${o.customer.commune} - ${o.customer.address}</div>
                </td>
                <td>
                  <div style="font-size: 0.8rem;">
                    ${o.items.map(i => `• ${i.name} (×${i.qty})`).join('<br>')}
                  </div>
                </td>
                <td>
                  <strong style="font-family: var(--admin-font-display); font-size: 0.95rem;">${formatPrice(o.total)}</strong>
                </td>
                <td>
                  <div style="font-size: 0.78rem; text-transform: uppercase;">${o.paymentMethod === 'cod' ? '💵 Cash' : '💳 Carte'}</div>
                  <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${o.deliveryType === 'domicile' ? 'À Domicile' : 'Point Relais'}</div>
                </td>
                <td>
                  <select class="admin-select" style="padding: 6px 10px; font-size: 0.75rem;" onchange="changeOrderStatus('${o.id}', this.value)">
                    ${['Nouvelle', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'].map(st => `
                      <option value="${st}" ${st === o.status ? 'selected' : ''}>${st}</option>
                    `).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.changeOrderStatus = function(orderId, newStatus) {
  updateOrderStatus(orderId, newStatus);
  showToast(`Statut de la commande ${orderId} mis à jour : "${newStatus}"`);
};

window.resetAllOrders = function() {
  if (confirm('Voulez-vous réinitialiser toutes les commandes à zéro (0 commande) ?')) {
    setOrders([]);
    showToast('Toutes les commandes ont été remises à zéro.');
    renderActiveView();
  }
};

// ==========================================================================
// 6. CUSTOMERS MANAGER (AGGREGATED FROM ORDERS)
// ==========================================================================
function renderCustomersManager(container) {
  const orders = getOrders();

  // Aggregate customers by phone number
  const customersMap = {};
  orders.forEach(o => {
    const key = o.customer.phone;
    if (!customersMap[key]) {
      customersMap[key] = {
        firstName: o.customer.firstName,
        lastName: o.customer.lastName,
        phone: o.customer.phone,
        wilaya: o.customer.wilaya,
        commune: o.customer.commune,
        ordersCount: 0,
        totalSpent: 0,
        lastOrder: o.date
      };
    }
    customersMap[key].ordersCount += 1;
    if (o.status !== 'Annulée') {
      customersMap[key].totalSpent += o.total;
    }
  });

  const customersList = Object.values(customersMap);

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Répertoire des Clients (${customersList.length})</h3>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Wilaya / Commune</th>
              <th>Commandes</th>
              <th>Total Dépensé</th>
              <th>Dernière Commande</th>
            </tr>
          </thead>
          <tbody>
            ${customersList.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--admin-text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 8px;">👥</div>
                  <strong style="color: #FFFFFF;">Aucun client enregistré pour l'instant (0 client).</strong><br>
                  <span style="font-size: 0.8rem; color: #888888;">Les profils de vos acheteurs seront automatiquement créés lors de leurs commandes.</span>
                </td>
              </tr>
            ` : customersList.map(c => `
              <tr>
                <td><strong>${c.firstName} ${c.lastName}</strong></td>
                <td><code style="background: var(--admin-surface); padding: 2px 6px; border-radius: 3px;">${c.phone}</code></td>
                <td>${c.wilaya} (${c.commune})</td>
                <td><span class="status-pill status-confirmed">${c.ordersCount} cmd</span></td>
                <td><strong style="font-family: var(--admin-font-display);">${formatPrice(c.totalSpent)}</strong></td>
                <td style="color: var(--admin-text-muted); font-size: 0.8rem;">${new Date(c.lastOrder).toLocaleDateString('fr-FR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==========================================================================
// 7. PROMOTIONS MANAGER
// ==========================================================================
function renderPromotionsManager(container) {
  const products = getProducts();

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 class="admin-card-title">Offres & Réductions de la Boutique</h3>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-top: 4px;">Activez ou désactivez les promotions avec calcul de l'ancien prix barré.</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Prix Actuel</th>
              <th>Ancien Prix (Barré)</th>
              <th>Économie Client</th>
              <th>État Promo</th>
              <th style="text-align: right;">Action Rapide</th>
            </tr>
          </thead>
          <tbody>
            ${products.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; padding: 48px 20px; color: var(--admin-text-muted);">
                  <div style="font-size: 2.2rem; margin-bottom: 12px;">🏷️</div>
                  <strong style="color: #FFFFFF; font-size: 1.05rem;">Aucun produit pour le moment (0 promotion).</strong><br>
                  <p style="font-size: 0.82rem; color: #888888; max-width: 480px; margin: 8px auto 16px;">
                    Ajoutez vos articles dans le catalogue pour pouvoir configurer des remises promotionnelles.
                  </p>
                </td>
              </tr>
            ` : products.map(p => {
              const isPromo = p.isPromo || (p.oldPrice && p.oldPrice > p.price);
              const saving = isPromo && p.oldPrice ? p.oldPrice - p.price : 0;

              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${p.image}" class="table-img-thumb" alt="${p.name}">
                      <strong>${p.name}</strong>
                    </div>
                  </td>
                  <td><strong style="font-family: var(--admin-font-display);">${formatPrice(p.price)}</strong></td>
                  <td>${p.oldPrice ? formatPrice(p.oldPrice) : '-'}</td>
                  <td>${saving > 0 ? `<span class="badge badge-promo">-${formatPrice(saving)}</span>` : '-'}</td>
                  <td>
                    <span class="status-pill ${isPromo ? 'status-new' : 'status-cancelled'}">
                      ${isPromo ? 'Active' : 'Désactivée'}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm" onclick="toggleProductPromo('${p.id}')">
                      ${isPromo ? 'Retirer la promo' : 'Activer promo (-15%)'}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.toggleProductPromo = function(id) {
  const products = getProducts();
  const prod = products.find(p => p.id === id);
  if (prod) {
    if (prod.isPromo) {
      prod.isPromo = false;
      prod.oldPrice = null;
      showToast(`Promotion retirée pour "${prod.name}"`);
    } else {
      prod.isPromo = true;
      prod.oldPrice = Math.round(prod.price * 1.18);
      showToast(`Promotion activée pour "${prod.name}"`);
    }
    setProducts(products);
    renderPromotionsManager(document.getElementById('admin-dynamic-content'));
  }
};

// ==========================================================================
// 8. SETTINGS MANAGER
// ==========================================================================
function renderSettingsManager(container) {
  const settings = getSettings();

  container.innerHTML = `
    <div class="admin-card" style="max-width: 760px; margin: 0 auto;">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Paramètres Généraux de la Boutique</h3>
      </div>

      <form id="settings-form" onsubmit="event.preventDefault(); saveStoreSettings();">
        <div class="admin-form-group">
          <label class="admin-form-label">Nom de la Marque</label>
          <input type="text" id="set-name" class="admin-input" value="${settings.storeName}" required>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Slogan / Tagline</label>
          <input type="text" id="set-tagline" class="admin-input" value="${settings.tagline}">
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Téléphone Service Client</label>
            <input type="text" id="set-phone" class="admin-input" value="${settings.phone}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Email de Contact</label>
            <input type="email" id="set-email" class="admin-input" value="${settings.email}">
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Adresse du Siège & Entrepôt</label>
          <input type="text" id="set-address" class="admin-input" value="${settings.address}">
        </div>

        <div class="form-grid-2">
          <div class="admin-form-group">
            <label class="admin-form-label">Seuil de Livraison Gratuite (DA)</label>
            <input type="number" id="set-free-ship" class="admin-input" value="${settings.freeShippingThreshold}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Code Promo par Défaut (-10%)</label>
            <input type="text" id="set-promo-code" class="admin-input" value="${settings.promoDiscountCode}">
          </div>
        </div>

        <div style="margin-top: 30px; display: flex; gap: 14px; flex-wrap: wrap;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Enregistrer les Paramètres</button>
          <button type="button" class="btn btn-secondary" style="color: #ff6666; border-color: #552222;" onclick="resetDemoData()">⚠️ Remise à Zéro Complète</button>
        </div>
      </form>
    </div>
  `;
}

window.saveStoreSettings = function() {
  const updatedSettings = {
    ...getSettings(),
    storeName: document.getElementById('set-name').value.trim(),
    tagline: document.getElementById('set-tagline').value.trim(),
    phone: document.getElementById('set-phone').value.trim(),
    email: document.getElementById('set-email').value.trim(),
    address: document.getElementById('set-address').value.trim(),
    freeShippingThreshold: parseInt(document.getElementById('set-free-ship').value, 10),
    promoDiscountCode: document.getElementById('set-promo-code').value.trim()
  };

  setSettings(updatedSettings);
  showToast('Paramètres de la boutique enregistrés !');
};

window.resetDemoData = function() {
  if (confirm('Voulez-vous effectuer un RESET COMPLET de toutes les données (0 DA de CA, 0 commande, 0 produit, 0 stock, 0 alerte) ?')) {
    resetStoreToCleanZero();
    showToast('Toutes les données ont été réinitialisées à zéro.');
    renderActiveView();
  }
};
