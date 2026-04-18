"use client";

import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area,
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';
import { AlertCircle, Settings, Zap, Info, ChevronDown, ChevronUp, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Intelligence from '../services/intelligenceService';

interface NexusChartProps {
  height?: number;
  symbol?: string;
  chartData?: any[];
  isLoading?: boolean;
  error?: string | null;
  freshness?: number | null;
}

export default function NexusChart({ height = 400, symbol = 'AAPL', chartData = [], isLoading = false, error = null, freshness = null }: NexusChartProps) {
  console.log("Chart Data Received:", chartData);
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [logicInsight, setLogicInsight] = useState<{ insight: string; logic_audit: string } | null>(null);
  const [sentiment, setSentiment] = useState<{ score: number; rationale: string; model: string; news?: any[]; newsSource?: string } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showEmptyDiagnostic, setShowEmptyDiagnostic] = useState(false);

  // Diagnostic timer for empty data
  useEffect(() => {
    let timer: any;
    if (chartData.length === 0 && !isLoading && !error) {
      timer = setTimeout(() => {
        setShowEmptyDiagnostic(true);
      }, 3000);
    } else {
      setShowEmptyDiagnostic(false);
    }
    return () => clearTimeout(timer);
  }, [chartData, isLoading, error]);

  // Fetch Logic Insight and Sentiment when chart data changes
  useEffect(() => {
    if (chartData.length > 14 && !isLoading) {
      const fetchData = async () => {
        setIsInsightLoading(true);
        setIsSentimentLoading(true);
        
        const [insight, sentimentData] = await Promise.all([
          Intelligence.getLogicInsight(symbol, chartData),
          Intelligence.analyzeSentiment(symbol)
        ]);
        
        setLogicInsight(insight);
        setSentiment(sentimentData);
        
        setIsInsightLoading(false);
        setIsSentimentLoading(false);
      };
      fetchData();
    }
  }, [chartData, symbol, isLoading]);

  // Generate Simulation Data
  const simulationData = Array.from({ length: 20 }).map((_, i) => {
    const base = 150 + Math.sin(i / 2) * 20;
    return {
      time: Date.now() / 1000 - (20 - i) * 86400,
      open: base,
      high: base + 5,
      low: base - 5,
      close: base + Math.random() * 10 - 5,
      isSimulation: true
    };
  });

  const isSimulation = chartData.length === 0 && !isLoading;
  const activeData = isSimulation ? simulationData : chartData;

  // Format data for Recharts
  const formattedData = activeData.map(d => ({
    ...d,
    date: new Date(d.time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    close: d.close,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-4 bg-[#0B0E14] backdrop-blur-xl border border-emerald-500/40 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <div className="text-[10px] font-black text-[#C0C0C0]/60 uppercase tracking-widest mb-2 border-b border-emerald-500/20 pb-1">
            {data.date}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-[10px] font-bold text-[#C0C0C0]/40">OPEN</div>
            <div className="text-[10px] font-mono font-bold text-[#C0C0C0] text-right">₹{data.open.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-[#C0C0C0]/40">HIGH</div>
            <div className="text-[10px] font-mono font-bold text-emerald-400 text-right">₹{data.high.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-[#C0C0C0]/40">LOW</div>
            <div className="text-[10px] font-mono font-bold text-rose-400 text-right">₹{data.low.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-[#C0C0C0]/40">CLOSE</div>
            <div className="text-[10px] font-mono font-bold text-[#C0C0C0] text-right">₹{data.close.toLocaleString()}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full min-h-[400px] neu-sunken rounded-3xl overflow-hidden bg-[#020617]/20 flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        {/* Rate Limit / Note Display */}
        {error && error.startsWith('RATE_LIMIT') && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/60 backdrop-blur-sm p-6">
            <div className="p-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 text-center max-w-sm shadow-[0_0_30px_rgba(249,115,22,0.1)]">
              <Zap className="w-8 h-8 text-orange-500 mx-auto mb-4 animate-pulse" />
              <h4 className="text-orange-500 font-black uppercase tracking-widest text-xs mb-2">System Warning: Quota Limit</h4>
              <p className="text-[10px] text-orange-200/80 font-mono leading-relaxed mb-4">
                {error.replace('RATE_LIMIT: ', '')}
              </p>
              <p className="text-[9px] text-orange-400/60 font-medium italic">
                Please wait 60 seconds or check your daily quota in settings.
              </p>
            </div>
          </div>
        )}

        {/* Simulation Mode Label */}
        {isSimulation && !isLoading && !error && (
          <div className="absolute top-4 right-4 z-20">
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                Simulation Mode: Connecting to Data Stream...
              </span>
            </div>
          </div>
        )}

        {/* Market Sentiment Meter */}
        {sentiment && (
          <div className="absolute top-4 left-16 z-20 flex items-center gap-3 group/sentiment">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Market Sentiment</span>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.score}%` }}
                  className={`h-full ${sentiment.score > 60 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : sentiment.score < 40 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase ${sentiment.score > 60 ? 'text-emerald-500' : sentiment.score < 40 ? 'text-rose-500' : 'text-amber-500'}`}>
                {sentiment.score > 60 ? 'Bullish' : sentiment.score < 40 ? 'Bearish' : 'Neutral'}
              </span>
              <span className="text-[6px] font-bold text-zinc-600 uppercase tracking-tighter">Analyst: GPT-4o</span>
            </div>

            {/* Sentiment Tooltip */}
            <div className="absolute top-full left-0 mt-2 p-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl opacity-0 group-hover/sentiment:opacity-100 transition-all pointer-events-none z-50 w-56 shadow-2xl scale-95 group-hover/sentiment:scale-100 origin-top-left">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Intelligence Source</span>
              </div>
              <p className="text-[9px] text-zinc-400 leading-relaxed">
                This sentiment score was derived from news analyzed via <span className="text-emerald-400 font-bold">{sentiment.newsSource}</span>.
              </p>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[7px] text-zinc-500 italic">
                  Failover Protocol: {sentiment.newsSource?.includes('Alpha') ? 'Primary Link Active' : 'Secondary Link Engaged'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Intelligence Section */}
        {sentiment?.news && sentiment.news.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <div className="p-3 neu-sunken rounded-xl bg-black/40 backdrop-blur-md border border-white/5 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Recent Intelligence</span>
                <span className="text-[6px] font-bold text-zinc-600 uppercase">Source: {sentiment.newsSource}</span>
              </div>
              <div className="space-y-1.5">
                {sentiment.news.map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 group/news">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                    <p className="text-[9px] text-zinc-300 truncate flex-1 font-medium">{n.title}</p>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase opacity-40 group-hover/news:opacity-100 transition-opacity">via {n.source}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pulse Loading Animation */}
        {(isLoading || (chartData.length === 0 && !error && !showEmptyDiagnostic)) && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
                boxShadow: [
                  "0 0 0px rgba(16, 185, 129, 0)",
                  "0 0 40px rgba(16, 185, 129, 0.4)",
                  "0 0 0px rgba(16, 185, 129, 0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full neu-embossed flex items-center justify-center text-emerald-400"
            >
              <Zap className="w-8 h-8" />
            </motion.div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">Pulse Loading...</p>
          </div>
        </div>
      )}

        {error && error !== 'OFFLINE' && (
          <div className="absolute inset-0 flex items-center justify-center bg-neu-bg/95 backdrop-blur-xl z-30 p-8">
            <div className="flex flex-col items-center text-center max-w-md">
              <div className="w-16 h-16 rounded-full neu-embossed flex items-center justify-center mb-6 text-rose-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">Nexus Data Error</h3>
              <div className="p-4 neu-sunken rounded-2xl bg-rose-500/5 border border-rose-500/20 mb-8">
                <p className="text-[10px] font-mono text-rose-400 leading-relaxed">
                  {error}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 neu-button rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]"
              >
                <RefreshCw className="w-4 h-4" />
                Re-Initialize Terminal
              </button>
            </div>
          </div>
        )}

        {showEmptyDiagnostic && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neu-bg/90 backdrop-blur-md z-20 p-8">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 rounded-full neu-embossed flex items-center justify-center mb-6 text-rose-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Data Stream Empty</h3>
              <p className="text-xs text-zinc-500 font-medium mb-8">
                Searching for {symbol}... Status: Check Alpha Vantage Key in Settings or verify Symbol format (e.g., {symbol.includes('.') ? symbol : `${symbol}.NS`}).
              </p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'settings' }))}
                className="w-full py-4 neu-button rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]"
              >
                <Settings className="w-4 h-4" />
                Diagnostic Settings
              </button>
            </div>
          </div>
        )}

        {error === 'OFFLINE' && (
        <div className="absolute inset-0 flex items-center justify-center bg-neu-bg/90 backdrop-blur-md z-20 p-8">
          <div className="flex flex-col items-center text-center max-w-xs">
            <div className="w-16 h-16 rounded-full neu-embossed flex items-center justify-center mb-6 text-amber-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Terminal Offline</h3>
            <p className="text-xs text-zinc-500 font-medium mb-8">
              Alpha Vantage API Key required for real-time daily candlestick data.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'settings' }))}
              className="w-full py-4 neu-button rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]"
            >
              <Settings className="w-4 h-4" />
              Configure Settings
            </button>
          </div>
        </div>
      )}

      {formattedData.length > 0 && !isLoading && (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(30, 41, 59, 0.3)" strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#E0E0E0' }} 
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              orientation="right" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#E0E0E0', fontFamily: 'monospace' }} 
              tickFormatter={(val) => `₹${val.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 1 }} />
            
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorClose)" 
              isAnimationActive={true}
              filter="url(#neonGlow)"
            />

            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#10b981" 
              strokeWidth={1} 
              dot={false} 
              opacity={0.5} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Aurora Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-emerald-500/5 to-transparent opacity-30" />

      {/* Data Freshness Indicator */}
      {freshness && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 z-10">
          <Clock className="w-3 h-3 text-zinc-500" />
          <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
            Live: {new Date(freshness).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      )}

      {/* Logic Insight Box */}
      <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2">
        <AnimatePresence>
          {logicInsight && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 neu-sunken rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">[Logic Insight: Claude 3.7]</span>
                    </div>
                    {isInsightLoading && <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold leading-relaxed">
                    {logicInsight.insight}
                  </p>
                  <p className="text-[9px] text-zinc-500 italic font-mono">
                    Audit: {logicInsight.logic_audit}
                  </p>
                </div>
                <button 
                  onClick={() => setShowLearnMore(!showLearnMore)}
                  className="p-2 neu-button rounded-xl text-zinc-400 hover:text-white transition-all"
                >
                  {showLearnMore ? <ChevronDown className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {showLearnMore && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">RSI (Relative Strength Index)</p>
                        <p className="text-[8px] text-zinc-500 leading-tight">Measures the speed and change of price movements. Above 70 is overbought, below 30 is oversold.</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Neural Logic Audit</p>
                        <p className="text-[8px] text-zinc-500 leading-tight">Claude 3.7 analyzes the mathematical variance between open/close prices to detect momentum shifts.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* Disclaimer Footer Bar */}
      <div className="p-3 bg-black/40 border-t border-white/5 backdrop-blur-md text-center">
        <p className="text-[7px] text-[#C0C0C0] uppercase tracking-[0.3em] font-black">
          Not Financial Advice // Nexus Intelligence Protocol
        </p>
      </div>
    </div>
  );
}
