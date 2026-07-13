import React, { useCallback, useEffect, useState } from 'react';
import { 
  ShieldAlert, Settings, Sun, Moon, Key, Check, AlertCircle, 
  Terminal, User, CheckCircle, Smartphone, Zap
} from 'lucide-react';
import ControlRoom from './components/ControlRoom';
import FanApp from './components/FanApp';
import VolunteerApp from './components/VolunteerApp';

const TABS = [
  { id: 'control-room', label: 'Control Room', sublabel: 'OPS', accent: 'blue', icon: Terminal },
  { id: 'fan-app', label: 'Fan Companion', sublabel: 'PWA', accent: 'emerald', icon: User },
  { id: 'volunteer-app', label: 'Volunteer Bridge', sublabel: 'FIELD', accent: 'violet', icon: Smartphone },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('control-room');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempKey, setTempKey] = useState('');
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('api_url') || import.meta.env.VITE_API_URL || 'http://localhost:3001');
  const [tempApiUrl, setTempApiUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast Notification manager
  const addToast = useCallback((text, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Dark Mode side effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const openSettings = () => { 
    setTempKey(apiKey); 
    setTempApiUrl(apiUrl);
    setShowSettings(true); 
  };
  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempKey);
    localStorage.setItem('api_url', tempApiUrl);
    setApiKey(tempKey);
    setApiUrl(tempApiUrl);
    setShowSettings(false);
    addToast('Configuration saved (API Key & Backend URL)', 'success');
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#08090a] dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">

      {/* Ambient Gradient Blobs — Dark Mode only */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 hidden dark:block">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/4 blur-[100px]" />
      </div>

      {/* Grid background pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-100" />

      {/* Glassmorphic Sticky Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 dark:border-white/[0.05] bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl px-4 md:px-8 py-3 flex items-center justify-between transition-all duration-300">
        
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-lg shadow-emerald-500/20">
            <ShieldAlert className="w-4.5 h-4.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-950 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-950" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Stadium Copilot</div>
            <div className="text-[9px] font-mono text-zinc-400 tracking-[0.18em] uppercase mt-0.5">WC2026 · AI Orchestration</div>
          </div>
        </div>

        {/* Tab Switcher — Desktop */}
        <nav className="hidden md:flex items-center bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/[0.06] rounded-2xl p-1 gap-0.5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const accentMap = {
              blue: isActive ? 'text-blue-600 dark:text-blue-400' : '',
              emerald: isActive ? 'text-emerald-600 dark:text-emerald-400' : '',
              violet: isActive ? 'text-violet-600 dark:text-violet-400' : '',
            };
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800/80 shadow-md border border-zinc-200/80 dark:border-white/[0.08]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/30 dark:hover:bg-white/[0.02]'
                } ${accentMap[tab.accent] || ''}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded tracking-widest transition-all ${
                  isActive ? 'bg-zinc-100 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300' : 'opacity-0'
                }`}>{tab.sublabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* API Status Pill */}
          <button
            onClick={openSettings}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono font-semibold tracking-widest transition-all duration-200 ${
              apiKey
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/20'
                : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse hover:bg-amber-500/15 dark:hover:bg-amber-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {apiKey ? 'GEMINI LIVE' : 'OFFLINE'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.07] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 focus:ring-blue-500"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={openSettings}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.07] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 focus:ring-blue-500"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden sticky top-[57px] z-30 flex bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.05] px-2 py-1 gap-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const accentActive = {
            blue: 'text-blue-500',
            emerald: 'text-emerald-500',
            violet: 'text-violet-500',
          };
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl text-[9px] font-semibold font-mono tracking-wider transition-all ${
                isActive
                  ? `bg-zinc-100 dark:bg-white/[0.06] ${accentActive[tab.accent]} border border-zinc-200/70 dark:border-white/[0.07]`
                  : 'text-zinc-400 dark:text-zinc-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mb-0.5" />
              {tab.label.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Active Tab Breadcrumb bar */}
      <div className="hidden md:flex items-center gap-2 px-8 pt-4 pb-0 text-[10px] font-mono text-zinc-400 select-none z-10 relative">
        <Zap className="w-3 h-3 text-emerald-500" />
        <span>Stadium Copilot</span>
        <span className="text-zinc-600 dark:text-zinc-700">›</span>
        <span className={`${
          activeTab === 'control-room' ? 'text-blue-500' :
          activeTab === 'fan-app' ? 'text-emerald-500' : 'text-violet-500'
        } font-semibold`}>
          {activeTabInfo?.label}
        </span>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 transition-colors duration-200 relative z-10">
        {activeTab === 'control-room' && <ControlRoom apiKey={apiKey} addToast={addToast} />}

        {activeTab === 'fan-app' && (
          <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[calc(100vh-140px)]">
            <div className="text-center mb-6 select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-mono font-semibold tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                FAN PWA COMPANION
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Fan Experience Portal</h2>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">Wayfinding, heat advisories, carbon passport & AI chat — all offline-first.</p>
            </div>
            <div className="phone-mockup-wrapper w-full flex justify-center">
              <div className="phone-mockup-3d w-full max-w-[380px]">
                <FanApp apiKey={apiKey} addToast={addToast} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteer-app' && (
          <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[calc(100vh-140px)]">
            <div className="text-center mb-6 select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-500 text-[10px] font-mono font-semibold tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                VOLUNTEER BRIDGE
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Multilingual Field Device</h2>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">Translate & broadcast safety directions to fans in 40+ languages with cultural context briefs.</p>
            </div>
            <div className="phone-mockup-wrapper w-full flex justify-center">
              <div className="phone-mockup-3d w-full max-w-[380px]">
                <VolunteerApp apiKey={apiKey} addToast={addToast} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl shadow-black/30 p-6 relative overflow-hidden">
            {/* Subtle gradient accent top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Key className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">API Configuration</h3>
                <p className="text-[10px] text-zinc-400">Unlock live Gemini AI orchestration</p>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Paste your Google Gemini API Key to enable live incident simulation, personalized heat advisories, fan chat, and multilingual translation.
            </p>

            <div className="space-y-4">
            <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:border-emerald-500 transition-all placeholder:text-zinc-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') saveApiKey(); }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2">Backend API URL</label>
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:border-emerald-500 transition-all placeholder:text-zinc-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') saveApiKey(); }}
                />
              </div>

              <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Key is stored only in your browser's <code className="font-mono text-zinc-400">localStorage</code> and calls the Gemini API directly from your device.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl text-xs font-bold transition-all text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveApiKey}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:shadow-md"
                >
                  <Check className="w-3.5 h-3.5" /> Save & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-md transition-all duration-300 animate-slide-in-right ${
              toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 hover:border-emerald-500/50' :
              toast.type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-500/30 hover:border-rose-500/50' :
              toast.type === 'warning' ? 'bg-amber-950/90 text-amber-200 border-amber-500/30 hover:border-amber-500/50' :
              'bg-zinc-900/90 text-zinc-200 border-white/[0.10] hover:border-white/[0.15]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />}
            {toast.type === 'info' && <Terminal className="w-4 h-4 shrink-0 text-blue-400" />}
            <span className="leading-snug flex-1">{toast.text}</span>
            <div className="ml-2 h-1 rounded-full bg-current opacity-30 w-8 animate-shrink"></div>
          </div>
        ))}
      </div>

    </div>
  );
}
