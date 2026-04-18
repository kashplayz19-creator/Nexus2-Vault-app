import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Cloud, Database, ShieldCheck, Zap, Key, RefreshCw, LogIn, Cpu, Sparkles, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { kvLoad, kvSave } from '../services/intelligenceService';

interface SettingsViewProps {
  sessionKey?: string;
  onSessionKeyChange?: (key: string) => void;
}

export default function SettingsView({ sessionKey = '', onSessionKeyChange }: SettingsViewProps) {
  const [avKey, setAvKey] = useState('');
  const [newsApiKey, setNewsApiKey] = useState('');
  const [gnewsKey, setGnewsKey] = useState('');
  const [newsDataKey, setNewsDataKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPuterLoggedIn, setIsPuterLoggedIn] = useState(false);
  const [quota, setQuota] = useState(0);

  const isApiActive = !!avKey || !!sessionKey;
  const isNewsApiActive = !!newsApiKey;
  const isNewsDataActive = !!newsDataKey || !!gnewsKey;

  useEffect(() => {
    const loadSettings = async () => {
      const savedKey = await kvLoad('av_key', '');
      setAvKey(savedKey);

      const savedNewsKey = await kvLoad('news_api_key', '');
      setNewsApiKey(savedNewsKey);

      const savedGnewsKey = await kvLoad('gnews_api_key', '');
      setGnewsKey(savedGnewsKey);

      const savedNewsDataKey = await kvLoad('newsdata_api_key', '');
      setNewsDataKey(savedNewsDataKey);

      const today = new Date().toISOString().split('T')[0];
      const currentQuota = await kvLoad(`av_quota_${today}`, 0);
      setQuota(currentQuota);

      const puter = (window as any).puter;
      if (puter && puter.auth) {
        setIsPuterLoggedIn(puter.auth.isSignedIn());
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await kvSave('av_key', avKey);
      await kvSave('news_api_key', newsApiKey);
      await kvSave('gnews_api_key', gnewsKey);
      await kvSave('newsdata_api_key', newsDataKey);
      toast.success('Settings synchronized to Nexus Cloud.');
    } catch (error) {
      toast.error('Cloud synchronization failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeCache = async () => {
    const { purgeCache } = await import('../services/intelligenceService');
    await purgeCache();
    toast.info('Neural cache purged.');
  };

  return (
    <div className="space-y-8 pt-4">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl neu-embossed flex items-center justify-center text-emerald-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">System Settings</h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Nexus OS Configuration</p>
        </div>
      </header>

      {/* Puter Status */}
      <div className="neu-embossed p-6 rounded-[32px] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Puter Cloud Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPuterLoggedIn ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isPuterLoggedIn ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPuterLoggedIn ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
        {!isPuterLoggedIn && (
          <button 
            onClick={() => {
              const puter = (window as any).puter;
              if (puter && puter.ui) {
                puter.ui.authenticateWithPuter().then(() => {
                  setIsPuterLoggedIn(true);
                  toast.success('Cloud Link established.');
                }).catch((e: any) => {
                  console.error('Auth failed:', e);
                  toast.error('Authentication failed.');
                });
              } else {
                toast.error('Cloud Link not initialized. Please refresh.');
              }
            }}
            className="w-full py-3 neu-button rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400"
          >
            <LogIn className="w-4 h-4" />
            Initialize Cloud Link
          </button>
        )}
      </div>

      {/* Neural Core Diagnostics */}
      <div className="neu-embossed p-8 rounded-[40px] space-y-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Neural Core Diagnostics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 neu-sunken rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Primary Concierge</p>
              <p className="text-[10px] font-bold text-white">Gemini 2.0 Flash</p>
            </div>
            <p className="text-[7px] text-zinc-600 uppercase tracking-tighter">High Context Memory // Active</p>
          </div>

          <div className="p-4 neu-sunken rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <Zap className="w-4 h-4 text-blue-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Pulse Engine</p>
              <p className="text-[10px] font-bold text-white">GPT-4o</p>
            </div>
            <p className="text-[7px] text-zinc-600 uppercase tracking-tighter">Market Mood Detection // Active</p>
          </div>

          <div className="p-4 neu-sunken rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <Brain className="w-4 h-4 text-purple-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Goal Architect</p>
              <p className="text-[10px] font-bold text-white">Claude 3.7 Sonnet</p>
            </div>
            <p className="text-[7px] text-zinc-600 uppercase tracking-tighter">Precision Math Logic // Active</p>
          </div>
        </div>
      </div>

      {/* Alpha Vantage Config */}
      <div className="neu-embossed p-8 rounded-[40px] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Data Intelligence Fuel</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isApiActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'} animate-pulse`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${isApiActive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isApiActive ? '[API KEY: ACTIVE]' : '[API KEY: REQUIRED]'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Alpha Vantage API Key (Cloud Sync)</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="password"
                placeholder="Enter API Key..."
                className="w-full h-14 neu-sunken rounded-2xl pl-12 pr-4 text-sm text-white outline-none focus:border-emerald-500/50 transition-all bg-black/10"
                value={avKey}
                onChange={(e) => setAvKey(e.target.value)}
              />
            </div>
            <p className="text-[8px] text-zinc-600 mt-2 uppercase tracking-widest leading-relaxed">
              Saved to Puter.js Cloud. Required for real-time daily candlestick data.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <label className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Emergency Session Key (Local Only)</label>
            </div>
            <input 
              type="password"
              placeholder="Paste temporary key here..."
              className="w-full h-12 bg-black/20 rounded-xl px-4 text-xs text-white border border-amber-500/20 outline-none focus:border-amber-500/50 transition-all"
              value={sessionKey}
              onChange={(e) => onSessionKeyChange?.(e.target.value)}
            />
            <p className="text-[7px] text-amber-500/60 uppercase tracking-widest">
              Use this if Puter is offline. Not saved to cloud.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 neu-sunken rounded-2xl">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Daily Quota</span>
            </div>
            <span className="text-sm font-mono font-black text-white">{quota} / 25</span>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-5 neu-button rounded-3xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-xs"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Save to Cloud
          </button>
        </div>
      </div>

      {/* Advanced */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2">Advanced Protocols</h2>
        
        <div className="neu-embossed p-6 rounded-[32px] space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">NewsAPI.ai (Event Registry) Key</label>
              <div className="flex items-center gap-1.5">
                <div className={`w-1 h-1 rounded-full ${isNewsApiActive ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-rose-500 shadow-[0_0_5px_#f43f5e]'} animate-pulse`} />
                <span className={`text-[7px] font-black uppercase tracking-widest ${isNewsApiActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isNewsApiActive ? 'Active' : 'Missing'}
                </span>
              </div>
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="password"
                placeholder="Enter NewsAPI.ai Key..."
                className="w-full h-12 neu-sunken rounded-xl pl-12 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all bg-black/10"
                value={newsApiKey}
                onChange={(e) => setNewsApiKey(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">NewsData.io Key</label>
              <div className="flex items-center gap-1.5">
                <div className={`w-1 h-1 rounded-full ${isNewsDataActive ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-rose-500 shadow-[0_0_5px_#f43f5e]'} animate-pulse`} />
                <span className={`text-[7px] font-black uppercase tracking-widest ${isNewsDataActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isNewsDataActive ? 'Active' : 'Missing'}
                </span>
              </div>
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="password"
                placeholder="Enter NewsData.io Key..."
                className="w-full h-12 neu-sunken rounded-xl pl-12 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all bg-black/10"
                value={newsDataKey}
                onChange={(e) => setNewsDataKey(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">GNews Key (Fallback)</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="password"
                placeholder="Enter GNews Key..."
                className="w-full h-12 neu-sunken rounded-xl pl-12 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all bg-black/10"
                value={gnewsKey}
                onChange={(e) => setGnewsKey(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            try {
              const tempKeys = {
                av_key: avKey,
                news_api_key: newsApiKey,
                gnews_api_key: gnewsKey,
                newsdata_api_key: newsDataKey
              };
              
              // Logic to save to localStorage individually for system compatibility
              localStorage.setItem('av_key', JSON.stringify(avKey));
              localStorage.setItem('news_api_key', JSON.stringify(newsApiKey));
              localStorage.setItem('gnews_api_key', JSON.stringify(gnewsKey));
              localStorage.setItem('newsdata_api_key', JSON.stringify(newsDataKey));
              
              // Save combined object as requested
              localStorage.setItem('nexus_api_keys', JSON.stringify(tempKeys));
              
              // Verification check
              const verification = localStorage.getItem('nexus_api_keys');
              if (verification === JSON.stringify(tempKeys)) {
                alert("SYSTEM_PROTOCOL: Keys Committed to Neural Vault.");
                window.location.reload(); // Refresh to apply keys immediately
              } else {
                throw new Error("Data integrity check failed after write.");
              }
            } catch (error) {
              alert(`VAULT_ERROR: ${error instanceof Error ? error.message : 'Unknown error during commitment.'}`);
            }
          }}
          className="mt-4 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold rounded-xl transition-all uppercase tracking-tighter"
        >
          Commit Changes to Vault
        </button>

        <button 
          onClick={handlePurgeCache}
          className="w-full py-4 neu-embossed rounded-2xl flex items-center justify-center gap-2 text-rose-400 font-black uppercase tracking-widest text-[10px]"
        >
          <RefreshCw className="w-4 h-4" />
          Purge Neural Cache
        </button>
      </div>

      <p className="text-[8px] text-center text-zinc-700 uppercase tracking-[0.4em] font-black pt-8">
        Not Financial Advice // Nexus Intelligence Protocol
      </p>
      <p className="text-[8px] text-center text-zinc-800 uppercase tracking-[0.2em] font-black mt-2">
        Nexus Vault Security Protocol // v4.0.4_RESILIENT_ENGINE
      </p>
    </div>
  );
}
