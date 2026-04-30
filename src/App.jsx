import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import BibleTab from './components/BibleTab';
import SharingTab from './components/SharingTab';
import MyTab from './components/MyTab';
import { getCurrentUser } from './utils/storage';

const TABS = [
  { id: 0, label: '성경읽기', icon: '📖' },
  { id: 1, label: '나눔', icon: '🤝' },
  { id: 2, label: 'MY', icon: '👤' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) setUser(saved);
  }, []);

  if (!user) {
    return <Auth onLogin={(name) => { setUser(name); setActiveTab(0); }} />;
  }

  return (
    <div className="app">
      <div className="content">
        {activeTab === 0 && <BibleTab user={user} />}
        {activeTab === 1 && <SharingTab user={user} />}
        {activeTab === 2 && <MyTab user={user} onLogout={() => { setUser(null); setActiveTab(0); }} />}
      </div>

      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
