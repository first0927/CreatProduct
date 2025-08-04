export default async function handler(req, res) {
  // 1. 设置精确的CORS头
  const allowedOrigins = [
    'https://byiby.myshopify.com',
    'https://admin.shopify.com' // 如果从Shopify管理界面调用
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // 告诉浏览器响应会根据Origin变化
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时缓存预检请求
  
  // 2. 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // 3. 确保只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // 4. 解析JSON请求体
  try {
    req.body = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'));
        } catch (e) {
          resolve({});
        }
      });
    });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  // 5. 验证必要参数
  const { title, price, material, description } = req.body;
  
  // 验证价格类型
  const priceNum = parseFloat(price);
  if (!title || !price || isNaN(priceNum)) {
    return res.status(400).json({ error: '缺少必要参数或价格无效' });
  }
  
  // 6. 获取环境变量
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
  
  if (!SHOPIFY_STORE || !ADMIN_API_TOKEN) {
    return res.status(500).json({ 
      error: '服务器配置错误',
      details: '缺少Shopify环境变量'
    });
  }
  
  // 7. 更新API版本至最新
  const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json`;
  
  try {
    const payload = {
      product: {
        title: title || '3D打印模型',
        body_html: description || '用户上传的自定义模型',
        variants: [
          {
            price: priceNum.toFixed(2),
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
    
    // 8. 调用Shopify API
    const shopifyRes = await fetch(SHOPIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_API_TOKEN
      },
      body: JSON.stringify(payload)
    });
    
    // 9. 处理Shopify错误响应
    if (!shopifyRes.ok) {
      const errorData = await shopifyRes.json();
      return res.status(shopifyRes.status).json({
        success: false,
        error: `Shopify API错误: ${shopifyRes.status}`,
        details: errorData
      });
    }
    
    const data = await shopifyRes.json();
    
    // 10. 返回成功响应
    if (data.product?.variants?.[0]?.id) {
      const variantId = data.product.variants[0].id;
      return res.status(200).json({
        success: true,
        checkoutUrl: `/cart/${variantId}:1`
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: '创建失败', 
        raw: data 
      });
    }
  } catch (err) {
    // 11. 详细错误日志
    console.error('API处理错误:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      error: '内部服务器错误',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
