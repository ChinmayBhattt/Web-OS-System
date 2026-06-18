'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as fs from '@/services/fileSystem';
import { useAuthStore } from '@/stores/authStore';

interface TerminalProps {
  windowId: string;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
}

export default function Terminal({ windowId }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: 'WebOS Terminal v1.0.0' },
    { type: 'system', content: 'Type "help" for available commands.\n' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home/user');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { username } = useAuthStore();

  useEffect(() => {
    fs.initializeFileSystem();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const addOutput = useCallback((content: string, type: TerminalLine['type'] = 'output') => {
    setLines(prev => [...prev, { type, content }]);
  }, []);

  const executeCommand = useCallback(async (cmd: string) => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    setLines(prev => [...prev, { type: 'input', content: `${username}@webos:${cwd}$ ${cmd}` }]);

    if (!command) return;

    try {
      switch (command) {
        case 'help':
          addOutput(`Available commands:
  ls          List directory contents
  cd <dir>    Change directory
  pwd         Print working directory
  mkdir <name> Create directory
  touch <name> Create empty file
  cat <file>  Display file contents
  echo <text> Display text or write to file
  rm <name>   Remove file or directory
  mv <src> <dst> Move/rename file
  clear       Clear terminal
  whoami      Display current user
  date        Display current date/time
  history     Show command history
  help        Show this help message`);
          break;

        case 'ls': {
          const dir = await fs.resolvePath(resolveCwdPath(args[0] || '.'));
          if (!dir || dir.type !== 'directory') {
            addOutput(`ls: cannot access '${args[0] || '.'}': No such directory`, 'error');
            break;
          }
          const children = await fs.getChildren(dir.id);
          if (children.length === 0) {
            addOutput('(empty directory)');
          } else {
            const out = children.map(c => {
              const prefix = c.type === 'directory' ? '📁 ' : '📄 ';
              return `${prefix}${c.name}`;
            }).join('\n');
            addOutput(out);
          }
          break;
        }

        case 'cd': {
          const target = args[0];
          if (!target || target === '~') {
            setCwd('/home/user');
            break;
          }
          if (target === '..') {
            const parts = cwd.split('/').filter(Boolean);
            parts.pop();
            const newPath = '/' + parts.join('/');
            setCwd(newPath || '/');
            break;
          }
          const path = resolveCwdPath(target);
          const dir = await fs.resolvePath(path);
          if (!dir || dir.type !== 'directory') {
            addOutput(`cd: no such directory: ${target}`, 'error');
            break;
          }
          setCwd(path);
          break;
        }

        case 'pwd':
          addOutput(cwd);
          break;

        case 'mkdir': {
          if (!args[0]) { addOutput('mkdir: missing operand', 'error'); break; }
          const parentDir = await fs.resolvePath(cwd);
          if (!parentDir) { addOutput('mkdir: current directory not found', 'error'); break; }
          await fs.createNode({ name: args[0], type: 'directory', parentId: parentDir.id, size: 0 });
          addOutput(`Created directory: ${args[0]}`);
          break;
        }

        case 'touch': {
          if (!args[0]) { addOutput('touch: missing operand', 'error'); break; }
          const parentDir = await fs.resolvePath(cwd);
          if (!parentDir) { addOutput('touch: current directory not found', 'error'); break; }
          await fs.createNode({ name: args[0], type: 'file', parentId: parentDir.id, content: '', mimeType: 'text/plain', size: 0 });
          addOutput(`Created file: ${args[0]}`);
          break;
        }

        case 'cat': {
          if (!args[0]) { addOutput('cat: missing operand', 'error'); break; }
          const file = await fs.resolvePath(resolveCwdPath(args[0]));
          if (!file) { addOutput(`cat: ${args[0]}: No such file`, 'error'); break; }
          if (file.type === 'directory') { addOutput(`cat: ${args[0]}: Is a directory`, 'error'); break; }
          addOutput(file.content || '(empty file)');
          break;
        }

        case 'echo': {
          const text = args.join(' ');
          // Support echo "text" > filename
          const redirectIdx = args.indexOf('>');
          if (redirectIdx !== -1) {
            const content = args.slice(0, redirectIdx).join(' ');
            const fileName = args[redirectIdx + 1];
            if (!fileName) { addOutput('echo: missing filename after >', 'error'); break; }
            const parentDir = await fs.resolvePath(cwd);
            if (!parentDir) break;
            const existing = await fs.resolvePath(resolveCwdPath(fileName));
            if (existing) {
              await fs.updateNode(existing.id, { content, size: content.length });
            } else {
              await fs.createNode({ name: fileName, type: 'file', parentId: parentDir.id, content, mimeType: 'text/plain', size: content.length });
            }
            addOutput(`Wrote to ${fileName}`);
          } else {
            addOutput(text);
          }
          break;
        }

        case 'rm': {
          if (!args[0]) { addOutput('rm: missing operand', 'error'); break; }
          const target = await fs.resolvePath(resolveCwdPath(args[0]));
          if (!target) { addOutput(`rm: ${args[0]}: No such file or directory`, 'error'); break; }
          await fs.deleteNode(target.id);
          addOutput(`Removed: ${args[0]}`);
          break;
        }

        case 'mv': {
          if (args.length < 2) { addOutput('mv: missing operand', 'error'); break; }
          const src = await fs.resolvePath(resolveCwdPath(args[0]));
          if (!src) { addOutput(`mv: ${args[0]}: No such file`, 'error'); break; }
          // If second arg looks like a name (no /), rename
          if (!args[1].includes('/')) {
            await fs.updateNode(src.id, { name: args[1] });
            addOutput(`Renamed ${args[0]} → ${args[1]}`);
          } else {
            const destDir = await fs.resolvePath(resolveCwdPath(args[1]));
            if (!destDir || destDir.type !== 'directory') { addOutput(`mv: ${args[1]}: Not a directory`, 'error'); break; }
            await fs.moveNode(src.id, destDir.id);
            addOutput(`Moved ${args[0]} → ${args[1]}`);
          }
          break;
        }

        case 'clear':
          setLines([]);
          break;

        case 'whoami':
          addOutput(username);
          break;

        case 'date':
          addOutput(new Date().toString());
          break;

        case 'history':
          addOutput(history.map((h, i) => `  ${i + 1}  ${h}`).join('\n'));
          break;

        case 'neofetch': {
          addOutput(`
  ╔══════════════════╗
  ║     WebOS 1.0    ║
  ╚══════════════════╝
  
  OS:       WebOS 1.0.0
  Host:     Browser
  Kernel:   Next.js 15
  Shell:    WebTerminal 1.0
  DE:       WebOS Desktop
  Theme:    Dark Mode
  User:     ${username}
  Terminal: WebOS Terminal
  CPU:      Virtual CPU
  Memory:   ${(performance as unknown as { memory?: { usedJSHeapSize: number } })?.memory
    ? Math.round(((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024)) + ' MB'
    : 'N/A'}
`);
          break;
        }

        default:
          addOutput(`${command}: command not found. Type "help" for available commands.`, 'error');
      }
    } catch (err) {
      addOutput(`Error: ${String(err)}`, 'error');
    }
  }, [cwd, history, username, addOutput]);

  function resolveCwdPath(target: string): string {
    if (target.startsWith('/')) return target;
    if (target === '.') return cwd;
    if (target === '..') {
      const parts = cwd.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    return cwd === '/' ? `/${target}` : `${cwd}/${target}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setLines(prev => [...prev, { type: 'input', content: `${username}@webos:${cwd}$ ` }]);
      return;
    }

    setHistory(prev => [...prev, input]);
    setHistoryIdx(-1);
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    }
  };

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'error': return '#ff6b6b';
      case 'system': return 'var(--accent)';
      case 'input': return '#69db7c';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <div
      className="terminal-container h-full flex flex-col"
      style={{ background: '#0d1117' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all" style={{ color: getLineColor(line.type) }}>
            {line.content}
          </div>
        ))}

        {/* Input line */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span style={{ color: '#69db7c' }}>{username}@webos</span>
          <span style={{ color: 'var(--text-tertiary)' }}>:</span>
          <span style={{ color: '#74c0fc' }}>{cwd}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>$ </span>
          <input
            ref={inputRef}
            className="terminal-input ml-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}
