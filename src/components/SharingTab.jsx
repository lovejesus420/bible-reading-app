import { useState, useEffect } from 'react';
import {
  getUsers,
  getAllRecords,
  getMonthlyCount,
  formatMonthKorean,
  getUserColor,
  formatDate,
  getComments,
  addComment,
  addReply,
  editReply,
  toggleReaction,
} from '../utils/storage';

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const REACTIONS = ['❤️', '👍', '😢'];

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SharingTab({ user }) {
  const today = new Date();
  const todayStr = formatDate(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [comments, setComments] = useState(() => getComments(todayStr));
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    setComments(getComments(selectedDate));
    setReplyingTo(null);
    setEditingReply(null);
    setReplyText('');
    setEditText('');
  }, [selectedDate]);

  const allUsers = Object.keys(getUsers());
  const allRecords = getAllRecords();

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

  const makeDateStr = (d) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isSelected = (d) => makeDateStr(d) === selectedDate;

  const getStatusesForDay = (d) => {
    const dateStr = makeDateStr(d);
    const statuses = allUsers.map(u => ({
      name: u,
      read: !!(allRecords[u] && allRecords[u][dateStr] === true),
    }));
    return statuses.sort((a, b) => (b.read ? 1 : 0) - (a.read ? 1 : 0));
  };

  // Monthly stats for ALL registered users
  const monthlyCounts = allUsers.map(u => ({
    name: u,
    count: getMonthlyCount(u, viewYear, viewMonth),
  })).sort((a, b) => b.count - a.count);

  const handleSelectDate = (d) => {
    setSelectedDate(makeDateStr(d));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments(addComment(selectedDate, user, newComment));
    setNewComment('');
  };

  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;
    setComments(addReply(selectedDate, commentId, user, replyText));
    setReplyText('');
    setReplyingTo(null);
  };

  const handleSaveEdit = (commentId, replyId) => {
    if (!editText.trim()) return;
    setComments(editReply(selectedDate, commentId, replyId, editText));
    setEditingReply(null);
    setEditText('');
  };

  const handleReaction = (commentId, replyId, emoji) => {
    setComments(toggleReaction(selectedDate, commentId, replyId, emoji, user));
  };

  const startEdit = (commentId, replyId, currentText) => {
    setEditingReply({ commentId, replyId });
    setEditText(currentText);
    setReplyingTo(null);
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const selectedDateLabel = `${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일`;

  return (
    <div className="tab-content">
      <div className="page-header">
        <h2>나눔</h2>
        <p className="page-subtitle">함께 읽는 우리들의 기록</p>
      </div>

      {/* Calendar */}
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
            const statuses = getStatusesForDay(day);
            const visible = statuses.slice(0, 4);
            const overflow = statuses.length - visible.length;

            return (
              <div
                key={day}
                className={`cal-cell ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'cal-selected' : ''}`}
                onClick={() => handleSelectDate(day)}
              >
                <span className={`cal-day-num ${i % 7 === 0 ? 'sunday' : i % 7 === 6 ? 'saturday' : ''}`}>
                  {day}
                </span>
                <div className="cal-dots">
                  {visible.map(s => (
                    <span
                      key={s.name}
                      className={`cal-dot ${s.read ? '' : 'cal-dot-gray'}`}
                      style={s.read ? { backgroundColor: getUserColor(s.name) } : undefined}
                      title={s.name + (s.read ? '' : ' (미읽음)')}
                    >
                      {s.name[0]}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="cal-dot-more">+{overflow}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly stats */}
      <div className="stats-card">
        <h3 className="stats-title">{viewMonth + 1}월 읽기 현황</h3>
        {monthlyCounts.length === 0 ? (
          <p className="empty-msg">등록된 사용자가 없습니다</p>
        ) : (
          <div className="stats-list">
            {monthlyCounts.map(({ name, count }, idx) => (
              <div key={name} className="stats-row">
                <div className="stats-rank">{idx + 1}</div>
                <div className="stats-avatar" style={{ backgroundColor: getUserColor(name) }}>
                  {name[0]}
                </div>
                <div className="stats-name">
                  {name}
                  {name === user && <span className="me-badge">나</span>}
                </div>
                <div className="stats-bar-wrap">
                  <div
                    className="stats-bar"
                    style={{
                      width: `${Math.min((count / daysInMonth) * 100, 100)}%`,
                      backgroundColor: getUserColor(name),
                    }}
                  />
                </div>
                <div className="stats-count">{count}일</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="cmnt-card">
        <h3 className="cmnt-title">{selectedDateLabel} 댓글</h3>

        <div className="cmnt-input-row">
          <input
            className="cmnt-input"
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
          />
          <button className="cmnt-send-btn" onClick={handleAddComment}>전송</button>
        </div>

        {comments.length === 0 ? (
          <p className="cmnt-empty">첫 번째 댓글을 남겨보세요</p>
        ) : (
          <div className="cmnt-list">
            {comments.map(comment => (
              <div key={comment.id} className="cmnt-item">
                <div className="cmnt-header">
                  <span className="cmnt-avatar" style={{ backgroundColor: getUserColor(comment.author) }}>
                    {comment.author[0]}
                  </span>
                  <span className="cmnt-author">{comment.author}</span>
                  <span className="cmnt-time">{formatTime(comment.timestamp)}</span>
                </div>
                <p className="cmnt-text">{comment.text}</p>

                <button
                  className="reply-open-btn"
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyText('');
                    setEditingReply(null);
                  }}
                >
                  답글 달기
                </button>

                {replyingTo === comment.id && (
                  <div className="reply-input-row">
                    <input
                      className="reply-input"
                      placeholder="답글을 입력하세요"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      autoFocus
                    />
                    <button className="send-btn" onClick={() => handleAddReply(comment.id)}>전송</button>
                    <button className="cancel-btn" onClick={() => setReplyingTo(null)}>취소</button>
                  </div>
                )}

                {comment.replies.length > 0 && (
                  <div className="reply-list">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="reply-item">
                        <div className="cmnt-header">
                          <span className="cmnt-avatar small" style={{ backgroundColor: getUserColor(reply.author) }}>
                            {reply.author[0]}
                          </span>
                          <span className="cmnt-author">{reply.author}</span>
                          <span className="cmnt-time">
                            {formatTime(reply.timestamp)}{reply.edited ? ' (수정됨)' : ''}
                          </span>
                          {reply.author === user && !(editingReply?.replyId === reply.id) && (
                            <button
                              className="edit-btn"
                              onClick={() => startEdit(comment.id, reply.id, reply.text)}
                            >
                              수정
                            </button>
                          )}
                        </div>

                        {editingReply?.commentId === comment.id && editingReply?.replyId === reply.id ? (
                          <div className="reply-input-row">
                            <input
                              className="reply-input"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              autoFocus
                            />
                            <button className="send-btn" onClick={() => handleSaveEdit(comment.id, reply.id)}>저장</button>
                            <button className="cancel-btn" onClick={() => setEditingReply(null)}>취소</button>
                          </div>
                        ) : (
                          <p className="cmnt-text">{reply.text}</p>
                        )}

                        <div className="reaction-row">
                          {REACTIONS.map(emoji => {
                            const count = reply.reactions?.[emoji]?.length || 0;
                            const active = reply.reactions?.[emoji]?.includes(user);
                            return (
                              <button
                                key={emoji}
                                className={`reaction-btn ${active ? 'active' : ''}`}
                                onClick={() => handleReaction(comment.id, reply.id, emoji)}
                              >
                                {emoji}
                                {count > 0 && <span className="reaction-count">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
