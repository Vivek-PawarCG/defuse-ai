export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  res.status(200).json({
    status: 'ok',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    hasKey: !!process.env.GEMINI_API_KEY
  });
}
