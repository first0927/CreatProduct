export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // ✅ 允许所有来源请求
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.status(200).send('Hello from Vercel API!');
}
