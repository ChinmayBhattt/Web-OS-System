'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface NotesProps {
  windowId: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
}

const NOTES_STORAGE_KEY = 'webos-notes';

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(NOTES_STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  const defaultNote: Note = {
    id: uuidv4(),
    title: 'Welcome to Notes',
    content: 'Start typing here to create your note.\n\nFeatures:\n• Create and organize notes\n• Auto-save\n• Rich formatting (bold with **text**, italic with *text*)',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  };
  return [defaultNote];
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export default function Notes({ windowId }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    if (loaded.length > 0) setActiveNote(loaded[0].id);
  }, []);

  useEffect(() => {
    if (notes.length > 0) saveNotes(notes);
  }, [notes]);

  const currentNote = notes.find(n => n.id === activeNote);

  const handleCreateNote = useCallback(() => {
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNote(newNote.id);
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (activeNote === id) {
        setActiveNote(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  }, [activeNote]);

  const handleUpdateContent = useCallback((content: string) => {
    setNotes(prev => prev.map(n =>
      n.id === activeNote
        ? {
            ...n,
            content,
            title: content.split('\n')[0]?.slice(0, 50) || 'Untitled Note',
            modifiedAt: Date.now(),
          }
        : n
    ));
  }, [activeNote]);

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full" style={{ fontSize: '13px' }}>
      {/* Sidebar */}
      <div className="w-56 border-r flex-shrink-0 flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        {/* Search & New */}
        <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <input
            placeholder="Search notes..."
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-sm flex-shrink-0"
            onClick={handleCreateNote}
            title="New note"
          >
            ✏️
          </button>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`px-3 py-2 cursor-pointer transition-all border-l-2 ${
                activeNote === note.id ? '' : 'border-transparent hover:bg-white/5'
              }`}
              style={{
                background: activeNote === note.id ? 'var(--accent-muted)' : undefined,
                borderLeftColor: activeNote === note.id ? 'var(--accent)' : 'transparent',
              }}
              onClick={() => setActiveNote(note.id)}
            >
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {note.title}
              </div>
              <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                {new Date(note.modifiedAt).toLocaleDateString()} · {note.content.slice(0, 40)}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No notes found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {currentNote ? (
          <>
            {/* Note header */}
            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{currentNote.title}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  Modified {new Date(currentNote.modifiedAt).toLocaleString()}
                </div>
              </div>
              <button
                className="text-xs p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all"
                onClick={() => handleDeleteNote(currentNote.id)}
                title="Delete note"
              >
                🗑️
              </button>
            </div>

            {/* Text area */}
            <textarea
              className="flex-1 w-full p-4 resize-none outline-none text-sm leading-relaxed"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
              value={currentNote.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              placeholder="Start typing..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 opacity-40">
            <span className="text-4xl">📝</span>
            <span className="text-sm">Select or create a note</span>
          </div>
        )}
      </div>
    </div>
  );
}
