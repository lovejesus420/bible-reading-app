const DB_URL = process.env.VITE_FB_DB_URL;

export default async function handler(req, res) {
  const { method, query } = req;
  if (!DB_URL) return res.status(200).json({});

  if (method === 'GET') {
    const node = query.node || '';
    // basic sanitization: allow only letters/numbers/underscore and slashes
    if (!/^[\w\/-]*$/.test(node)) return res.status(400).end();
    try {
      const r = await fetch(`${DB_URL}/${node}.json`);
      const j = await r.json();
      return res.status(200).json(j);
    } catch (e) {
      console.error('fbdata proxy failed', e);
      return res.status(500).json({});
    }
  }

  res.status(405).end();
}
