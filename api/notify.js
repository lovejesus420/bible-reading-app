import webpush from 'web-push';

const DB_URL = process.env.VITE_FB_DB_URL;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:lovejesus420@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!DB_URL || !process.env.VAPID_PUBLIC_KEY) return res.status(200).json({ ok: true });

  const { username } = req.body;
  if (!username) return res.status(400).end();

  const subsRes = await fetch(`${DB_URL}/subscriptions.json`);
  const subs = await subsRes.json();
  if (!subs) return res.status(200).json({ ok: true });

  await Promise.all(
    Object.entries(subs)
      .filter(([name]) => name !== username)
      .map(([, sub]) =>
        webpush.sendNotification(
          sub,
          JSON.stringify({
            title: '📖 성경통독',
            body: `${username}님이 오늘 말씀을 읽었습니다!`,
          })
        ).catch(() => {})
      )
  );

  res.status(200).json({ ok: true });
}
