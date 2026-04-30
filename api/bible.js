export default async function handler(req, res) {
  const { book, chapter } = req.query;

  const bookNum = parseInt(book);
  const chapterNum = parseInt(chapter);

  if (!bookNum || !chapterNum || bookNum < 1 || bookNum > 66 || chapterNum < 1) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?VER=GAE&Book=${bookNum}&Jang=${chapterNum}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.bskorea.or.kr/',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Detect charset from Content-Type header, then HTML meta tag
    let encoding = 'utf-8';
    const ct = response.headers.get('content-type') || '';
    const ctMatch = ct.match(/charset=([^\s;]+)/i);
    if (ctMatch) {
      encoding = ctMatch[1].toLowerCase();
    } else {
      // Read first 2KB with lenient mode to find meta charset
      const preview = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 2048));
      const metaMatch = preview.match(/charset[=:]["']?\s*([a-zA-Z0-9_-]+)/i);
      if (metaMatch) encoding = metaMatch[1].toLowerCase();
    }

    const html = new TextDecoder(encoding, { fatal: false }).decode(bytes);
    const verses = parseVerses(html);

    if (verses.length === 0) {
      return res.status(404).json({ error: '본문을 찾을 수 없습니다.' });
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(verses);
  } catch (err) {
    console.error('Bible fetch error:', err.message);
    return res.status(500).json({ error: '본문을 불러오지 못했습니다.' });
  }
}

function parseVerses(html) {
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  const verses = [];
  const seen = new Set();
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;

  while ((m = pRegex.exec(html)) !== null) {
    let content = m[1];
    content = content.replace(/<[^>]+>/g, '');
    content = decodeEntities(content);
    content = content.replace(/\s+/g, ' ').trim();

    const vm = content.match(/^(\d{1,3})\s+(.+)$/);
    if (!vm) continue;

    const num = parseInt(vm[1]);
    const text = vm[2].trim();
    if (num >= 1 && text.length > 1 && !seen.has(num)) {
      seen.add(num);
      verses.push({ verse: num, text });
    }
  }

  verses.sort((a, b) => a.verse - b.verse);
  return verses;
}

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/\[\d+[)]\]/g, '')
    .replace(/\(\s*\d+\s*\)/g, '');
}
