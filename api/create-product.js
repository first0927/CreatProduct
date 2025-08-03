// File: api/create-product.js
import fetch from 'node-fetch';

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/2023-07/products.json`;
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { title, price, material, color, description } = req.body;

    const payload = {
      product: {
        title: title || '3D打印模型',
        body_html: description || '由客户自定义上传',
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

    const response = await fetch(SHOPIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_API_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.product && data.product.variants.length > 0) {
      const variantId = data.product.variants[0].id;
      return res.status(200).json({
        success: true,
        checkoutUrl: `/cart/${variantId}:1`
      });
    } else {
      return res.status(500).json({ success: false, message: '创建产品失败', data });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
