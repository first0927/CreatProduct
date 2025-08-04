// File: /api/create-product.js

export default async function handler(req, res) {
  // 允许跨域（临时用 *）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // CORS 预检
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, price, material, description } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
  const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}/admin/api/2023-07/products.json`;

  try {
    const payload = {
      product: {
        title: title || '3D打印模型',
        body_html: description || '用户上传的自定义模型',
        variants: [
          {
            price: price.toFixed(2),
            inventory_quantity: 1,
            inventory_management: 'shopify',
            option1: material || 'PLA'
          }
        ],
        options: [
          {
            name: '材料',
            values: [material || 'PLA']
          }
        ]
      }
    };

    const shopifyRes = await fetch(SHOPIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_API_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data = await shopifyRes.json();

    if (data.product && data.product.variants.length > 0) {
      const variantId = data.product.variants[0].id;
      return res.status(200).json({
        success: true,
        checkoutUrl: `/cart/${variantId}:1`
      });
    } else {
      return res.status(500).json({ success: false, message: '创建失败', raw: data });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
