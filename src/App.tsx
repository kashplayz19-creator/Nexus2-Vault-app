import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import StockChart from './components/StockChart';
import MarketOverview from './components/MarketOverview';
import SystemHealthCard from './components/SystemHealthCard';
import ChatView from './components/ChatView';
import PortfolioVault from './components/PortfolioVault';
import GoalArchitect from './components/GoalArchitect';
import SettingsView from './components/SettingsView';
import IntelFeed from './components/IntelFeed';
import PulseGauge from './components/ui/PulseGauge';
import * as Intelligence from './services/intelligenceService';
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
  RefreshCw
} from 'lucide-react';

type Tab = 'vault' | 'pulse' | 'goals' | 'concierge' | 'settings';

export default function App() {
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
        const { kvLoad } = await import('./services/intelligenceService');
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

  const navItems = [
    { id: 'vault', icon: Shield, label: 'VAULT' },
    { id: 'pulse', icon: Zap, label: 'Pulse' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'concierge', icon: Sparkles, label: 'AI' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

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

  return (
    <div className="flex flex-col w-full min-h-screen bg-neu-bg text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      <Toaster position="top-center" theme="dark" />
      
      {/* Top Bar */}
      <header className="h-20 px-6 flex items-center justify-between sticky top-0 z-40 bg-neu-bg/80 backdrop-blur-md border-b border-emerald-500/30 overflow-hidden">
        {/* Scan-line Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        <div className="flex flex-col relative z-10">
          <span className="text-[13px] font-bold text-[#C0C0C0] font-sans uppercase tracking-[0.4em] mb-0.5 drop-shadow-[0_0_8px_rgba(192,192,192,0.3)]">Nexus Os</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#C0C0C0]/60 font-mono tracking-tighter">{headerText}_</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isPuterSignedIn ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <div className={`w-1 h-1 rounded-full animate-pulse ${isPuterSignedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-[6px] font-black uppercase tracking-widest ${isPuterSignedIn ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isPuterSignedIn ? 'SYSTEM: ONLINE' : 'SYSTEM: STANDBY'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-xs ml-4 relative z-10">
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
                placeholder="Search Symbol..."
                className="w-full h-10 neu-sunken rounded-xl pl-4 pr-12 text-xs text-[#E0E0E0] outline-none focus:border-emerald-500/50 transition-all font-bold bg-black/20 backdrop-blur-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
          <button className="w-10 h-10 neu-button rounded-xl flex items-center justify-center text-zinc-400">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
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

          {activeTab === 'pulse' && (
            <motion.div
              key="pulse"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8 pt-4"
            >
              {/* Chart Section */}
              <div className="space-y-4">
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
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Column 1: Intel/News (Spans 1 column) */}
                  <div className="lg:col-span-1 h-[550px]">
                    <IntelFeed symbol={activeSymbol} />
                  </div>

                  {/* Column 2-3: Chart (Spans 2 columns) */}
                  <div className="lg:col-span-2 h-[550px]">
                    <StockChart 
                      symbol={activeSymbol} 
                      data={chartData} 
                      isLoading={isChartLoading} 
                      onRenderingChange={setIsChartRendering}
                    />
                  </div>

                  {/* Column 4: Diagnostic Cluster (Spans 1 column) */}
                  <div className="lg:col-span-1 h-[550px] flex flex-col gap-4">
                    {/* Pulse Gauge Card */}
                    <div className="neu-embossed p-4 rounded-3xl flex flex-col items-center justify-center bg-[#0B0E14] border border-white/5">
                      <PulseGauge score={pulseScore} label={`${activeSymbol.split('.')[0]} Pulse`} />
                    </div>

                    {/* Volatility Smart Cell */}
                    <div className="neu-embossed p-6 rounded-3xl flex-1 flex flex-col justify-between bg-[#0B0E14] border border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Market Volatility</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-black text-white">{volatilityScore}</p>
                          <span className="text-[10px] font-mono text-emerald-400">RSI: {rsiValue || '--'}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('concierge');
                          setAiInitialMessage(`Deep Scan: Why is ${activeSymbol} showing an RSI of ${rsiValue}? Give me the technical outlook.`);
                        }}
                        className="mt-4 py-2 px-3 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/50 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Deep Analysis
                      </button>
                    </div>

                    {/* System Health Card */}
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

          {activeTab === 'concierge' && (
            <motion.div
              key="concierge"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-40"
            >
              <ChatView 
                ticker={{ symbol: activeSymbol, name: 'Current Focus', price: chartData.length > 0 ? chartData[chartData.length - 1].close : 0 }}
                initialRationale={aiInitialMessage}
                onBack={() => setActiveTab('pulse')}
                isGeneralMode={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-24 bg-neu-bg/80 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between z-50">
        {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex flex-col items-center justify-center transition-all w-12 h-12 rounded-2xl ${
                activeTab === item.id ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">
                {item.label}
              </span>
            </button>
        ))}
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
