'use client';

import React from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onDoubleClick: () => void;
  selected?: boolean;
}

export default function DesktopIcon({ icon, label, onDoubleClick, selected }: DesktopIconProps) {
  return (
    <div
      className={`desktop-icon ${selected ? 'selected' : ''}`}
      onDoubleClick={onDoubleClick}
    >
      <span className="text-3xl drop-shadow-lg">{icon}</span>
      <span
        className="text-[11px] font-medium leading-tight max-w-[72px] text-center"
        style={{
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
