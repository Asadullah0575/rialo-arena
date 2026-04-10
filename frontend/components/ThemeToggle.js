import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  return (
    <button onClick={toggle} style={{
      background: 'none',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '4px 12px',
      color: 'var(--text-muted)',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'color 0.2s',
    }}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
