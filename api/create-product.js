// File: api/create-product.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// ✅ 添加 CORS 中间件
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://byiby.myshopify.com'); // 也可以用 '*' 在开发阶段
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // 预检请求直接返回
  }
  next();
});

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/2023-07/products.json`;
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// ... 你原来的 POST 路由
router.post('/api/create-product', async (req, res) => {
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
});

export default router;
