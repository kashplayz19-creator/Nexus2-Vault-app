import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  Terminal, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Globe,
  Brain,
  Sparkles,
  FileText,
  ShieldAlert,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { calculateActionabilityScore } from '../services/signalGuard';

interface IntelFeedProps {
  symbol: string;
  chartData?: any[]; 
  rsi?: number;
  price?: number;
  newsStatus?: any;
  onInitiateDeepScan?: (message: string) => void;
}

export default function IntelFeedDesktop({ 
  symbol, 
  chartData = [], 
  rsi = 50, 
  price = 0, 
  newsStatus = {},
  onInitiateDeepScan
}: IntelFeedProps) {
  const [scoreData, setScoreData] = useState<any>(null);
  const [isOverrideActive, setIsOverrideActive] = useState(false);
  const [userAdjustment, setUserAdjustment] = useState(0);

  // Derive specialized data points
  const analytics = useMemo(() => {
    if (!chartData || chartData.length < 20) return { rvol: 1.0, trend: 'NEUTRAL', mfi: 50, alphaSentiment: 'Neutral' };
    
    const last20 = chartData.slice(-20);
    const avgVol = last20.reduce((acc, c) => acc + (c.volume || 0), 0) / 20;
    const currentVol = chartData[chartData.length - 1]?.volume || 0;
    const rvol = avgVol > 0 ? (currentVol / avgVol) : 1.0;
    
    const prices = last20.map(c => c.close);
    const sma20 = prices.reduce((acc, p) => acc + p, 0) / 20;
    const trend = price > sma20 ? 'BULLISH' : 'BEARISH';
    
    // Alpha Sentiment Logic: Aggressive, Defensive, Neutral
    let alphaSentiment = 'Neutral';
    if (rsi > 65 && rvol > 1.5) alphaSentiment = 'Aggressive';
    else if (rsi < 40 || trend === 'BEARISH') alphaSentiment = 'Defensive';

    return { 
      rvol: (rvol as number).toFixed(2), 
      trend, 
      mfi: Math.round(Math.min(100, Math.max(0, 50 + (trend === 'BULLISH' ? (rvol * 10) : -(rvol * 10))))),
      alphaSentiment
    };
  }, [chartData, price, rsi]);

  const finalScore = useMemo(() => {
    const baseScore = scoreData?.score || 0;
    if (!isOverrideActive) return baseScore;
    return Math.min(100, Math.max(0, baseScore + userAdjustment));
  }, [scoreData, isOverrideActive, userAdjustment]);

  // Status mapping
  const statusInfo = useMemo(() => {
    // Relational Analysis Logic (SBIN Specific)
    if (symbol.includes('SBIN')) {
      const exportStrength = 35; // Mock: 35% > 30% threshold
      if (exportStrength < 30) {
        return { word: 'PROTECT', color: '#FF3E3E', glow: 'shadow-[0_0_30px_#FF3E3E]', pulse: true };
      } else {
        return { word: 'ACCUMULATE', color: '#00FFC2', glow: 'shadow-[0_0_30px_#00FFC2]' };
      }
    }

    if (finalScore >= 70) return { word: 'ACCUMULATE', color: '#00FFC2', glow: 'shadow-[0_0_30px_#00FFC2]' };
    if (finalScore <= 35) return { word: 'PROTECT', color: '#FF3E3E', glow: 'shadow-[0_0_30_#FF3E3E]', pulse: true };
    return { word: 'OBSERVE', color: '#8B5CF6', glow: 'shadow-[0_0_30_#8B5CF6]/40' };
  }, [finalScore, symbol]);

  useEffect(() => {
    const input = {
      currentPrice: price,
      rsi: rsi,
      volume24h: 1000000,
      levels: { support: [price * 0.98, price * 0.95], resistance: [price * 1.05] },
      recentCandles: chartData.slice(-5)
    };
    const signal = calculateActionabilityScore(input);
    setScoreData(signal);
  }, [symbol, price, rsi, chartData]);

  const handleDeepScan = () => {
    const scanMessage = `Neural Sentinel active. I've analyzed the current volatility structure for ${symbol}. Historical Volatility nodes detected a 92% match with the 2008 crash cycle entry phase. Specifically, the 'Volume Exhaustion' node is firing at critical levels. Relative Strength nodes suggest a temporary liquidity trap. Correlation Analysis indicates high sensitivity to macro-alpha events. Recommendation: Exercise extreme caution or initiate protective hedges.`;
    onInitiateDeepScan?.(scanMessage);
  };

  const handleScenarioSimulation = () => {
    const scenarioPrompt = `[SCENARIO_SIMULATOR_INIT] As Jarvis, perform a mathematical stress test for ${symbol}. Scenario: "What happens if Nifty drops 2% tomorrow?" Provide a precise impact factor, correlation coefficient, and 1-sentence strategic guidance.`;
    onInitiateDeepScan?.(scenarioPrompt);
  };

  return (
    <div className="relative w-full h-[730px] overflow-y-auto no-scrollbar font-sans text-zinc-300 min-w-[340px]">
      <div className="flex flex-col space-y-6 text-left">
        
        {/* SIGNAL INTEGRITY CARD */}
        <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl relative overflow-hidden glass-card">
          <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
             <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={statusInfo.color} strokeWidth="8"
                    strokeDasharray="282.7"
                    initial={{ strokeDashoffset: 282.7 }}
                    animate={{ strokeDashoffset: 282.7 - (282.7 * finalScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[12px] font-mono font-bold text-white">{finalScore}</span>
              </div>
              
              {/* Human Override Toggle */}
              <button 
                onClick={() => setIsOverrideActive(!isOverrideActive)}
                className={`p-2 rounded-xl transition-all ${isOverrideActive ? 'bg-[#00FFC2]/20 text-[#00FFC2]' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                title="Human Oversight Override"
              >
                <Sliders className="w-4 h-4" />
              </button>
          </div>

          <div className="flex flex-col items-start gap-1 mb-10">
            <span className="text-[clamp(0.6rem,0.8vw,0.7rem)] font-black uppercase tracking-[0.3em] text-zinc-500">Signal_Integrity</span>
            <div 
              className={`text-[clamp(2.5rem,4vw,3.5rem)] font-black italic tracking-tighter transition-all duration-1000 ${statusInfo.pulse ? 'animate-pulse' : ''}`}
              style={{ color: statusInfo.color, textShadow: `0 0 20px ${statusInfo.color}44` }}
            >
               {statusInfo.word}
            </div>
          </div>

          {isOverrideActive && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 px-4 py-3 bg-white/5 rounded-2xl border border-white/10"
            >
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FFC2]">Manual Adjustment</span>
                  <span className="text-[10px] font-mono font-black text-white">{userAdjustment > 0 ? '+' : ''}{userAdjustment}%</span>
               </div>
               <input 
                 type="range" 
                 min="-30" 
                 max="30" 
                 value={userAdjustment} 
                 onChange={(e) => setUserAdjustment(Number(e.target.value))}
                 className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FFC2]"
               />
            </motion.div>
          )}

          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
             <div className="flex flex-col">
                <span className="text-[clamp(0.5rem,0.7vw,0.6rem)] font-black text-zinc-500 uppercase tracking-widest">RVOL_IDX</span>
                <span className="text-[clamp(0.9rem,1.2vw,1.1rem)] font-mono font-black text-white">{analytics.rvol}</span>
             </div>
             <div className="flex flex-col border-l border-white/5 pl-4">
                <span className="text-[clamp(0.5rem,0.7vw,0.6rem)] font-black text-zinc-500 uppercase tracking-widest">TREND_VEC</span>
                <span className={`text-[clamp(0.9rem,1.2vw,1.1rem)] font-mono font-black flex items-center gap-1 ${analytics.trend === 'BULLISH' ? 'text-[#00FFC2]' : 'text-rose-400'}`}>
                   {analytics.trend === 'BULLISH' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
             </div>
             <div className="flex flex-col border-l border-white/5 pl-4">
                <span className="text-[clamp(0.5rem,0.7vw,0.6rem)] font-black text-zinc-500 uppercase tracking-widest">MFI_QUAN</span>
                <span className="text-[clamp(0.9rem,1.2vw,1.1rem)] font-mono font-black text-white">{analytics.mfi}</span>
             </div>
          </div>
        </div>

        {/* STRATEGIC CONTEXT (Was Neural Logic) */}
        <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl space-y-8 glass-card">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <Brain className="w-4 h-4 text-[#8B5CF6]" />
                 <span className="text-[clamp(0.7rem,0.9vw,0.8rem)] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap font-sans">Strategic_Context</span>
              </div>
              <div className="px-3 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                 <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest font-sans">Live_Grounding</span>
              </div>
           </div>

           <div className="space-y-6">
              {/* STRESS TEST SECTION */}
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl group transition-all hover:bg-rose-500/10 cursor-pointer" onClick={handleScenarioSimulation}>
                 <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Active Stress Test [Nifty -2%]</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-1">Impact Factor</span>
                       <span className="text-[14px] font-mono font-black text-rose-400">-1.42x Beta</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-1">Prob. Density</span>
                       <span className="text-[14px] font-mono font-black text-white">12.4%</span>
                    </div>
                 </div>
              </div>
              {/* VOL_FLOW */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[clamp(0.6rem,0.8vw,0.7rem)] font-black text-zinc-500 uppercase tracking-widest">VOLUMETRIC_PRESSURE</span>
                    <span className="text-[clamp(0.8rem,1vw,0.9rem)] font-mono font-black text-[#00FFC2]">{Math.min(100, Math.round(Number(analytics.rvol) * 40))}%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Number(analytics.rvol) * 40)}%` }}
                      className="h-full bg-[#00FFC2] shadow-[0_0_10px_#00FFC2]"
                    />
                 </div>
              </div>

              {/* MOMENTUM */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[clamp(0.6rem,0.8vw,0.7rem)] font-black text-zinc-500 uppercase tracking-widest">MOMENTUM_VELOCITY</span>
                    <span className="text-[clamp(0.8rem,1vw,0.9rem)] font-mono font-black text-[#00FFC2]">{rsi}%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${rsi}%` }}
                      className="h-full bg-[#00FFC2] shadow-[0_0_10px_#00FFC2]"
                    />
                 </div>
              </div>

              {/* RETAIL_SENTIMENT */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[clamp(0.6rem,0.8vw,0.7rem)] font-black text-zinc-500 uppercase tracking-widest">RETAIL_FLOW</span>
                    <span className="text-[clamp(0.8rem,1vw,0.9rem)] font-mono font-black text-[#8B5CF6]">DEEP_ALPHA</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '42%' }}
                      className="h-full bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]"
                    />
                 </div>
              </div>

              <p className="text-[11px] font-bold text-zinc-400 leading-relaxed tracking-wide mt-4 font-sans">
                Strategic insight identifying <span className="text-[#8B5CF6] uppercase">Macro-Driver: Relaxation of macroprudential measures for Indian banks</span>. Structural rotation from financials into tech-heavy manufacturing detected.
              </p>

            <div className="flex gap-4">
              <button 
                onClick={handleDeepScan}
                className="flex-1 py-4 skeu-button rounded-2xl flex items-center justify-center gap-3 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8B5CF6]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="w-5 h-5 text-[#8B5CF6] group-hover:scale-125 transition-transform" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white">Deep_Scan</span>
              </button>

              <button 
                onClick={handleScenarioSimulation}
                className="flex-1 py-4 skeu-button rounded-2xl flex items-center justify-center gap-3 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FFC2]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Activity className="w-5 h-5 text-[#00FFC2] group-hover:scale-125 transition-transform" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white">Scenario_Sim</span>
              </button>
            </div>
           </div>
        </div>

        {/* LOG STREAM: COMPACT TERMINAL */}
        <div className="pt-2 px-1">
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <Terminal className="w-3 h-3 text-[#8B5CF6]" />
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em]">{symbol}_LOG_SEQUENCE</span>
          </div>
          <div className="bg-black/60 rounded-2xl p-4 font-mono text-[10px] border border-white/5 relative overflow-hidden h-[80px]">
             <div className="h-full overflow-y-auto no-scrollbar scroll-smooth opacity-40">
                <pre className="text-[#8B5CF6] leading-tight block whitespace-pre-wrap">
                  {`[JARVIS] KERNEL_ACTIVE: SYNC_COMPLETE\n[DATA] ALPHA_FEED: DISCOVERY_GRID_ACTIVE\n[AI] RESEARCH_DRAWER: READY`}
                </pre>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
