export default function handler(req, res) {
  res.status(200).json({ message: '部署成功 ✅', time: new Date().toISOString() });
}
