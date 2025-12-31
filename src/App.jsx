import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, FileImage, FileVideo, PenTool, Check, Copy, RefreshCw, Trash2,
  Download, Wand2, HelpCircle, Moon, Sun, X, Loader2, AlertCircle,
  LayoutGrid, Maximize2, Info, Zap, ZapOff, Plus, Brain, ShieldCheck,
  ShieldAlert, AlertTriangle, Server, Sparkles, Scale, FileText, Shield,
  Bell, BellOff
} from 'lucide-react';

/**
 * Hacky MetaGen 3.7 - Adobe Stock Metadata Generator
 */

/* -------------------- CONSTANTS -------------------- */
const MAX_TITLE_LENGTH = 125;
const MIN_TITLE_LENGTH = 100;
const TARGET_KEYWORD_COUNT = 49;

/* -------------------- APP -------------------- */
const HackyMetaGenApp = () => {

  /* -------------------- STATE -------------------- */
  const [theme, setTheme] = useState(() => localStorage.getItem('hackymetagen_theme') || 'dark');
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [contentType, setContentType] = useState('image');
  const [viewMode, setViewMode] = useState('batch');


/* 🔔 Notification Sound */
const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
  const saved = localStorage.getItem('hackymetagen_notify');
  return saved !== null ? JSON.parse(saved) : true;
});
const hasNotifiedRef = useRef(false);


  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    localStorage.setItem('hackymetagen_theme', theme);
  }, [theme]);

  /* 🔔 SAVE NOTIFICATION PREF */
  useEffect(() => {
    localStorage.setItem('hackymetagen_notify', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  /* -------------------- COMPLETION LOGIC -------------------- */
  const completeFiles = files.filter(f => f.status === 'complete');
  const allFilesComplete = files.length > 0 && files.every(f => f.status === 'complete');

// 🔔 Play sound when all files complete (once)
useEffect(() => {
  if (!notificationsEnabled) return;

  if (allFilesComplete && !hasNotifiedRef.current) {
    hasNotifiedRef.current = true;

    const audio = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
    );
    audio.volume = 0.35;
    audio.play().catch(() => {});
  }

  if (!allFilesComplete) {
    hasNotifiedRef.current = false;
  }
}, [allFilesComplete, notificationsEnabled]);


  /* -------------------- UI HELPERS -------------------- */
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  /* -------------------- STAT CARD -------------------- */
  const StatCard = ({ icon, label, value, accent }) => {
    const accents = {
      blue: 'text-blue-400 bg-blue-500/10',
      green: 'text-green-400 bg-green-500/10',
      yellow: 'text-yellow-400 bg-yellow-500/10',
      orange: 'text-orange-400 bg-orange-500/10',
      red: 'text-red-400 bg-red-500/10',
    };

    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-slate-800/60 border-slate-700 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${accents[accent]}`}>
          {React.cloneElement(icon, { size: 14 })}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">{label}</span>
          <span className="text-lg font-semibold text-white">{value}</span>
        </div>
      </div>
    );
  };

  /* -------------------- RENDER -------------------- */
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* -------------------- HEADER -------------------- */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">

        <h1 className="font-bold text-lg">Hacky MetaGen</h1>

        <div className="flex items-center gap-2">

{/* 🔔 Notification Toggle */}
<button
  onClick={() => setNotificationsEnabled(prev => !prev)}
  className={`p-2 rounded-full transition-colors ${
    theme === 'dark'
      ? 'hover:bg-slate-800 text-slate-400'
      : 'hover:bg-slate-100 text-slate-600'
  }`}
  title={notificationsEnabled ? 'Notification sound ON' : 'Notification sound OFF'}
>
  {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
</button>

          {/* 🌙 THEME TOGGLE */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

        </div>
      </header>

      {/* -------------------- STATS -------------------- */}
      {files.length > 0 && (
        <div className="px-6 mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={files.length} accent="blue" icon={<FileText />} />
          <StatCard label="Completed" value={completeFiles.length} accent={allFilesComplete ? 'green' : 'blue'} icon={<Check />} />
          <StatCard label="Processing" value={files.filter(f => f.status === 'processing').length} accent="yellow" icon={<Zap />} />
          <StatCard label="Accepted" value={files.filter(f => f.status === 'complete' && f.metadata?.approval_status !== 'Rejected').length} accent="green" icon={<ShieldCheck />} />
          <StatCard label="Rejected" value={files.filter(f => f.status === 'complete' && f.metadata?.approval_status === 'Rejected').length} accent="orange" icon={<ShieldAlert />} />
          <StatCard label="Errors" value={files.filter(f => f.status === 'error').length} accent="red" icon={<AlertCircle />} />
        </div>
      )}

      {/* REST OF YOUR APP CONTINUES UNCHANGED */}
    </div>
  );
};

export default HackyMetaGenApp;
