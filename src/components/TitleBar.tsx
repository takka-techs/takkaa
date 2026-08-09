import React, { useState } from 'react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const minimize = () => (window as any).electronAPI?.minimize();
  const maximize = () => {
    (window as any).electronAPI?.maximize();
    setIsMaximized(!isMaximized);
  };
  const close = () => (window as any).electronAPI?.close();

  return (
    <div
      className="h-8 flex items-center justify-between shrink-0 select-none bg-white dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      dir="ltr"
    >
      <span className="text-xs font-bold text-slate-400 px-4">Takka POS</span>
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={minimize}
          className="h-full px-4 flex items-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="5.5" width="10" height="1" rx="0.5"/>
          </svg>
        </button>
        <button
          onClick={maximize}
          className="h-full px-4 flex items-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="1" width="8" height="8" rx="0.5"/>
              <path d="M1 3v7.5A0.5 0.5 0 001.5 11H9"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="1" width="10" height="10" rx="0.5"/>
            </svg>
          )}
        </button>
        <button
          onClick={close}
          className="h-full px-4 flex items-center text-slate-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1L11 11M11 1L1 11"/>
          </svg>
        </button>
      </div>
    </div>
  );
}