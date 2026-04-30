import { useState, useEffect, useRef } from 'react';
import { parsePassage } from '../utils/passageParser';

function cleanVerse(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function BibleReader({ passage }) {
  const [chapters, setChapters] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef({});
  const tabsRef = useRef(null);

  useEffect(() => {
    const parsed = parsePassage(passage);
    setChapters(parsed);
    setCurrentIdx(0);
    setVerses([]);
  }, [passage]);

  useEffect(() => {
    if (!chapters.length) return;
    const { bookNum, chapter } = chapters[currentIdx];
    const key = `${bookNum}-${chapter}`;

    if (cache.current[key]) {
      setVerses(cache.current[key]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/bolls/get-text/KRV/${bookNum}/${chapter}/`)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then(data => {
        const cleaned = data.map(v => ({ verse: v.verse, text: cleanVerse(v.text) }));
        cache.current[key] = cleaned;
        setVerses(cleaned);
        setLoading(false);
      })
      .catch(() => {
        setError('본문을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
        setLoading(false);
      });
  }, [chapters, currentIdx]);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const active = tabsRef.current.querySelector('.ch-tab.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [currentIdx]);

  if (!chapters.length) return null;

  const current = chapters[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === chapters.length - 1;

  return (
    <div className="reader-wrap">
      {/* Chapter tabs */}
      <div className="ch-tabs" ref={tabsRef}>
        {chapters.map((c, i) => (
          <button
            key={i}
            className={`ch-tab ${i === currentIdx ? 'active' : ''}`}
            onClick={() => setCurrentIdx(i)}
          >
            {c.bookName} {c.chapter}장
          </button>
        ))}
      </div>

      {/* Chapter header */}
      <div className="ch-header">
        <button
          className="ch-nav-btn"
          disabled={isFirst}
          onClick={() => setCurrentIdx(i => i - 1)}
        >
          ‹
        </button>
        <span className="ch-title">
          {current.bookName} {current.chapter}장
        </span>
        <button
          className="ch-nav-btn"
          disabled={isLast}
          onClick={() => setCurrentIdx(i => i + 1)}
        >
          ›
        </button>
      </div>

      {/* Verse content */}
      <div className="verse-area">
        {loading && (
          <div className="reader-loading">
            <div className="spinner" />
            <span>본문 불러오는 중...</span>
          </div>
        )}
        {error && (
          <div className="reader-error">
            <p>{error}</p>
            <button onClick={() => {
              const { bookNum, chapter } = chapters[currentIdx];
              delete cache.current[`${bookNum}-${chapter}`];
              setCurrentIdx(idx => idx);
            }}>
              다시 시도
            </button>
          </div>
        )}
        {!loading && !error && verses.map(v => (
          <p key={v.verse} className="verse-line">
            <sup className="v-num">{v.verse}</sup>
            {v.text}
          </p>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="ch-bottom-nav">
        <button
          className="ch-nav-wide"
          disabled={isFirst}
          onClick={() => setCurrentIdx(i => i - 1)}
        >
          ← 이전 장
        </button>
        <span className="ch-progress">{currentIdx + 1} / {chapters.length}</span>
        <button
          className="ch-nav-wide"
          disabled={isLast}
          onClick={() => setCurrentIdx(i => i + 1)}
        >
          다음 장 →
        </button>
      </div>
    </div>
  );
}
