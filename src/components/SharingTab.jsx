import { useState } from 'react';
import {
  getAllUsersMonthlyCount,
  getUsersWhoReadOnDate,
  formatMonthKorean,
  getUserColor,
  formatDate,
} from '../utils/storage';

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function SharingTab({ user }) {
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

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const getUsersForDay = (d) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return getUsersWhoReadOnDate(dateStr);
  };

  const monthlyCounts = getAllUsersMonthlyCount(viewYear, viewMonth);
  const sortedUsers = Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="tab-content">
      <div className="page-header">
        <h2>나눔</h2>
        <p className="page-subtitle">함께 읽는 우리들의 기록</p>
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
            const readers = getUsersForDay(day);
            return (
              <div key={day} className={`cal-cell ${isToday(day) ? 'today' : ''}`}>
                <span className={`cal-day-num ${i % 7 === 0 ? 'sunday' : i % 7 === 6 ? 'saturday' : ''}`}>
                  {day}
                </span>
                <div className="cal-dots">
                  {readers.slice(0, 3).map(u => (
                    <span
                      key={u}
                      className="cal-dot"
                      style={{ backgroundColor: getUserColor(u) }}
                      title={u}
                    >
                      {u[0]}
                    </span>
                  ))}
                  {readers.length > 3 && (
                    <span className="cal-dot-more">+{readers.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stats-card">
        <h3 className="stats-title">
          {viewMonth + 1}월 읽기 현황
        </h3>
        {sortedUsers.length === 0 ? (
          <p className="empty-msg">아직 기록이 없습니다</p>
        ) : (
          <div className="stats-list">
            {sortedUsers.map(([username, count], idx) => (
              <div key={username} className="stats-row">
                <div className="stats-rank">{idx + 1}</div>
                <div
                  className="stats-avatar"
                  style={{ backgroundColor: getUserColor(username) }}
                >
                  {username[0]}
                </div>
                <div className="stats-name">
                  {username}
                  {username === user && <span className="me-badge">나</span>}
                </div>
                <div className="stats-bar-wrap">
                  <div
                    className="stats-bar"
                    style={{
                      width: `${Math.min((count / daysInMonth) * 100, 100)}%`,
                      backgroundColor: getUserColor(username),
                    }}
                  />
                </div>
                <div className="stats-count">{count}일</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
