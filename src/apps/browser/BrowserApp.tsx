'use client';

import React, { useState } from 'react';

interface BrowserAppProps {
  windowId: string;
}

export default function BrowserApp({ windowId }: BrowserAppProps) {
  const [url, setUrl] = useState('https://www.wikipedia.org');
  const [inputUrl, setInputUrl] = useState('https://www.wikipedia.org');
  const [history, setHistory] = useState<string[]>(['https://www.wikipedia.org']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks] = useState([
    { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
    { title: 'MDN Docs', url: 'https://developer.mozilla.org' },
    { title: 'GitHub', url: 'https://github.com' },
  ]);

  const navigate = (targetUrl: string) => {
    let normalized = targetUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      if (normalized.includes('.')) {
        normalized = 'https://' + normalized;
      } else {
        normalized = `https://www.google.com/search?igu=1&q=${encodeURIComponent(normalized)}`;
      }
    }
    setUrl(normalized);
    setInputUrl(normalized);
    setIsLoading(true);
    const newHistory = [...history.slice(0, historyIdx + 1), normalized];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setUrl(history[historyIdx - 1]);
      setInputUrl(history[historyIdx - 1]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setUrl(history[historyIdx + 1]);
      setInputUrl(history[historyIdx + 1]);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ fontSize: '13px' }}>
      {/* Navigation bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <button
          className="p-1.5 rounded hover:bg-white/10 transition-all text-sm"
          onClick={goBack}
          disabled={historyIdx <= 0}
          style={{ opacity: historyIdx <= 0 ? 0.3 : 1 }}
        >
          ◀
        </button>
        <button
          className="p-1.5 rounded hover:bg-white/10 transition-all text-sm"
          onClick={goForward}
          disabled={historyIdx >= history.length - 1}
          style={{ opacity: historyIdx >= history.length - 1 ? 0.3 : 1 }}
        >
          ▶
        </button>
        <button
          className="p-1.5 rounded hover:bg-white/10 transition-all text-sm"
          onClick={() => { setIsLoading(true); setUrl(url + ''); }}
        >
          🔄
        </button>

        {/* URL bar */}
        <form
          className="flex-1"
          onSubmit={(e) => { e.preventDefault(); navigate(inputUrl); }}
        >
          <input
            className="w-full text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter URL or search..."
          />
        </form>
      </div>

      {/* Bookmarks bar */}
      <div className="flex items-center gap-1 px-3 py-1 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {bookmarks.map((bm, i) => (
          <button
            key={i}
            className="text-[11px] px-2 py-0.5 rounded hover:bg-white/10 transition-all whitespace-nowrap"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => navigate(bm.url)}
          >
            🔖 {bm.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <iframe
          src={url}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setIsLoading(false)}
          title="Browser content"
        />
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--accent)' }}>
            <div className="h-full animate-pulse" style={{ background: 'var(--accent)', width: '60%' }} />
          </div>
        )}
      </div>
    </div>
  );
}
