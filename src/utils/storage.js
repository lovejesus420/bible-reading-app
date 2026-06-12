import { dbSet } from './db';

const USERS_KEY = 'bible_users';
const CURRENT_USER_KEY = 'bible_current_user';
const RECORDS_PREFIX = 'bible_records_';
const COMMENTS_PREFIX = 'bible_comments_';

// ── NUCLEAR RESET: Wipe ALL data including users ──
const RESET_FLAG = 'bible_nuclear_reset_v2';

export async function resetData() {
  if (localStorage.getItem(RESET_FLAG)) return;

  console.log('Bible App: NUCLEAR RESET STARTING...');

  // Wipe Firebase completely (major nodes)
  try {
    await Promise.all([
      dbSet('records', null),
      dbSet('comments', null),
      dbSet('lastRead', null),
      dbSet('subscriptions', null),
    ]);
  } catch (e) {
    console.error('Firebase wipe failed:', e);
  }

  // Wipe local
  localStorage.clear();
  localStorage.setItem(RESET_FLAG, '1');

  console.log('Bible App: NUCLEAR RESET COMPLETE. Reloading...');
  window.location.reload();
}

export function clearAllData() {
  localStorage.setItem(RESET_FLAG, '1');
  dbSet('users', null);
  dbSet('records', null);
  dbSet('comments', null);
  dbSet('lastRead', null);
  localStorage.clear();
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
  dbSet(`users/${name}`, { password });
}

export async function syncUsers() {
  const { dbGet } = await import('./db');
  const fbUsers = await dbGet('users');
  if (fbUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(fbUsers));
  }
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
  const all = {};
  const users = Object.keys(getUsers());
  users.forEach(u => {
    all[u] = getRecords(u);
  });
  return all;
}

export function getRecords(username) {
  return JSON.parse(localStorage.getItem(RECORDS_PREFIX + username) || '{}');
}

export function getReading(username, dateStr) {
  const records = getRecords(username);
  return records[dateStr] || null;
}

export function setReading(username, dateStr, value) {
  const records = getRecords(username);
  records[dateStr] = value;
  localStorage.setItem(RECORDS_PREFIX + username, JSON.stringify(records));
  dbSet(`records/${username}/${dateStr}`, value);
  if (value === true) dbSet(`lastRead/${username}`, Date.now());
}

export function clearReading(username, dateStr) {
  const records = getRecords(username);
  delete records[dateStr];
  localStorage.setItem(RECORDS_PREFIX + username, JSON.stringify(records));
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
  if (!username) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getComments(dateStr) {
  return JSON.parse(localStorage.getItem(COMMENTS_PREFIX + dateStr) || '[]');
}

function saveComments(dateStr, comments) {
  localStorage.setItem(COMMENTS_PREFIX + dateStr, JSON.stringify(comments));
  dbSet(`comments/${dateStr}`, comments);
  return comments;
}

export function addComment(dateStr, author, text) {
  const comments = getComments(dateStr);
  comments.push({ id: uid(), author, text: text.trim(), timestamp: Date.now(), replies: [] });
  return saveComments(dateStr, comments);
}

export function addReply(dateStr, commentId, author, text) {
  const comments = getComments(dateStr);
  const c = comments.find(c => c.id === commentId);
  if (!c) return comments;
  c.replies.push({
    id: uid(), author, text: text.trim(), timestamp: Date.now(),
    edited: false, reactions: { '❤️': [], '👍': [], '😢': [] },
  });
  return saveComments(dateStr, comments);
}

export function editReply(dateStr, commentId, replyId, newText) {
  const comments = getComments(dateStr);
  const c = comments.find(c => c.id === commentId);
  if (!c) return comments;
  const r = c.replies.find(r => r.id === replyId);
  if (r) { r.text = newText.trim(); r.edited = true; }
  return saveComments(dateStr, comments);
}

export function toggleReaction(dateStr, commentId, replyId, emoji, username) {
  const comments = getComments(dateStr);
  const c = comments.find(c => c.id === commentId);
  if (!c) return comments;
  const r = c.replies.find(r => r.id === replyId);
  if (!r) return comments;
  if (!r.reactions[emoji]) r.reactions[emoji] = [];
  const idx = r.reactions[emoji].indexOf(username);
  if (idx >= 0) r.reactions[emoji].splice(idx, 1);
  else r.reactions[emoji].push(username);
  return saveComments(dateStr, comments);
}
