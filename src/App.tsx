import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import StockChart from './components/StockChart';
import MarketOverview from './components/MarketOverview';
import SystemHealthCard from './components/SystemHealthCard';
import ChatView from './components/ChatView';
import PortfolioVault from './components/PortfolioVault';
import GoalArchitect from './components/GoalArchitect';
import SettingsView from './components/SettingsView';
import IntelFeedDesktop from './components/IntelFeedDesktop';
import PulseGauge from './components/ui/PulseGauge';
import LockScreen from './components/LockScreen';
import PulseOrb from './components/ui/PulseOrb';
import * as Intelligence from './services/intelligenceService';
import { StrategicConclusion } from './services/intelligenceService';
import { 
  Shield,
  Search, 
  Bell, 
  User, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  TrendingUp,
  Activity,
  Briefcase,
  Target,
  Settings,
  Menu,
  RefreshCw,
  Lock,
  Fingerprint
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

type Tab = 'vault' | 'pulse' | 'goals' | 'concierge' | 'settings';

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('pulse');
  const [focusedTicker, setFocusedTicker] = useState<any>(null);
  const [activeSymbol, setActiveSymbol] = useState('SBIN.NS');
  const [searchInput, setSearchInput] = useState('');
  const [isPuterReady, setIsPuterReady] = useState(false);
  const [isPuterSignedIn, setIsPuterSignedIn] = useState(false);
  const [sessionAvKey, setSessionAvKey] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [dataFreshness, setDataFreshness] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [newsStatus, setNewsStatus] = useState<{ newsApi: boolean; gnews: boolean; newsData: boolean; activeSource?: string }>({ newsApi: false, gnews: false, newsData: false });
  const [avHealth, setAvHealth] = useState<'STABLE' | 'QUALITY_ISSUE' | 'OFFLINE'>('STABLE');
  const [isChartRendering, setIsChartRendering] = useState(false);
  const [pulseScore, setPulseScore] = useState(50);
  const [rsiValue, setRsiValue] = useState<number | null>(null);
  const [volatilityScore, setVolatilityScore] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [aiInitialMessage, setAiInitialMessage] = useState<string>('');
  const [globalConclusion, setGlobalConclusion] = useState<StrategicConclusion | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug Log
  useEffect(() => {
    console.log('Puter Status:', !!(window as any).puter);
  }, []);

  // Robust Puter Initialization & Heartbeat
  useEffect(() => {
    const initPuter = () => {
      const puter = (window as any).puter;
      if (puter) {
        console.log('Puter.js detected.');
        setIsPuterReady(true);
        setIsPuterSignedIn(puter.auth?.isSignedIn() || false);
        return true;
      }
      return false;
    };

    // Initial check
    initPuter();

    // 5-second Heartbeat & Silent Re-init
    const heartbeat = setInterval(async () => {
      const puter = (window as any).puter;
      if (!puter) {
        console.warn('Puter.js missing. Attempting silent re-init...');
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.onload = () => initPuter();
        document.head.appendChild(script);
      } else {
        setIsPuterReady(true);
        setIsPuterSignedIn(puter.auth?.isSignedIn() || false);
        
        // Latency Heartbeat
        const start = performance.now();
        try {
          await puter.kv.get('latency_test');
          const end = performance.now();
          setLatency(Math.round(end - start));
        } catch (e) {
          console.warn('Latency check failed');
        }

        // News Status Check
        const { kvLoad, getStrategicConclusion } = await import('./services/intelligenceService');
        
        // Background Strategic Scan
        if (activeSymbol && chartData.length > 0) {
          const conclusion = await getStrategicConclusion(activeSymbol, chartData);
          if (conclusion) {
            setGlobalConclusion(conclusion);
            // Trigger Notification if strategic match found
            if (Notification.permission === 'granted') {
              new Notification(`[${conclusion.indicator}] ${conclusion.ticker}`, {
                body: `${conclusion.verdict}. ${conclusion.logic}`,
                icon: "/logo.png"
              });
            }
          }
        }

        const newsKey = await kvLoad('news_api_key', '');
        const gnewsKey = await kvLoad('gnews_api_key', '');
        const newsDataKey = await kvLoad('newsdata_api_key', '');
        const viteNewsKey = import.meta.env.VITE_NEWS_API_KEY;
        const viteGnewsKey = import.meta.env.VITE_GNEWS_API_KEY;
        setNewsStatus({ 
          newsApi: !!newsKey || !!viteNewsKey, 
          gnews: !!gnewsKey || !!viteGnewsKey,
          newsData: !!newsDataKey
        });
      }
    }, 5000);

    return () => clearInterval(heartbeat);
  }, []);

  // Fetch Chart Data
  useEffect(() => {
    const fetchChart = async () => {
      setIsChartLoading(true);
      setChartError(null);
      const { getAlphaVantageData } = await import('./services/intelligenceService');
      
      // Check for Alpha Vantage key (Session first, then KV)
      const avResult = await getAlphaVantageData(activeSymbol, sessionAvKey);
      if (avResult.error === 'API_KEY_MISSING') {
        setChartError('OFFLINE');
        setAvHealth('OFFLINE');
        setIsChartLoading(false);
        return;
      }

      const { data, error } = avResult;
      if (data) {
        setChartData(data);
        setAvHealth('STABLE');
      } else {
        setChartData([]);
        // If data is null, it might be a fuel quality issue (ticker mismatch)
        setAvHealth('QUALITY_ISSUE');
      }
      setChartError(error);
      if (avResult.timestamp) setDataFreshness(avResult.timestamp);
      setIsChartLoading(false);
    };
    fetchChart();
  }, [activeSymbol, refreshTrigger]);

  // Calculate RSI and Volatility
  // Fetch Sentiment Pulse
  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const sentiment = await Intelligence.analyzeSentiment(activeSymbol);
        setPulseScore(sentiment.score);
      } catch (error) {
        console.error("Failed to fetch pulse score:", error);
      }
    };
    fetchPulse();
  }, [activeSymbol]);

  useEffect(() => {
    if (chartData.length < 14) {
      setRsiValue(null);
      setVolatilityScore('LOW');
      return;
    }

    // RSI Calculation (14-period)
    let gains = 0;
    let losses = 0;
    for (let i = chartData.length - 14; i < chartData.length; i++) {
      const diff = chartData[i].close - chartData[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    setRsiValue(Math.round(rsi));

    // Volatility Calculation (Last 10 candles spread)
    const last10 = chartData.slice(-10);
    const avgSpread = last10.reduce((acc, curr) => acc + (curr.high - curr.low), 0) / 10;
    const avgPrice = last10.reduce((acc, curr) => acc + curr.close, 0) / 10;
    const volRatio = (avgSpread / avgPrice) * 100;

    if (volRatio > 2) setVolatilityScore('HIGH');
    else if (volRatio > 1) setVolatilityScore('MEDIUM');
    else setVolatilityScore('LOW');
  }, [chartData]);

  // Typewriter effect for header
  const [headerText, setHeaderText] = useState('');
  const fullText = "NEXUS_VAULT_v4.0.7_OMEGA";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setHeaderText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  const [isAiFocused, setIsAiFocused] = useState(false);
  const [isJarvisMode, setIsJarvisMode] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

  // Sync Jarvis Mode with Tab
  useEffect(() => {
    setIsJarvisMode(activeTab === 'concierge');
    if (activeTab === 'concierge') setIsChatSidebarOpen(true);
  }, [activeTab]);

  // Focus-Mode Listeners
  useEffect(() => {
    const handleFocus = (e: any) => setIsAiFocused(e.detail);
    window.addEventListener('nexus_chat_focus', handleFocus);
    return () => window.removeEventListener('nexus_chat_focus', handleFocus);
  }, []);

  const navItems = [
    { id: 'vault', icon: Shield, label: 'VAULT' },
    { id: 'pulse', icon: Zap, label: 'Pulse' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'concierge', icon: Sparkles, label: 'AI' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const [statusText, setStatusText] = useState('');
  const fullStatus = `[SECURE_CHANNEL_ACTIVE] | [${latency}ms_LATENCY] | [USER: KAUSHAL]`;

  useEffect(() => {
    if (isVaultUnlocked) {
      let i = 0;
      const timer = setInterval(() => {
        setStatusText(fullStatus.slice(0, i));
        i++;
        if (i > fullStatus.length) clearInterval(timer);
      }, 50); // Fixed speed for better feel
      return () => clearInterval(timer);
    }
  }, [isVaultUnlocked, latency]);

  const [isBioActive, setIsBioActive] = useState(false);
  const [bioFailures, setBioFailures] = useState(0);
  const [isBioDisabled, setIsBioDisabled] = useState(false);

  const handleBiometricAuth = async () => {
    if (isBioDisabled) return;
    
    try {
      setIsBioActive(true);
      // Mock biometric trigger for main UI re-auth or secure unlock status
      // In a real app, this would verify the user before sensitive actions
      const isAvailable = await (window as any).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        sonnerToast.error("Biometric hardware not detected.");
        setIsBioDisabled(true);
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const savedCredId = localStorage.getItem('nexus_passkey_credential');

      if (!savedCredId) {
        // Registration Flow
        const registerOptions: any = {
          publicKey: {
            challenge,
            rp: { name: "Nexus Vault", id: window.location.hostname || "localhost" },
            user: { id: new Uint8Array(16), name: "nexus_user@vault.internal", displayName: "Nexus Operator" },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
            timeout: 60000,
            attestation: "none",
            userVerification: "required",
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "required"
            }
          }
        };

        const credential: any = await navigator.credentials.create(registerOptions);
        if (credential) {
          localStorage.setItem('nexus_passkey_credential', credential.id);
          sonnerToast.success("Biometric Link Established.");
        }
      } else {
        // Authentication Flow
        const authOptions: any = {
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: "required",
            rpId: window.location.hostname || "localhost",
            allowCredentials: [{
              id: Uint8Array.from(atob(savedCredId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
              type: 'public-key'
            }]
          }
        };

        await navigator.credentials.get(authOptions);
        sonnerToast.success("Security Clearance Verified.");
      }
      setBioFailures(0);
    } catch (error) {
      console.error("Biometric failed:", error);
      const newFailures = bioFailures + 1;
      setBioFailures(newFailures);
      if (newFailures >= 3) {
        setIsBioDisabled(true);
        sonnerToast.error("Security Protocols Locked. Use PIN.");
      } else {
        sonnerToast.error(`Authentication Failure. Attempt ${newFailures}/3`);
      }
    } finally {
      setIsBioActive(false);
    }
  };

  const handleRefresh = async () => {
    const { kvSave } = await import('./services/intelligenceService');
    await kvSave(`av_cache_${activeSymbol}`, null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);

    let symbol = searchInput.trim().toUpperCase();
    
    // List of US Tickers to ignore
    const isUS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'AMD'].includes(symbol);
    
    // THE BSE SHIELD: If it's not US and has no suffix, default to .BSE
    if (!symbol.includes('.') && !isUS) {
      symbol += '.BSE'; // Changed from .NS to .BSE for your specific API fuel
    }
    
    setActiveSymbol(symbol);
    setSearchInput('');
    // Force Pulse tab so we actually see the chart we just searched
    setActiveTab('pulse'); 
  };

  const handleUnlock = () => {
    setIsVaultUnlocked(true);
    // Visual shutter pause
    setTimeout(() => {
      setIsLocked(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-neu-bg text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      <Toaster position="top-center" theme="dark" />

      {/* LOCK SCREEN OVERLAY */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            key="lock-screen"
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000]"
          >
            <LockScreen onUnlock={handleUnlock} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHUTTER REVEAL OVERLAY */}
      <AnimatePresence>
        {isVaultUnlocked && (
          <>
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: '-100%' }}
              transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
              className="fixed inset-0 top-0 h-1/2 bg-[#020817] z-[99999] border-b border-[#00FFC2]/20"
            />
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: '100%' }}
              transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
              className="fixed inset-0 top-1/2 h-1/2 bg-[#020817] z-[99999] border-t border-[#00FFC2]/20"
            />
          </>
        )}
      </AnimatePresence>
      
      {/* Top Bar */}
      <header className="h-20 px-6 flex items-center justify-between sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-lg border-b border-white/10 overflow-hidden">
        {/* Scan-line Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        <div className="flex flex-col relative z-10">
          <span className="text-[14px] font-black text-[#E0E0E0] font-sans uppercase tracking-[0.5em] mb-0.5 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">Nexus Vault</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-[300px]">
              <span className="text-[9px] text-emerald-400 font-mono tracking-tighter uppercase whitespace-nowrap">{statusText}</span>
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-1 h-3 bg-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={async () => {
                if (!("Notification" in window)) {
                  sonnerToast.error("Notifications not supported on this device.");
                  return;
                }
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                   sonnerToast.success("SYSTEM_LINK_ESTABLISHED");
                   new Notification("Nexus", {
                     body: "Strategic link established. Standing by for high-alpha conclusions.",
                     icon: "/logo.png"
                   });
                } else {
                   sonnerToast.error("LINK_FAILED: PERMISSION_REQUIRED");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-emerald-500/50 bg-emerald-500/5 rounded-xl text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/10 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
            >
              <Zap className="w-3 h-3 fill-emerald-400 group-hover:scale-125 transition-transform" />
              SYNC NEURAL LINK
            </button>

            <div className={`relative flex-1 group transition-all duration-500 ${isSearching ? 'scale-[1.02]' : ''}`}>
              {/* Search Pulse Effect */}
              {isSearching && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 1.5] }}
                  className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-xl"
                />
              )}
              <input 
                type="text"
                placeholder="SEARCH SYMBOL..."
                className="w-full h-10 neu-sunken rounded-xl pl-4 pr-12 text-[clamp(0.7rem,1vw,0.8rem)] text-[#E0E0E0] outline-none focus:border-emerald-500/50 transition-all font-mono font-bold bg-black/20 backdrop-blur-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:border-emerald-500/60 text-emerald-400 transition-all group-focus-within:border-emerald-500/50"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={handleRefresh}
              className="p-2.5 neu-button rounded-xl text-zinc-500 hover:text-emerald-400 transition-all group relative"
              title="Refresh Data Stream"
            >
              <RefreshCw className={`w-4 h-4 ${isChartLoading ? 'animate-spin text-emerald-500' : ''}`} />
              {isChartLoading && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </button>
          <button 
            onClick={() => setIsLocked(true)}
            className="w-10 h-10 neu-button rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors"
            title="Lock Vault"
          >
            <Lock className="w-5 h-5" />
          </button>
          <button 
            onClick={async () => {
              if (activeTab !== 'settings') {
                setActiveTab('settings');
                toast.info("Opening Neural Alerts configuration...");
              } else {
                const button = document.getElementById('enable-alerts');
                if (button) button.click();
              }
            }}
            className="w-10 h-10 neu-button rounded-xl flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-colors"
            title="Neural Alerts"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex overflow-hidden bg-[#050505]`}>
        <div className={`flex-1 relative overflow-y-auto px-6 pb-32 no-scrollbar transition-all duration-700 ${
          isChatSidebarOpen ? 'lg:pr-4' : ''
        }`}>
          <AnimatePresence mode="wait">
            {activeTab === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PortfolioVault 
                onFocusTicker={setFocusedTicker} 
                onOpenSearch={() => {
                  // 1. Force the UI to the main terminal view
                  setActiveTab('pulse');
                  
                  // 2. Small delay to allow the tab to mount, then focus the search
                  setTimeout(() => {
                    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                    if (searchInput) {
                      searchInput.focus();
                      // Visual feedback: briefly highlight the search bar
                      searchInput.classList.add('ring-2', 'ring-emerald-500');
                      setTimeout(() => searchInput.classList.remove('ring-2', 'ring-emerald-500'), 1000);
                    }
                  }, 100);
                }}
              />
            </motion.div>
          )}

          {(activeTab === 'pulse' || activeTab === 'concierge') && (
            <motion.div
              key="pulse"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`space-y-8 pt-4 transition-all duration-700 ${isJarvisMode ? 'pointer-events-none' : ''}`}
            >
              {isMobile ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                  <PulseOrb 
                    sentiment={
                      globalConclusion?.indicator === 'BULLISH' ? 'Bullish' : 
                      globalConclusion?.indicator === 'BEARISH' ? 'Bearish' : 
                      globalConclusion?.indicator === 'NEUTRAL' ? 'Neutral' : 'noise'
                    } 
                    size="lg" 
                  />
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Neural Status</p>
                    <p className="text-xl font-black text-white italic">
                      {globalConclusion ? (
                        globalConclusion.indicator === 'BULLISH' ? 'TARGET_ACQUIRED' :
                        globalConclusion.indicator === 'BEARISH' ? 'DEFENSIVE_POSTURE' : 'MONITORING_NOISE'
                      ) : 'MONITORING_NOISE'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-2 max-w-[250px] mx-auto uppercase">
                      {globalConclusion ? globalConclusion.logic : 'Awaiting strategic match from vault items...'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Phone Mode Toggle logic: On mobile, we only show specific parts */}
                  <div className="md:hidden space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xs font-black uppercase tracking-widest text-[#00FFC2]">Nexus Pulse Feed</h2>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                {/* Simplified Portfolio/Watchlist view as the "Pulse Feed" */}
                <PortfolioVault 
                  onFocusTicker={setFocusedTicker} 
                />
              </div>

              {/* Desktop Mode: Complex GRID (Hidden on Mobile) */}
              <div className="hidden md:block space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Live Terminal: {activeSymbol}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab('vault')}
                      className="px-4 py-2 neu-button rounded-xl text-[10px] font-black text-emerald-400 flex items-center gap-2"
                    >
                      <Briefcase className="w-3 h-3" />
                      Add to Vault
                    </button>
                  </div>
                </div>

                {/* MAIN COMMAND GRID: [News] | [Chart] | [Diagnostics] */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Column 1: Intel/News (Spans 4/12 columns ~33%) */}
                  <div className={`lg:col-span-4 min-h-[600px] min-w-[360px] transition-all duration-700 ${isJarvisMode ? 'opacity-30 blur-sm scale-95' : 'opacity-100'}`}>
                    <IntelFeedDesktop 
                      symbol={activeSymbol} 
                      chartData={chartData}
                      rsi={rsiValue || 50}
                      price={chartData.length > 0 ? chartData[chartData.length - 1].close : 0}
                      newsStatus={newsStatus}
                      onInitiateDeepScan={(message) => {
                        setAiInitialMessage(message);
                        setIsChatSidebarOpen(true);
                      }}
                    />
                  </div>

                  {/* Column 2: Chart (Spans 6/12 columns ~50%) */}
                  <div className={`lg:col-span-6 h-[700px] transition-all duration-700 ${isJarvisMode ? 'opacity-40 grayscale-[0.8] scale-95 blur-[2px]' : 'opacity-100'}`}>
                    <StockChart 
                      symbol={activeSymbol} 
                      data={chartData} 
                      isLoading={isChartLoading} 
                      onRenderingChange={setIsChartRendering}
                    />
                  </div>

                  {/* Column 3: Diagnostic Cluster (Spans 2/12 columns) */}
                  <div className={`lg:col-span-2 flex flex-col gap-6 transition-all duration-700 ${isJarvisMode ? 'opacity-30 blur-sm scale-95' : 'opacity-100'}`}>
                    {/* Pulse Gauge Card */}
                    <div className="neu-embossed p-6 rounded-[2rem] flex flex-col items-center justify-center bg-black/20 backdrop-blur-xl">
                      <PulseGauge score={pulseScore} label={`${activeSymbol.split('.')[0]} Pulse`} />
                    </div>

                    {/* Volatility Smart Cell */}
                    <div className="neu-embossed p-8 rounded-[2rem] flex flex-col justify-between bg-black/20 backdrop-blur-xl min-h-[220px]">
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Volatility Index</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-white italic tracking-tighter">{volatilityScore}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${volatilityScore === 'HIGH' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'} animate-pulse`} />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">RSI: {rsiValue || '--'}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('concierge');
                          setAiInitialMessage(`Deep Scan: Why is ${activeSymbol} showing an RSI of ${rsiValue}? Give me the technical outlook.`);
                        }}
                        className="mt-6 py-3 px-4 skeu-button rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                      >
                        <Sparkles className="w-4 h-4 text-[#00FFC2] group-hover:scale-110 transition-transform" />
                        RUN DEEP SCAN
                      </button>
                    </div>

                    <SystemHealthCard 
                      latency={latency} 
                      newsStatus={newsStatus} 
                      avStatus={avHealth}
                      isRendering={isChartRendering}
                      pulseSource={chartData.length > 0 ? (newsStatus.newsApi ? 'Alpha (NewsAPI.ai)' : (newsStatus.newsData ? 'Gamma (NewsData.io)' : (newsStatus.gnews ? 'Beta (GNews)' : ''))) : ''} 
                      onRefresh={handleRefresh}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-4"
            >
              <GoalArchitect activeSymbol={activeSymbol} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SettingsView sessionKey={sessionAvKey} onSessionKeyChange={setSessionAvKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dedicated Sliding Panel - AI Concierge */}
      <AnimatePresence>
        {isChatSidebarOpen && (
          <ChatView 
            ticker={{ symbol: activeSymbol, name: 'Current Focus', price: chartData.length > 0 ? chartData[chartData.length - 1].close : 0 }}
            initialRationale={aiInitialMessage}
            onBack={() => setIsChatSidebarOpen(false)}
            isSidebar={activeTab !== 'concierge'}
            isGeneralMode={activeTab === 'concierge'}
          />
        )}
      </AnimatePresence>
    </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 w-full h-24 bg-white/5 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-50 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
          focusedTicker || activeTab === 'concierge' || isAiFocused || isBioActive ? 'translate-y-[120%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1">
          {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`flex flex-col items-center justify-center transition-all w-20 h-16 rounded-2xl skeu-button flex-shrink-0 ${
                  activeTab === item.id ? 'text-[#00FFC2]' : 'text-zinc-500'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1">
                  {item.label}
                </span>
              </button>
          ))}
        </div>

        {/* Neural Fingerprint Link in Nav - Removed if Unlocked */}
        {!isVaultUnlocked && (
          <>
            <div className="h-10 w-[1px] bg-white/10 mx-4" />
            
            <button
              onClick={handleBiometricAuth}
              disabled={isBioDisabled}
              className={`flex flex-col items-center justify-center transition-all px-4 h-16 rounded-2xl skeu-button relative group ${
                isBioDisabled ? 'opacity-30 grayscale' : 'text-[#8B5CF6]'
              }`}
            >
              <div className="relative">
                <Fingerprint className={`w-6 h-6 ${isBioActive ? 'animate-pulse' : ''}`} />
                {isBioActive && (
                  <motion.div 
                    layoutId="pulse-ring"
                    className="absolute inset-0 rounded-full border-2 border-[#8B5CF6]/50 shadow-[0_0_15px_#8B5CF6]"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
                {isBioActive && !localStorage.getItem('nexus_passkey_credential') && (
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#8B5CF6]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 whitespace-nowrap shadow-xl">
                     <span className="text-[8px] font-black text-white uppercase tracking-widest">Linking Biometrics...</span>
                   </div>
                )}
              </div>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-1 whitespace-nowrap">
                {isBioDisabled ? 'Locked' : (localStorage.getItem('nexus_passkey_credential') ? 'Neural Link' : 'Register Link')}
              </span>
              {bioFailures > 0 && !isBioDisabled && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold border border-[#020817]">
                  {3 - bioFailures}
                </div>
              )}
            </button>
          </>
        )}
      </nav>

      {/* AI Concierge Overlay */}
      <AnimatePresence>
        {focusedTicker && (
          <ChatView 
            ticker={focusedTicker} 
            initialRationale="Initializing deep analysis of the selected asset..." 
            onBack={() => setFocusedTicker(null)} 
          />
        )}
      </AnimatePresence>
      {/* Footer Boot Sequence */}
      <footer className="mt-12 mb-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                INITIALIZING NEURAL LINKS... DONE. DATA_STREAM: ACTIVE.
              </span>
            </div>
            <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
              Nexus OS v4.0.7_OMEGA // Quantum Encryption Enabled
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">System Latency</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">{latency}ms</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Neural Load</span>
              <span className="text-[10px] font-mono font-bold text-blue-400">14.2%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
