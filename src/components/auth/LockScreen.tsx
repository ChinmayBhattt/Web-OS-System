'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

export default function LockScreen() {
  const { isAuthenticated, isLocked, login, unlock, username } = useAuthStore();
  const { wallpaper } = useThemeStore();
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('User');
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      const success = login(inputUsername, password);
      if (!success) {
        setError('Incorrect password. Try "password" or leave empty.');
        setPassword('');
      }
    } else {
      const success = unlock(password);
      if (!success) {
        setError('Incorrect password. Try "password" or leave empty.');
        setPassword('');
      }
    }
  };

  const shouldShow = !isAuthenticated || isLocked;
  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(40px) brightness(0.5)',
          WebkitBackdropFilter: 'blur(40px) brightness(0.5)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Clock */}
        {!showLogin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 cursor-pointer"
            onClick={() => setShowLogin(true)}
          >
            <div className="text-7xl font-light text-white tracking-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              {time}
            </div>
            <div className="text-lg text-white/70 mt-2 font-light">
              {date}
            </div>
            <div className="text-sm text-white/40 mt-6 animate-pulse">
              Click to sign in
            </div>
          </motion.div>
        )}

        {/* Login Form */}
        <AnimatePresence>
          {showLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-semibold shadow-2xl"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {(isAuthenticated ? username : inputUsername).charAt(0).toUpperCase()}
              </div>

              {/* Username display or input */}
              {isAuthenticated ? (
                <div className="text-lg font-semibold text-white">{username}</div>
              ) : (
                <input
                  type="text"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  placeholder="Username"
                  className="w-64 px-4 py-2.5 rounded-lg text-sm text-white text-center font-medium outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                  }}
                />
              )}

              {/* Password */}
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (leave empty or try 'password')"
                  autoFocus
                  className="w-64 px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <button
                  type="submit"
                  className="w-64 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: 'var(--accent)' }}
                >
                  {isAuthenticated ? 'Unlock' : 'Sign In'}
                </button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-400 max-w-[260px] text-center"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
