import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={`relative inline-flex items-center h-7 w-13 shrink-0 rounded-full transition-colors duration-200
        ${isDark ? 'bg-steg-primary' : 'bg-gray-300'} ${className}`}
      style={{ width: '3.25rem' }}
    >
      <span
        className={`inline-flex items-center justify-center h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200
          ${isDark ? 'translate-x-7' : 'translate-x-1'}`}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-steg-primary" fill="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-yellow-500" fill="currentColor">
            <circle cx="12" cy="12" r="4" />
            <path strokeWidth="2" stroke="currentColor" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 6.34l1.41-1.41" />
          </svg>
        )}
      </span>
    </button>
  );
}
