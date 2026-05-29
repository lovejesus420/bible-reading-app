import { dbSet } from './db';

const USERS_KEY = 'bible_users';
const RECORDS_KEY = 'bible_records';
const CURRENT_USER_KEY = 'bible_current_user';
const COMMENTS_KEY = 'bible_comments';

// ── Total reset: Wipe all progress and start fresh from May 30 ──
const RESET_FLAG = 'bible_hard_reset_final_v3';

export function resetData() {
  if (localStorage.getItem(RESET_FLAG)) return;
  
  // Wipe everything!
  localStorage.clear();
  
  // Wipe Firebase records and comments as well
  dbSet('records', null);
  dbSet('comments', null);
  dbSet('lastRead', null);
  
  localStorage.setItem(RESET_FLAG, '1');
  console.log('Bible App: Hard reset executed for May 30th');
}

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
}

export function userExists(name) {
  return !!getUsers()[name];
}

export function registerUser(name, password) {
  const users = getUsers();
  users[name] = { password };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  dbSet(`users/${name}`, true);
}

export function validateLogin(name, password) {
  const users = getUsers();
  return users[name] && users[name].password === password;
}

export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUser(name) {
  localStorage.setItem(CURRENT_USER_KEY, name);
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getAllRecords() {
  return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}');
}

export function getRecords(username) {
  return getAllRecords()[username] || {};
}

export function getReading(username, dateStr) {
  const records = getRecords(username);
  if (dateStr in records) return records[dateStr];
  return null;
}

export function setReading(username, dateStr, value) {
  const all = getAllRecords();
  if (!all[username]) all[username] = {};
  all[username][dateStr] = value;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
  dbSet(`records/${username}/${dateStr}`, value);
  if (value === true) dbSet(`lastRead/${username}`, Date.now());
}

export function clearReading(username, dateStr) {
  const all = getAllRecords();
  if (all[username]) delete all[username][dateStr];
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
  dbSet(`records/${username}/${dateStr}`, null);
}

export function getMonthlyCount(username, year, month) {
  const records = getRecords(username);
  return Object.entries(records).filter(([dateStr, value]) => {
    if (!value) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export function getTotalCount(username) {
  const records = getRecords(username);
  return Object.values(records).filter(Boolean).length;
}

export function getAllUsersMonthlyCount(year, month) {
  const all = getAllRecords();
  const result = {};
  Object.keys(all).forEach(username => {
    result[username] = getMonthlyCount(username, year, month);
  });
  return result;
}

export function getUsersWhoReadOnDate(dateStr) {
  const all = getAllRecords();
  return Object.keys(all).filter(u => all[u][dateStr] === true);
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DOW_KR = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDateKorean(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DOW_KR[date.getDay()]})`;
}

export function formatMonthKorean(year, month) {
  return `${year}년 ${month + 1}월`;
}

const USER_COLORS = [
  '#4f46e5', '#7c3aed', '#2563eb', '#059669',
  '#d97706', '#dc2626', '#db2777', '#0891b2',
  '#9333ea', '#ea580c',
];

export function getUserColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// ── Comments ──
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getComments(dateStr) {
  const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  return all[dateStr] || [];
}

function saveComments(all, dateStr) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  dbSet(`comments/${dateStr}`, all[dateStr] || []);
  return [...(all[dateStr] || [])];
}

export function addComment(dateStr, author, text) {
  const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  if (!all[dateStr]) all[dateStr] = [];
  all[dateStr].push({ id: uid(), author, text: text.trim(), timestamp: Date.now(), replies: [] });
  return saveComments(all, dateStr);
}

export function addReply(dateStr, commentId, author, text) {
  const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  const c = (all[dateStr] || []).find(c => c.id === commentId);
  if (!c) return getComments(dateStr);
  c.replies.push({
    id: uid(), author, text: text.trim(), timestamp: Date.now(),
    edited: false, reactions: { '❤️': [], '👍': [], '😢': [] },
  });
  return saveComments(all, dateStr);
}

export function editReply(dateStr, commentId, replyId, newText) {
  const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  const c = (all[dateStr] || []).find(c => c.id === commentId);
  if (!c) return getComments(dateStr);
  const r = c.replies.find(r => r.id === replyId);
  if (r) { r.text = newText.trim(); r.edited = true; }
  return saveComments(all, dateStr);
}

export function toggleReaction(dateStr, commentId, replyId, emoji, username) {
  const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  const c = (all[dateStr] || []).find(c => c.id === commentId);
  if (!c) return getComments(dateStr);
  const r = c.replies.find(r => r.id === replyId);
  if (!r) return getComments(dateStr);
  if (!r.reactions[emoji]) r.reactions[emoji] = [];
  const idx = r.reactions[emoji].indexOf(username);
  if (idx >= 0) r.reactions[emoji].splice(idx, 1);
  else r.reactions[emoji].push(username);
  return saveComments(all, dateStr);
}
