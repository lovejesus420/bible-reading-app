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
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }
  if (!DB_URL || !process.env.VAPID_PUBLIC_KEY) return res.status(200).json({ ok: true });

  // KST = UTC+9
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const hour = nowKST.getUTCHours();
  if (hour < 8 || hour >= 22) return res.status(200).json({ skipped: 'outside hours' });

  const todayStr = nowKST.toISOString().slice(0, 10);

  const [subsRes, recordsRes, lastReadRes] = await Promise.all([
    fetch(`${DB_URL}/subscriptions.json`),
    fetch(`${DB_URL}/records.json`),
    fetch(`${DB_URL}/lastRead.json`),
  ]);
  const [subs, records, lastRead] = await Promise.all([
    subsRes.json(),
    recordsRes.json(),
    lastReadRes.json(),
  ]);

  if (!subs) return res.status(200).json({ ok: true });

  const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;

  await Promise.all(
    Object.entries(subs).map(async ([username, sub]) => {
      if (records?.[username]?.[todayStr] === true) return;
      const lastActivity = lastRead?.[username] ?? 0;
      if (lastActivity > eightHoursAgo) return;

      await webpush.sendNotification(
        sub,
        JSON.stringify({
          title: '📖 오늘 말씀 읽으셨나요?',
          body: '하루도 빠짐없이! 오늘의 성경 본문을 읽어보세요 🙏',
        })
      ).catch(() => {});
    })
  );

  res.status(200).json({ ok: true });
}
