'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FSNode } from '@/types/fileSystem';
import * as fs from '@/services/fileSystem';
import { useWindowStore } from '@/stores/windowStore';

interface FileExplorerProps {
  windowId: string;
}

export default function FileExplorer({ windowId }: FileExplorerProps) {
  const [currentDirId, setCurrentDirId] = useState<string>('root');
  const [items, setItems] = useState<FSNode[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { setWindowTitle, openWindow } = useWindowStore();

  const loadDirectory = useCallback(async (dirId: string) => {
    const children = await fs.getChildren(dirId);
    const sorted = children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    setItems(sorted);
    setSelectedItem(null);

    // Build breadcrumb
    const crumbs: { id: string; name: string }[] = [];
    let current = await fs.getNode(dirId);
    while (current) {
      crumbs.unshift({ id: current.id, name: current.name === '/' ? 'Root' : current.name });
      if (current.parentId) {
        current = await fs.getNode(current.parentId);
      } else {
        break;
      }
    }
    setBreadcrumb(crumbs);
    setWindowTitle(windowId, `Files — ${crumbs[crumbs.length - 1]?.name || 'Root'}`);
  }, [windowId, setWindowTitle]);

  useEffect(() => {
    const init = async () => {
      await fs.initializeFileSystem();
      // Navigate to /home/user
      const userDir = await fs.resolvePath('/home/user');
      if (userDir) {
        setCurrentDirId(userDir.id);
        loadDirectory(userDir.id);
      } else {
        loadDirectory('root');
      }
    };
    init();
  }, [loadDirectory]);

  const navigateTo = (dirId: string) => {
    setCurrentDirId(dirId);
    loadDirectory(dirId);
  };

  const handleDoubleClick = (item: FSNode) => {
    if (item.type === 'directory') {
      navigateTo(item.id);
    } else {
      // Open file in text editor
      openWindow('text-editor', { title: `Editor — ${item.name}`, openFilePath: item.id });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await fs.createNode({
      name: newFolderName.trim(),
      type: 'directory',
      parentId: currentDirId,
      size: 0,
    });
    setNewFolderName('');
    setShowNewFolder(false);
    loadDirectory(currentDirId);
  };

  const handleCreateFile = async () => {
    await fs.createNode({
      name: 'Untitled.txt',
      type: 'file',
      parentId: currentDirId,
      content: '',
      mimeType: 'text/plain',
      size: 0,
    });
    loadDirectory(currentDirId);
  };

  const handleDelete = async (id: string) => {
    await fs.deleteNode(id);
    loadDirectory(currentDirId);
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await fs.updateNode(id, { name: renameValue.trim() });
    setRenamingId(null);
    loadDirectory(currentDirId);
  };

  const goUp = () => {
    if (breadcrumb.length > 1) {
      navigateTo(breadcrumb[breadcrumb.length - 2].id);
    }
  };

  const getFileIcon = (item: FSNode): string => {
    if (item.type === 'directory') {
      const folderIcons: Record<string, string> = {
        Desktop: '🖥️', Documents: '📄', Downloads: '⬇️',
        Pictures: '🖼️', Music: '🎵', Videos: '🎬',
        home: '🏠', user: '👤',
      };
      return folderIcons[item.name] || '📁';
    }
    const ext = item.name.split('.').pop()?.toLowerCase();
    const extIcons: Record<string, string> = {
      txt: '📝', md: '📋', js: '🟨', ts: '🔷', jsx: '⚛️', tsx: '⚛️',
      html: '🌐', css: '🎨', json: '📦', py: '🐍', jpg: '🖼️',
      png: '🖼️', gif: '🖼️', mp3: '🎵', mp4: '🎬', pdf: '📕',
    };
    return extIcons[ext || ''] || '📄';
  };

  return (
    <div className="flex h-full" style={{ fontSize: '13px' }}>
      {/* Sidebar */}
      <div className="w-48 border-r flex-shrink-0 py-2 overflow-y-auto" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="px-3 py-1 text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Quick Access
        </div>
        {['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music'].map(folder => (
          <button
            key={folder}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-all text-left"
            style={{ color: 'var(--text-secondary)' }}
            onClick={async () => {
              const node = await fs.resolvePath(`/home/user/${folder}`);
              if (node) navigateTo(node.id);
            }}
          >
            <span className="text-sm">{
              { Desktop: '🖥️', Documents: '📄', Downloads: '⬇️', Pictures: '🖼️', Music: '🎵' }[folder]
            }</span>
            <span className="text-xs">{folder}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
          <button
            className="p-1.5 rounded hover:bg-white/10 transition-all text-sm"
            onClick={goUp}
            disabled={breadcrumb.length <= 1}
            style={{ opacity: breadcrumb.length <= 1 ? 0.3 : 1 }}
          >
            ⬆️
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 transition-all text-sm" onClick={() => loadDirectory(currentDirId)}>
            🔄
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-0">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={crumb.id}>
                {i > 0 && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/</span>}
                <button
                  className="text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-all whitespace-nowrap"
                  style={{ color: i === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  onClick={() => navigateTo(crumb.id)}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Actions */}
          <button className="p-1.5 rounded hover:bg-white/10 transition-all text-sm" onClick={handleCreateFile} title="New File">
            📄+
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 transition-all text-sm" onClick={() => setShowNewFolder(true)} title="New Folder">
            📁+
          </button>
          <button
            className="p-1.5 rounded hover:bg-white/10 transition-all text-sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title="Toggle view"
          >
            {viewMode === 'grid' ? '☰' : '⊞'}
          </button>
        </div>

        {/* New folder input */}
        {showNewFolder && (
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm">📁</span>
            <input
              autoFocus
              className="flex-1 text-xs px-2 py-1 rounded outline-none"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--accent)' }}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolder(false);
              }}
              placeholder="Folder name"
            />
            <button className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent)', color: 'white' }} onClick={handleCreateFolder}>
              Create
            </button>
            <button className="text-xs px-2 py-1" onClick={() => setShowNewFolder(false)}>Cancel</button>
          </div>
        )}

        {/* File listing */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
              <span className="text-4xl">📂</span>
              <span className="text-xs">This folder is empty</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
              {items.map(item => (
                <div
                  key={item.id}
                  className={`desktop-icon ${selectedItem === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(item.id)}
                  onDoubleClick={() => handleDoubleClick(item)}
                >
                  <span className="text-3xl">{getFileIcon(item)}</span>
                  {renamingId === item.id ? (
                    <input
                      autoFocus
                      className="text-[11px] text-center w-full px-1 rounded outline-none"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--accent)' }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(item.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => handleRename(item.id)}
                    />
                  ) : (
                    <span className="text-[11px] leading-tight" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    selectedItem === item.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedItem(item.id)}
                  onDoubleClick={() => handleDoubleClick(item)}
                >
                  <span className="text-lg">{getFileIcon(item)}</span>
                  <span className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {item.type === 'file' ? `${item.size} B` : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(item.modifiedAt).toLocaleDateString()}
                  </span>
                  <button
                    className="text-xs opacity-30 hover:opacity-100 p-1"
                    onClick={(e) => { e.stopPropagation(); setRenamingId(item.id); setRenameValue(item.name); }}
                    title="Rename"
                  >✏️</button>
                  <button
                    className="text-xs opacity-30 hover:opacity-100 p-1 hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    title="Delete"
                  >🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          {selectedItem && (
            <div className="flex items-center gap-2">
              <button className="text-[10px] px-2 py-0.5 rounded hover:bg-white/10" style={{ color: 'var(--text-secondary)' }}
                onClick={() => { setRenamingId(selectedItem); const item = items.find(i => i.id === selectedItem); setRenameValue(item?.name || ''); }}>
                Rename
              </button>
              <button className="text-[10px] px-2 py-0.5 rounded hover:bg-red-500/20 text-red-400"
                onClick={() => handleDelete(selectedItem)}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
