// /api/categorias.js — Vercel Serverless Function
// Proxies category requests to Tienda Nube API.
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
    res.status(500).json({ error: 'No se pudieron cargar las categorías' });
    return;
  }

  try {
    const tnRes = await fetch(
      `https://api.tiendanube.com/2025-03/${storeId}/categories`,
      {
        headers: {
          'Authentication': `bearer ${token}`,
          'User-Agent':     'PeachWeb (hola@peachstudio.com)',
          'Content-Type':   'application/json',
        },
      }
    );

    if (!tnRes.ok) {
      res.status(200).json({ error: 'No se pudieron cargar las categorías' });
      return;
    }

    const data = await tnRes.json();

    const categorias = data.map(category => ({
      id:                 category.id,
      nombre:             category.name?.es || category.name?.en || 'Sin nombre',
      cantidad_productos: category.product_count || 0,
    }));

    res.status(200).json(categorias);
  } catch (_err) {
    res.status(200).json({ error: 'No se pudieron cargar las categorías' });
  }
}
