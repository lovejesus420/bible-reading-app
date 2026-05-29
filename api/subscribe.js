const DB_URL = process.env.VITE_FB_DB_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, subscription } = req.body;
  if (!username || !subscription || !DB_URL) return res.status(400).end();

  const r = await fetch(
    `${DB_URL}/subscriptions/${encodeURIComponent(username)}.json`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    }
  );
  res.status(r.ok ? 200 : 500).json({ ok: r.ok });
}
