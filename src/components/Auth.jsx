import { useState } from 'react';
import { registerUser, userExists, validateLogin, setCurrentUser } from '../utils/storage';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('이름을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    if (mode === 'register') {
      if (password !== confirmPassword) return setError('비밀번호가 일치하지 않습니다.');
      if (password.length < 4) return setError('비밀번호는 4자 이상이어야 합니다.');
      if (userExists(name.trim())) return setError('이미 존재하는 이름입니다.');
      registerUser(name.trim(), password);
      setCurrentUser(name.trim());
      onLogin(name.trim());
    } else {
      if (!validateLogin(name.trim(), password)) return setError('이름 또는 비밀번호가 올바르지 않습니다.');
      setCurrentUser(name.trim());
      onLogin(name.trim());
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-icon">✝</div>
        <h1 className="auth-title">김앤장 성경통독</h1>
        <p className="auth-subtitle">200일 완독 챌린지</p>
        <p className="auth-period">2026.06.13 ~ 2026.12.29</p>
        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px' }}>v1.1.0-RESTARTED</div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>비밀번호 확인</label>
              <input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit">
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}
