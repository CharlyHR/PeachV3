// /api/productos.js — Vercel Serverless Function
// Proxies product requests to Tienda Nube API.
// Secrets (TN_ACCESS_TOKEN, TN_STORE_ID) are read from process.env only —
// they NEVER appear in this file or any file in the repo.

const ALLOWED_ORIGINS = [
  'https://peach-v2.vercel.app',
  'http://localhost:3000',
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const token   = process.env.TN_ACCESS_TOKEN;
  const storeId = process.env.TN_STORE_ID;

  if (!token || !storeId) {
    res.status(500).json({ error: 'No se pudieron cargar los productos' });
    return;
  }

  const params = new URLSearchParams({ per_page: '200' });
  if (req.query.categoria_id) {
    params.set('category_id', req.query.categoria_id);
  }

  try {
    const tnRes = await fetch(
      `https://api.tiendanube.com/2025-03/${storeId}/products?${params}`,
      {
        headers: {
          'Authentication': `bearer ${token}`,
          'User-Agent':     'PeachWeb (hola@peachstudio.com)',
          'Content-Type':   'application/json',
        },
      }
    );

    if (!tnRes.ok) {
      res.status(200).json({ error: 'No se pudieron cargar los productos' });
      return;
    }

    const data = await tnRes.json();

    const productos = data
      .filter(product => product.published === true)
      .map(product => ({
        id:                 product.id,
        nombre:             product.name?.es || product.name?.en || 'Sin nombre',
        descripcion:        product.description?.es || '',
        precio:             parseFloat(product.variants?.[0]?.price || 0),
        precio_promocional: product.variants?.[0]?.promotional_price
                              ? parseFloat(product.variants[0].promotional_price)
                              : null,
        imagen:             product.images?.[0]?.src || null,
        link_checkout:      `https://www.tiendanube.com/checkout/v3/start`,
        link_producto:      `https://${storeId}.mitiendanube.com/productos/${product.handle?.es}`,
        publicado:          product.published,
      }));

    res.status(200).json(productos);
  } catch (_err) {
    res.status(200).json({ error: 'No se pudieron cargar los productos' });
  }
}
