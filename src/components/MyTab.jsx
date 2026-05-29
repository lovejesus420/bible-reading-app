import { useState } from 'react';
import {
  getMonthlyCount,
  getTotalCount,
  getRecords,
  formatDate,
  formatMonthKorean,
  getUserColor,
  logout,
  clearAllData,
} from '../utils/storage';
import { getDayNumber, PLAN_START } from '../data/readingPlan';

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function MyTab({ user, onLogout }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthlyCount = getMonthlyCount(user, viewYear, viewMonth);
  const totalCount = getTotalCount(user);
  const records = getRecords(user);
  const userColor = getUserColor(user);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const getStatus = (d) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return records[dateStr];
  };

  const dayNum = getDayNumber(today);
  const progressPct = Math.min((dayNum / 200) * 100, 100);

  const handleReset = () => {
    const confirmed = window.confirm('모든 기록을 초기화하고 처음부터 시작하시겠습니까?');
    if (!confirmed) return;
    clearAllData();
    logout();
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="tab-content">
      <div className="my-header-card" style={{ background: `linear-gradient(135deg, ${userColor}, ${userColor}cc)` }}>
        <div className="my-avatar">{user[0]}</div>
        <div className="my-info">
          <h2 className="my-name">{user}</h2>
          <p className="my-subtitle">성경통독 200일 챌린지</p>
        </div>
      </div>

      <div className="my-stats-row">
        <div className="my-stat-card">
          <div className="my-stat-num" style={{ color: userColor }}>{totalCount}</div>
          <div className="my-stat-label">전체 읽은 날</div>
        </div>
        <div className="my-stat-card">
          <div className="my-stat-num" style={{ color: userColor }}>{monthlyCount}</div>
          <div className="my-stat-label">{viewMonth + 1}월 읽은 날</div>
        </div>
        <div className="my-stat-card">
          <div className="my-stat-num" style={{ color: userColor }}>{Math.round(progressPct)}%</div>
          <div className="my-stat-label">전체 진도</div>
        </div>
      </div>

      <div className="calendar-card">
        <div className="month-nav">
          <button className="nav-arrow" onClick={goPrev}>‹</button>
          <span className="month-label">{formatMonthKorean(viewYear, viewMonth)}</span>
          <button className="nav-arrow" onClick={goNext}>›</button>
        </div>

        <div className="calendar-grid">
          {DOW_LABELS.map((d, i) => (
            <div key={d} className={`cal-dow ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="cal-cell empty" />;
            const status = getStatus(day);
            return (
              <div
                key={day}
                className={`cal-cell my-cell ${isToday(day) ? 'today' : ''} ${status === true ? 'read-yes' : status === false ? 'read-no' : ''}`}
                style={status === true ? { backgroundColor: `${userColor}22`, borderColor: userColor } : {}}
              >
                <span className={`cal-day-num ${i % 7 === 0 ? 'sunday' : i % 7 === 6 ? 'saturday' : ''}`}>
                  {day}
                </span>
                {status === true && <span className="my-check" style={{ color: userColor }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      <button className="reset-btn" onClick={handleReset}>
        전체 기록 초기화
      </button>
      <button className="logout-btn" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
