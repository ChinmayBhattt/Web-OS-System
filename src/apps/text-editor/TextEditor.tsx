'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as fs from '@/services/fileSystem';
import { useWindowStore } from '@/stores/windowStore';

interface TextEditorProps {
  windowId: string;
}

export default function TextEditor({ windowId }: TextEditorProps) {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('Untitled');
  const [fileId, setFileId] = useState<string | null>(null);
  const [modified, setModified] = useState(false);
  const [language, setLanguage] = useState('text');
  const [lineCount, setLineCount] = useState(1);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const { setWindowTitle } = useWindowStore();

  // Load file if opened from file explorer
  useEffect(() => {
    const win = useWindowStore.getState().windows.find(w => w.id === windowId);
    if (win?.openFilePath) {
      loadFile(win.openFilePath);
    }
  }, [windowId]);

  const loadFile = useCallback(async (id: string) => {
    const node = await fs.getNode(id);
    if (node && node.type === 'file') {
      setContent(node.content || '');
      setFileName(node.name);
      setFileId(node.id);
      setModified(false);
      setWindowTitle(windowId, `Editor — ${node.name}`);

      // Detect language from extension
      const ext = node.name.split('.').pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
        html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown',
        py: 'Python', txt: 'Text',
      };
      setLanguage(langMap[ext || ''] || 'Text');
    }
  }, [windowId, setWindowTitle]);

  const handleSave = useCallback(async () => {
    if (fileId) {
      await fs.updateNode(fileId, { content, size: content.length, modifiedAt: Date.now() });
      setModified(false);
    } else {
      // Create new file in Documents
      const docsDir = await fs.resolvePath('/home/user/Documents');
      if (docsDir) {
        const newFile = await fs.createNode({
          name: fileName.endsWith('.txt') ? fileName : `${fileName}.txt`,
          type: 'file',
          parentId: docsDir.id,
          content,
          mimeType: 'text/plain',
          size: content.length,
        });
        setFileId(newFile.id);
        setModified(false);
      }
    }
  }, [fileId, content, fileName]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setModified(true);
    setLineCount(newContent.split('\n').length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      handleContentChange(newContent);
      // Restore cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }

    // Save shortcut
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    }
  };

  const handleSelect = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLTextAreaElement;
    const pos = target.selectionStart;
    const lines = content.substring(0, pos).split('\n');
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  return (
    <div className="h-full flex flex-col" style={{ fontSize: '13px' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {fileName}{modified ? ' •' : ''}
        </span>
        <div className="flex-1" />
        <button
          className="text-[11px] px-2 py-1 rounded hover:bg-white/10 transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onClick={handleSave}
        >
          💾 Save
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          className="py-2 px-2 text-right select-none overflow-hidden flex-shrink-0"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontSize: '12px', lineHeight: '1.5', width: '48px' }}
        >
          {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
            <div key={i + 1} className={i + 1 === cursorPos.line ? 'font-semibold' : ''} style={{ color: i + 1 === cursorPos.line ? 'var(--text-primary)' : undefined }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text area */}
        <textarea
          className="flex-1 py-2 px-3 resize-none outline-none leading-[1.5]"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
            fontSize: '12px',
            tabSize: 2,
          }}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          spellCheck={false}
          autoComplete="off"
          wrap="off"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
        <div className="flex items-center gap-3">
          <span>{language}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{content.length} chars</span>
          <span>{lineCount} lines</span>
        </div>
      </div>
    </div>
  );
}
