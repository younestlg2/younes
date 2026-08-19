/**
 * KRONOS NUTRITION - CORE APP & DATA STORE (VANILLA JS)
 * Handles LocalStorage data persistence, seed initialization,
 * cart operations, toast alerts, price formatting, and shared state.
 */

/// Storage Keys
const STORAGE_KEYS = {
  PRODUCTS: 'nutri_forge_products_v1',
  LEGACY_PRODUCTS: 'kronos_products_data_v1',
  CART: 'nutri_forge_cart_items_v1',
  LEGACY_CART: 'kronos_cart_items_v1',
  ORDERS: 'nutri_forge_orders_data_v1',
  LEGACY_ORDERS: 'kronos_orders_data_v1',
  CUSTOMERS: 'nutri_forge_customers_data_v1',
  SETTINGS: 'nutri_forge_store_settings_v1',
  LEGACY_SETTINGS: 'kronos_store_settings_v1',
  AUTH: 'kronos_admin_auth_session_v1',
  MONTHLY_STATS: 'nutri_forge_monthly_stats_v1',
  LAST_RECORDED_MONTH: 'nutri_forge_last_active_month_v1',
  SIMULATED_MONTH: 'nutri_forge_simulated_month_override_v1'
};

const ZERO_RESET_VERSION_KEY = 'nutri_forge_clean_zero_state_v3';

// French Month Labels for Display & Analytics
const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const SHORT_MONTH_NAMES_FR = [
  'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

// Helper to safely read from primary key or fallback legacy key with auto-migration
function getRawStorage(primaryKey, fallbackKey) {
  let val = localStorage.getItem(primaryKey);
  if (!val && fallbackKey) {
    val = localStorage.getItem(fallbackKey);
    if (val) {
      localStorage.setItem(primaryKey, val);
    }
  }
  return val;
}

// Algerian Wilayas with Base Delivery Fees (DZD)
const WILAYAS_LIST = [
  { code: '16', name: '16 - Alger', fee: 400 },
  { code: '09', name: '09 - Blida', fee: 500 },
  { code: '31', name: '31 - Oran', fee: 600 },
  { code: '25', name: '25 - Constantine', fee: 600 },
  { code: '19', name: '19 - Sétif', fee: 600 },
  { code: '23', name: '23 - Annaba', fee: 650 },
  { code: '35', name: '35 - Boumerdès', fee: 500 },
  { code: '15', name: '15 - Tizi Ouzou', fee: 550 },
  { code: '06', name: '06 - Béjaïa', fee: 600 },
  { code: '13', name: '13 - Tlemcen', fee: 700 },
  { code: '05', name: '05 - Batna', fee: 650 },
  { code: '27', name: '27 - Mostaganem', fee: 650 },
  { code: '30', name: '30 - Ouargla', fee: 900 },
  { code: '47', name: '47 - Ghardaïa', fee: 900 },
  { code: '08', name: '08 - Béchar', fee: 1000 },
  { code: '11', name: '11 - Tamanrasset', fee: 1400 }
];

// Clean initial empty state: 0 demo products, 0 demo orders
const DEFAULT_PRODUCTS = [];
const DEFAULT_ORDERS = [];

// Standard Store Categories
const STORE_CATEGORIES = [
  'Créatine',
  'Pré-workout',
  'Vitamines',
  'Accessoires'
];

// Robust Category Normalization (removes accents, hyphens, spaces, lowercases)
function normalizeCategory(cat) {
  if (!cat) return '';
  return cat
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

window.STORE_CATEGORIES = STORE_CATEGORIES;
window.normalizeCategory = normalizeCategory;

// Initial Settings
const DEFAULT_SETTINGS = {
  storeName: 'NUTRI FORGE 10',
  tagline: 'PERFORMANCE. DISCIPLINE. RESULTS.',
  phone: '+213 555 01 92 84',
  email: 'contact@nutriforge.dz',
  address: 'Zone Industrielle Oued Smar, Alger, Algérie',
  currency: 'DZD',
  currencySymbol: 'DA',
  freeShippingThreshold: 20000,
  promoDiscountCode: 'FORGE10',
  promoDiscountPercent: 10
};

// ==========================================================================
// DATA INITIALIZATION & STORE LAYER (NON-DESTRUCTIVE PERSISTENCE)
// ==========================================================================
function initAppStorage() {
  // One-time forced reset of old demo/test mock data to guarantee clean 0 state
  if (localStorage.getItem(ZERO_RESET_VERSION_KEY) !== 'complete') {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEGACY_PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEGACY_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEGACY_CART, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MONTHLY_STATS, JSON.stringify({}));
    localStorage.removeItem(STORAGE_KEYS.SIMULATED_MONTH);
    localStorage.setItem(ZERO_RESET_VERSION_KEY, 'complete');
  }

  // 1. Products: retrieve existing or initialize empty array
  const existingProducts = getRawStorage(STORAGE_KEYS.PRODUCTS, STORAGE_KEYS.LEGACY_PRODUCTS);
  if (existingProducts === null || existingProducts === undefined) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEGACY_PRODUCTS, JSON.stringify([]));
  }

  // 2. Cart: retrieve existing or initialize empty array
  const existingCart = getRawStorage(STORAGE_KEYS.CART, STORAGE_KEYS.LEGACY_CART);
  if (existingCart === null || existingCart === undefined) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  }

  // 3. Orders: retrieve existing or initialize empty array
  const existingOrders = getRawStorage(STORAGE_KEYS.ORDERS, STORAGE_KEYS.LEGACY_ORDERS);
  if (existingOrders === null || existingOrders === undefined) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEGACY_ORDERS, JSON.stringify([]));
  }

  // 4. Settings: retrieve existing or initialize default
  const existingSettings = getRawStorage(STORAGE_KEYS.SETTINGS, STORAGE_KEYS.LEGACY_SETTINGS);
  if (!existingSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }

  // 5. Compute and synchronize monthly stats according to real orders in store
  syncMonthlyStats();
}

