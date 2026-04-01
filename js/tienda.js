// /js/tienda.js — Peach Studio store frontend
// Fetches products and categories from Vercel Serverless Functions.
// Change API_BASE to '' for same-domain (Vercel) or 'http://localhost:3000' for local dev.
const API_BASE = '';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const filtersEl     = document.getElementById('store-filters');
const gridEl        = document.getElementById('product-grid');

// ─── State ────────────────────────────────────────────────────────────────────
let allProducts   = [];
let activeCatId   = null;   // null = "Todos"

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────
function showSkeletons(count = 6) {
  gridEl.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line price"></div>
        <div class="skeleton skeleton-line btn"></div>
      </div>
    </div>
  `).join('');
}

// ─── Product card HTML ────────────────────────────────────────────────────────
function buildCard(p) {
  const imgHtml = p.imagen
    ? `<img src="${escHtml(p.imagen)}" alt="${escHtml(p.nombre)}" loading="lazy" />`
    : `<div class="product-img-placeholder">
         <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
           <rect x="3" y="3" width="18" height="18" rx="3"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <polyline points="21 15 16 10 5 21"/>
         </svg>
       </div>`;

  const priceHtml = p.precio_promocional
    ? `<div class="product-pricing">
         <span class="price-original">${formatPrice(p.precio)}</span>
         <span class="price-promo">${formatPrice(p.precio_promocional)}</span>
       </div>`
    : `<div class="product-pricing">
         <span class="price-normal">${formatPrice(p.precio)}</span>
       </div>`;

  return `
    <article class="product-card">
      <div class="product-img-wrap">${imgHtml}</div>
      <div class="product-body">
        <h3 class="product-name">${escHtml(p.nombre)}</h3>
        ${priceHtml}
        <a href="${escHtml(p.link_producto)}"
           target="_blank"
           rel="noopener noreferrer"
           class="product-cta">
          Ver producto
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </a>
      </div>
    </article>
  `;
}

// ─── Render products ──────────────────────────────────────────────────────────
function renderProducts(products) {
  if (products.length === 0) {
    gridEl.innerHTML = `
      <div class="state-empty">
        <div class="state-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3>No encontramos productos</h3>
        <p>Probá con otra categoría o volvé en un momento.</p>
      </div>
    `;
    return;
  }
  gridEl.innerHTML = products.map(buildCard).join('');
}

// ─── Render error ─────────────────────────────────────────────────────────────
function renderError() {
  gridEl.innerHTML = `
    <div class="state-error">
      <div class="state-error-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3>Algo salió mal</h3>
      <p>No pudimos cargar los productos. Revisá tu conexión e intentá de nuevo.</p>
      <button class="retry-btn" onclick="initStore()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reintentar
      </button>
    </div>
  `;
}

// ─── Load products (with optional category filter) ────────────────────────────
async function loadProducts(catId = null) {
  showSkeletons();
  const url = catId
    ? `${API_BASE}/api/productos?categoria_id=${encodeURIComponent(catId)}`
    : `${API_BASE}/api/productos`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (data.error) {
      renderError();
      return;
    }

    allProducts = data;
    renderProducts(allProducts);
  } catch (_err) {
    renderError();
  }
}

// ─── Load categories & build filter pills ─────────────────────────────────────
async function loadCategories() {
  try {
    const res  = await fetch(`${API_BASE}/api/categorias`);
    const data = await res.json();

    if (data.error || !Array.isArray(data) || data.length === 0) {
      // No categories — hide filters bar gracefully
      filtersEl.style.display = 'none';
      return;
    }

    // Build "Todos" + per-category buttons
    const pills = [
      buildFilterBtn(null, 'Todos', true),
      ...data.map(cat => buildFilterBtn(cat.id, cat.nombre, false)),
    ];
    filtersEl.innerHTML = pills.join('');

    // Attach click handlers
    filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.catId || null;
        setActiveFilter(btn, catId);
      });
    });
  } catch (_err) {
    filtersEl.style.display = 'none';
  }
}

function buildFilterBtn(catId, label, isActive) {
  const dataAttr = catId != null ? `data-cat-id="${catId}"` : '';
  const activeClass = isActive ? ' active' : '';
  return `<button class="filter-btn${activeClass}" ${dataAttr}>${escHtml(label)}</button>`;
}

function setActiveFilter(clickedBtn, catId) {
  filtersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  clickedBtn.classList.add('active');
  activeCatId = catId;
  loadProducts(catId);
}

// ─── Security helper — escape HTML before injecting into DOM ──────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initStore() {
  showSkeletons();
  // Fire both in parallel; products display independently of categories
  await Promise.all([
    loadCategories(),
    loadProducts(null),
  ]);
}

document.addEventListener('DOMContentLoaded', initStore);
