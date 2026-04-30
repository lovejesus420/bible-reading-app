export default async function handler(req, res) {
  const { book, chapter } = req.query;

  const bookNum = parseInt(book);
  const chapterNum = parseInt(chapter);

  if (!bookNum || !chapterNum || bookNum < 1 || bookNum > 66 || chapterNum < 1) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    // Primary source: HolyBible.or.kr (as requested by user)
    const verses = await fetchFromHolyBible(bookNum, chapterNum);
    
    if (verses && verses.length > 0) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json(verses);
    }

    // Fallback source: BSKorea.or.kr
    const fallbackVerses = await fetchFromBSKorea(bookNum, chapterNum);
    if (fallbackVerses && fallbackVerses.length > 0) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json(fallbackVerses);
    }

    return res.status(404).json({ error: '본문을 찾을 수 없습니다.' });
  } catch (err) {
    console.error('Bible fetch error:', err.message);
    return res.status(500).json({ error: '본문을 불러오지 못했습니다.' });
  }
}

async function fetchFromHolyBible(bookNum, chapterNum) {
  try {
    const url = `http://www.holybible.or.kr/B_GAE/cgi/bibleftxt.php?VR=GAE&VL=${bookNum}&CN=${chapterNum}&CV=99`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);

    const verses = [];
    // Site uses <ol> without </ol> in some cases, splitting by <ol
    const olParts = html.split(/<ol\s+/i);
    
    for (let i = 1; i < olParts.length; i++) {
      const part = olParts[i];
      const startMatch = part.match(/start=(\d+)/i);
      let verseNum = startMatch ? parseInt(startMatch[1]) : (verses.length + 1);
      
      const lis = part.split(/<li[^>]*>/i);
      for (let j = 1; j < lis.length; j++) {
        const li = lis[j];
        // Clean up text: remove tags, stop at next major block if any
        let text = li.split(/<(?:ol|table|tr|div)/i)[0]; 
        text = text.replace(/<[^>]+>/g, '').trim();
        text = decodeEntities(text);
        
        if (text.length > 0) {
          if (!verses.find(v => v.verse === verseNum)) {
            verses.push({ verse: verseNum, text });
          }
          verseNum++;
        }
      }
    }
    
    verses.sort((a, b) => a.verse - b.verse);
    return verses;
  } catch (e) {
    console.error('HolyBible fetch error:', e);
    return null;
  }
}

async function fetchFromBSKorea(bookNum, chapterNum) {
  try {
    const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?VER=GAE&Book=${bookNum}&Jang=${chapterNum}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    let html = decoder.decode(buffer);
    if (html.includes('charset=euc-kr') || html.includes('charset=EUC-KR')) {
      html = new TextDecoder('euc-kr').decode(buffer);
    }

    const verses = [];
    const regex = /<span class="number">(\d+)(&nbsp;|\s)*<\/span>([\s\S]*?)(?=<span class="number">|<br \/>|<\/div>|<\/span><\/span>|$)/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const num = parseInt(m[1]);
      let text = m[3].replace(/<[^>]+>/g, '').trim();
      text = decodeEntities(text);
      if (num && text && !verses.find(v => v.verse === num)) {
        verses.push({ verse: num, text });
      }
    }
    verses.sort((a, b) => a.verse - b.verse);
    return verses;
  } catch (e) {
    console.error('BSKorea fetch error:', e);
    return null;
  }
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
    .replace(/\(\s*\d+\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