// Global Clean Zero Reset Function (available across dashboard and console)
function resetStoreToCleanZero() {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.LEGACY_PRODUCTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.LEGACY_ORDERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.LEGACY_CART, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.MONTHLY_STATS, JSON.stringify({}));
  localStorage.removeItem(STORAGE_KEYS.SIMULATED_MONTH);
  localStorage.setItem(ZERO_RESET_VERSION_KEY, 'complete');
  syncMonthlyStats();
}
window.resetStoreToCleanZero = resetStoreToCleanZero;

// Products API (Permanent Catalog)
function getProducts() {
  try {
    const raw = getRawStorage(STORAGE_KEYS.PRODUCTS, STORAGE_KEYS.LEGACY_PRODUCTS);
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (e) {
    console.error('Error loading products:', e);
    return [];
  }
}

function setProducts(products) {
  const json = JSON.stringify(products);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, json);
  localStorage.setItem(STORAGE_KEYS.LEGACY_PRODUCTS, json);
}

function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

function saveProduct(productData) {
  const products = getProducts();
  const existingIdx = products.findIndex(p => p.id === productData.id);

  // Normalize images array
  const formattedImages = Array.isArray(productData.images) && productData.images.length > 0
    ? productData.images
    : (productData.image ? [{ type: productData.image.startsWith('data:') ? 'upload' : 'url', url: productData.image }] : []);

  // Ensure primary image is always set
  const primaryImgUrl = productData.image || (formattedImages[0]?.url || formattedImages[0] || '');

  const finalProductPayload = {
    ...productData,
    image: primaryImgUrl,
    images: formattedImages
  };

  if (existingIdx >= 0) {
    products[existingIdx] = { ...products[existingIdx], ...finalProductPayload };
  } else {
    // New product
    const newId = productData.id || 'nf-' + Date.now().toString(36);
    products.unshift({
      id: newId,
      status: 'active',
      rating: 5.0,
      reviewsCount: 0,
      ...finalProductPayload
    });
  }
  setProducts(products);
  return true;
}

function deleteProduct(id) {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  setProducts(filtered);
  return true;
}

// Cart API
function getCart() {
  try {
    const raw = getRawStorage(STORAGE_KEYS.CART, STORAGE_KEYS.LEGACY_CART);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setCart(cart) {
  const json = JSON.stringify(cart);
  localStorage.setItem(STORAGE_KEYS.CART, json);
  localStorage.setItem(STORAGE_KEYS.LEGACY_CART, json);
  updateHeaderCartBadge();
}

function addToCart(productId, qty = 1) {
  const product = getProductById(productId);
  if (!product) {
    showToast('Produit introuvable', 'error');
    return false;
  }

  if (product.stock <= 0) {
    showToast('Ce produit est actuellement en rupture de stock.', 'error');
    return false;
  }

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  const newQty = existing ? existing.qty + qty : qty;

  if (newQty > product.stock) {
    showToast(`Stock insuffisant. Maximum disponible : ${product.stock}`, 'error');
    return false;
  }

  if (existing) {
    existing.qty = newQty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      qty: qty
    });
  }

  setCart(cart);
  showToast(`"${product.name}" ajouté au panier !`);
  return true;
}

