import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import Login from './components/Login';
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
  LayoutDashboard,
  Lock,
  RefreshCw
} from 'lucide-react';

type Tab = 'vault' | 'pulse' | 'goals' | 'concierge' | 'settings';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
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

  // Return Login screen if not authorized
  if (!isAuthorized) {
    return <Login onLogin={() => setIsAuthorized(true)} />;
  }

  // Main App Return
  return (
    <div className="flex h-screen w-full bg-[#020617] text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      <Toaster position="top-center" theme="dark" />
      
      {/* Sidebar Navigation */}
      <aside className="w-72 h-full bg-[#0a0f1e]/40 backdrop-blur-2xl border-r border-white/5 flex flex-col p-8 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-sm font-black tracking-[0.3em] text-white">NEXUS</span>
        </div>

        <nav className="flex-1 space-y-3">
          <button 
            onClick={() => setActiveTab('pulse')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === 'pulse' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('vault')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === 'vault' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Portfolio</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Lock className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Security</span>
          </button>

          <div className="pt-8 opacity-40">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4 mb-4">Intelligence</p>
            <button onClick={() => setActiveTab('concierge')} className="w-full flex items-center gap-4 p-4 rounded-2xl text-zinc-500 hover:text-emerald-400 transition-all">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">AI Concierge</span>
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isPuterSignedIn ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">System Link Active</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 truncate">{headerText}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#020617] to-[#0a0f1e]">
        {/* Futuristic Heading Section */}
        <header className="p-10 pb-0">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-7xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 uppercase drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
              NEXUS VAULT
            </h1>
            
            {/* Search HUD */}
            <div className="flex items-center gap-4 max-w-sm flex-1">
              <div className="relative flex-1 group">
                <input 
                  type="text"
                  placeholder="SCAN SYMBOL..."
                  className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-4 pr-12 text-xs font-bold tracking-widest text-emerald-400 placeholder:text-zinc-700 outline-none focus:border-emerald-500/40 transition-all"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} className="absolute right-2 top-2 bottom-2 w-8 flex items-center justify-center text-zinc-600 hover:text-emerald-400 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleRefresh} className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-all">
                <RefreshCw className={`w-5 h-5 ${isChartLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </motion.div>
          <div className="h-[1px] w-full bg-gradient-to-r from-emerald-500/50 via-white/5 to-transparent mt-8" />
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PortfolioVault 
                onFocusTicker={setFocusedTicker}
                onOpenSearch={() => {}} 
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
            >
              <ChatView 
                ticker={{ symbol: activeSymbol, name: 'Current Focus', price: chartData.length > 0 ? chartData[chartData.length - 1].close : 0 }}
                initialRationale={aiInitialMessage}
                onBack={() => setActiveTab('pulse')}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Bottom HUD Bar */}
        <div className="h-12 bg-black/40 backdrop-blur-md border-t border-white/5 px-8 flex items-center justify-between">
          <span className="text-[8px] font-black tracking-[0.4em] text-zinc-600 uppercase">System Status: Nominal // Data Latency: {latency}ms</span>
          <span className="text-[8px] font-black tracking-[0.4em] text-emerald-500/40 uppercase">Quantum Neural Sync Active</span>
        </div>
      </main>

      <AnimatePresence>
        {focusedTicker && (
          <ChatView 
            ticker={focusedTicker} 
            initialRationale="Initializing deep analysis of the selected asset..." 
            onBack={() => setFocusedTicker(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
