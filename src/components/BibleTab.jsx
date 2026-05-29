import { useState, useEffect } from 'react';
import { getPassageForDate, getDayNumber } from '../data/readingPlan';
import { getReading, setReading, clearReading, formatDate, formatDateKorean, getTotalCount } from '../utils/storage';
import { notifyReading } from '../utils/push';
import BibleReader from './BibleReader';

export default function BibleTab({ user }) {
  const today = new Date();
  const dateStr = formatDate(today);
  const passageInfo = getPassageForDate(today);
  const dayNum = getDayNumber(today);

  const [readStatus, setReadStatus] = useState(() => getReading(user, dateStr));
  const [showReader, setShowReader] = useState(false);

  useEffect(() => {
    setReadStatus(getReading(user, dateStr));
  }, [user, dateStr]);

  const handleToggle = (value) => {
    if (readStatus === value) {
      clearReading(user, dateStr);
      setReadStatus(null);
    } else {
      setReading(user, dateStr, value);
      setReadStatus(value);
      if (value === true) notifyReading(user);
    }
  };

  const totalRead = getTotalCount(user);
  const progressPct = Math.min((dayNum / 200) * 100, 100);

  if (dayNum < 1) {
    return (
      <div className="tab-content">
        <div className="info-card centered" style={{ margin: '40px 16px' }}>
          <div className="big-icon">📖</div>
          <h3>성경통독이 곧 시작됩니다!</h3>
          <p>시작일: 2026년 5월 22일</p>
        </div>
      </div>
    );
  }

  if (dayNum > 200) {
    return (
      <div className="tab-content">
        <div className="info-card centered" style={{ margin: '40px 16px' }}>
          <div className="big-icon">🎉</div>
          <h3>성경통독 200일을 완료했습니다!</h3>
          <p>총 {totalRead}일 읽으셨습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="bible-header">
        <div className="bible-header-text">
          <p className="bible-date">{formatDateKorean(today)}</p>
          <h2 className="bible-day-title">{dayNum}일차</h2>
        </div>
        <div className="day-badge">{dayNum}<span>/200</span></div>
      </div>

      <div className="passage-card">
        <div className="passage-label">오늘의 본문</div>
        <div className="passage-text">{passageInfo?.passage}</div>
        <button
          className={`read-toggle-btn ${showReader ? 'open' : ''}`}
          onClick={() => setShowReader(v => !v)}
        >
          {showReader ? '본문 닫기 ▲' : '본문 읽기 ▼'}
        </button>
      </div>

      {showReader && passageInfo && (
        <div className="reader-card">
          <BibleReader passage={passageInfo.passage} />
        </div>
      )}

      <div className="reading-check-card">
        <p className="check-question">오늘 성경을 읽었나요?</p>
        <div className="check-buttons">
          <button
            className={`check-btn yes-btn ${readStatus === true ? 'active' : ''}`}
            onClick={() => handleToggle(true)}
          >
            <span className="check-icon">{readStatus === true ? '✓' : ''}</span>
            예
          </button>
          <button
            className={`check-btn no-btn ${readStatus === false ? 'active' : ''}`}
            onClick={() => handleToggle(false)}
          >
            <span className="check-icon">{readStatus === false ? '✗' : ''}</span>
            아니오
          </button>
        </div>
        {readStatus === true && (
          <p className="check-message positive">오늘도 말씀 잘 읽으셨군요! 😊</p>
        )}
        {readStatus === false && (
          <p className="check-message neutral">괜찮아요, 내일 또 도전해봐요 🙏</p>
        )}
      </div>

      <div className="progress-card">
        <div className="progress-header">
          <span>전체 진도</span>
          <span className="progress-count">{dayNum} / 200일</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="progress-footer">
          <span>내가 읽은 날: <strong>{totalRead}일</strong></span>
          <span>{Math.round(progressPct)}% 완료</span>
        </div>
      </div>
    </div>
  );
}