function updateCartQty(productId, newQty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const product = getProductById(productId);
  const maxStock = product ? product.stock : 99;

  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  if (newQty > maxStock) {
    showToast(`Stock maximal atteint (${maxStock})`, 'error');
    item.qty = maxStock;
  } else {
    item.qty = newQty;
  }

  setCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  setCart(cart);
  showToast('Produit retiré du panier');
}

function clearCart() {
  setCart([]);
}

function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// ==========================================================================
// MONTHLY MANAGEMENT & HISTORICAL ANALYTICS ENGINE
// ==========================================================================

// Returns the active month key, e.g. "2026-08" (or simulated month override for tests)
function getCurrentMonthKey() {
  const simulated = localStorage.getItem(STORAGE_KEYS.SIMULATED_MONTH);
  if (simulated && /^\d{4}-\d{2}$/.test(simulated)) {
    return simulated;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Converts "2026-08" to "Août 2026"
function getMonthLabel(monthKey) {
  if (!monthKey || typeof monthKey !== 'string') return 'Mois en cours';
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${MONTH_NAMES_FR[monthIndex]} ${year}`;
  }
  return monthKey;
}

// Converts "2026-08" to "Août"
function getShortMonthLabel(monthKey) {
  if (!monthKey || typeof monthKey !== 'string') return '';
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return SHORT_MONTH_NAMES_FR[monthIndex];
  }
  return monthKey;
}

// Syncs and aggregates all historical months from stored orders
function syncMonthlyStats() {
  const orders = getOrders();
  let existingStats = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_STATS);
    if (raw) existingStats = JSON.parse(raw) || {};
  } catch (e) {}

  const currentMonthKey = getCurrentMonthKey();
  const monthlyStats = { ...existingStats };

  // Collect all distinct months from orders and ensure current month is present
  const allMonths = new Set(Object.keys(monthlyStats));
  allMonths.add(currentMonthKey);

  orders.forEach(order => {
    if (order.date) {
      const orderDate = new Date(order.date);
      if (!isNaN(orderDate.getTime())) {
        const y = orderDate.getFullYear();
        const m = String(orderDate.getMonth() + 1).padStart(2, '0');
        allMonths.add(`${y}-${m}`);
      }
    }
  });

  // Re-initialize aggregators for each tracked month
  allMonths.forEach(mKey => {
    monthlyStats[mKey] = {
      monthKey: mKey,
      monthName: getMonthLabel(mKey),
      revenue: 0,
      orders: 0,
      confirmedOrders: 0,
      deliveredRevenue: 0,
      itemsCount: 0
    };
  });

  // Accumulate from orders based on each order's real creation date
  orders.forEach(order => {
    let orderMonthKey = currentMonthKey;
    if (order.date) {
      const orderDate = new Date(order.date);
      if (!isNaN(orderDate.getTime())) {
        const y = orderDate.getFullYear();
        const m = String(orderDate.getMonth() + 1).padStart(2, '0');
        orderMonthKey = `${y}-${m}`;
      }
    }

    if (!monthlyStats[orderMonthKey]) {
      monthlyStats[orderMonthKey] = {
        monthKey: orderMonthKey,
        monthName: getMonthLabel(orderMonthKey),
        revenue: 0,
        orders: 0,
        confirmedOrders: 0,
        deliveredRevenue: 0,
        itemsCount: 0
      };
    }

    // Only count active (non-cancelled) orders for revenue and count
    if (order.status !== 'Annulée') {
      const amount = Number(order.total) || 0;
      monthlyStats[orderMonthKey].revenue += amount;
      monthlyStats[orderMonthKey].orders += 1;

      if (order.status === 'Livrée' || order.status === 'Expédiée' || order.status === 'Confirmée') {
        monthlyStats[orderMonthKey].confirmedOrders += 1;
      }
      if (order.status === 'Livrée') {
        monthlyStats[orderMonthKey].deliveredRevenue += amount;
      }
      if (Array.isArray(order.items)) {
        monthlyStats[orderMonthKey].itemsCount += order.items.reduce((s, i) => s + (Number(i.qty) || 1), 0);
      }
    }
  });

  // Store updated monthly stats object and last active month in localStorage
  localStorage.setItem(STORAGE_KEYS.MONTHLY_STATS, JSON.stringify(monthlyStats));
  localStorage.setItem(STORAGE_KEYS.LAST_RECORDED_MONTH, currentMonthKey);

  return monthlyStats;
}

// Retrieves all monthly stats
function getMonthlyStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_STATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}
  return syncMonthlyStats();
}

// Retrieves stats for the currently active month
function getCurrentMonthStats() {
  const currentKey = getCurrentMonthKey();
  const allStats = getMonthlyStats();
  return allStats[currentKey] || {
    monthKey: currentKey,
    monthName: getMonthLabel(currentKey),
    revenue: 0,
    orders: 0,
    confirmedOrders: 0,
    deliveredRevenue: 0,
    itemsCount: 0
  };
}

// Retrieves stats for a specific month
function getMonthStats(monthKey) {
  const allStats = getMonthlyStats();
  return allStats[monthKey] || {
    monthKey: monthKey,
    monthName: getMonthLabel(monthKey),
    revenue: 0,
    orders: 0,
    confirmedOrders: 0,
    deliveredRevenue: 0,
    itemsCount: 0
  };
}

// Test Helper: Simulate month transition (e.g., passing from August to September)
function simulateMonth(monthKey) {
  if (monthKey) {
    localStorage.setItem(STORAGE_KEYS.SIMULATED_MONTH, monthKey);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SIMULATED_MONTH);
  }
  return syncMonthlyStats();
}

// Orders API (Permanent & Non-destructive)
function getOrders() {
  try {
    const raw = getRawStorage(STORAGE_KEYS.ORDERS, STORAGE_KEYS.LEGACY_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return DEFAULT_ORDERS;
  } catch (e) {
    return DEFAULT_ORDERS;
  }
}

function setOrders(orders) {
  const json = JSON.stringify(orders);
  localStorage.setItem(STORAGE_KEYS.ORDERS, json);
  localStorage.setItem(STORAGE_KEYS.LEGACY_ORDERS, json);
  syncMonthlyStats();
}

function addOrder(orderData) {
  const orders = getOrders();
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  
  // Use simulated month date if in test mode, else real current ISO string
  const simMonth = localStorage.getItem(STORAGE_KEYS.SIMULATED_MONTH);
  let orderDateISO = new Date().toISOString();
  if (simMonth && /^\d{4}-\d{2}$/.test(simMonth)) {
    orderDateISO = `${simMonth}-15T12:00:00.000Z`;
  }

  const newOrder = {
    id: orderId,
    date: orderDateISO,
    status: 'Nouvelle',
    ...orderData
  };

  // Decrement product stock permanently in database
  const products = getProducts();
  if (Array.isArray(newOrder.items)) {
    newOrder.items.forEach(orderItem => {
      const p = products.find(prod => prod.id === orderItem.id);
      if (p) {
        p.stock = Math.max(0, p.stock - (Number(orderItem.qty) || 1));
      }
    });
    setProducts(products);
  }

  orders.unshift(newOrder);
  setOrders(orders);
  return newOrder;
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    setOrders(orders);
    return true;
  }
  return false;
}

// Store Settings
function getSettings() {
  try {
    const raw = getRawStorage(STORAGE_KEYS.SETTINGS, STORAGE_KEYS.LEGACY_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function setSettings(settings) {
  const json = JSON.stringify(settings);
  localStorage.setItem(STORAGE_KEYS.SETTINGS, json);
  localStorage.setItem(STORAGE_KEYS.LEGACY_SETTINGS, json);
}

// Price Formatter (French Algerian Style e.g. "9 800 DA")
function formatPrice(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 DA';
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} DA`;
}

// Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="color: #888; font-weight: bold; cursor: pointer;" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Header Cart Badge Updater
function updateHeaderCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const badgeElements = document.querySelectorAll('.cart-badge-count');
  badgeElements.forEach(el => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? 'flex' : 'none';
  });
}

// Mobile Nav Menu Handler
function initMobileNav() {
  const toggleButtons = document.querySelectorAll('.menu-toggle-btn, #mobile-menu-toggle-btn');
  const drawer = document.querySelector('.mobile-nav-drawer');

  if (!drawer || toggleButtons.length === 0) return;

  function toggleMenu(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      toggleButtons.forEach(btn => btn.classList.remove('active'));
      document.body.style.overflow = '';
    } else {
      drawer.classList.add('open');
      toggleButtons.forEach(btn => btn.classList.add('active'));
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMenu() {
    drawer.classList.remove('open');
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    document.body.style.overflow = '';
  }

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', toggleMenu);
  });

  // Close when clicking/tapping on any nav link inside drawer
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    let clickedInsideToggle = false;
    toggleButtons.forEach(btn => {
      if (btn.contains(e.target)) clickedInsideToggle = true;
    });

    if (!drawer.contains(e.target) && !clickedInsideToggle && drawer.classList.contains('open')) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeMenu();
    }
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initAppStorage();
  updateHeaderCartBadge();
  initMobileNav();
});
