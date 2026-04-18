import { Activity, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemHealthCardProps {
  latency: number | null;
  newsStatus: { newsApi: boolean; gnews: boolean; newsData?: boolean; activeSource?: string };
  avStatus?: string;
  pulseSource?: string;
  isRendering?: boolean;
  onRefresh?: () => void;
}

export default function SystemHealthCard({ latency, newsStatus, avStatus = 'ACTIVE', pulseSource, isRendering, onRefresh }: SystemHealthCardProps) {
  const isLatencyLow = latency !== null && latency < 100;
  const isLatencyHigh = latency !== null && latency > 150;

  return (
    <motion.div 
      animate={isLatencyLow ? { 
        borderColor: ['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.4)', 'rgba(16,185,129,0.1)'],
        boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 15px rgba(16,185,129,0.2)', '0 0 0px rgba(16,185,129,0)']
      } : isLatencyHigh ? {
        borderColor: ['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.4)', 'rgba(245,158,11,0.1)'],
        boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 15px rgba(245,158,11,0.2)', '0 0 0px rgba(245,158,11,0)']
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={`neu-embossed p-6 rounded-3xl bg-[#0B0E14] relative z-[100] transition-all duration-500 border ${
        isLatencyLow ? 'border-emerald-500/40' : 
        isLatencyHigh ? 'border-amber-500/40' : 
        'border-white/5'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isLatencyLow ? 'text-emerald-400' : isLatencyHigh ? 'text-amber-400' : 'text-zinc-500'}`} />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Health</p>
        </div>
        <button 
          onClick={onRefresh}
          className="p-1.5 neu-button rounded-lg text-zinc-600 hover:text-emerald-400 transition-all"
          title="Re-ping Puter.js Server"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-2">
        {/* Line 1: NEXUS_LINK */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${latency !== null ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}
            />
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">NEXUS_LINK:</span>
          </div>
          {latency !== null ? (
            <span className={`text-[10px] font-mono font-black ${isLatencyLow ? 'text-emerald-400' : isLatencyHigh ? 'text-amber-400' : 'text-white'}`}>
              {latency}ms
            </span>
          ) : (
            <span className="text-[10px] font-mono font-black text-amber-500 animate-pulse">SCANNING...</span>
          )}
        </div>

        {/* Line 2: INTEL_ALPHA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pulseSource === 'Alpha (NewsAPI.ai)' && <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse" />}
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">INTEL_ALPHA:</span>
          </div>
          <span className={`text-[10px] font-mono font-black uppercase ${newsStatus.newsApi ? 'text-emerald-500' : 'text-rose-900/50'}`}>
            {newsStatus.newsApi ? '[ACTIVE]' : '[KEY_REQUIRED]'}
          </span>
        </div>

        {/* Line 3: INTEL_GAMMA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pulseSource === 'Gamma (NewsData.io)' && <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse" />}
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">INTEL_GAMMA:</span>
          </div>
          <span className={`text-[10px] font-mono font-black uppercase ${newsStatus.newsData ? 'text-emerald-500' : 'text-rose-900/50'}`}>
            {newsStatus.newsData ? '[ACTIVE]' : '[KEY_REQUIRED]'}
          </span>
        </div>

        {/* Line 4: DATA_FUEL */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-3 h-3 transition-all duration-300 ${isRendering ? 'text-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : 'text-zinc-700'}`} />
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">DATA_FUEL:</span>
          </div>
          <span className={`text-[10px] font-mono font-black uppercase ${
            avStatus === 'STABLE' ? 'text-emerald-500' : 
            avStatus === 'QUALITY_ISSUE' ? 'text-amber-500' : 
            'text-rose-900/50'
          } ${isRendering ? 'animate-pulse' : ''}`}>
            {avStatus === 'STABLE' ? '[STABLE]' : avStatus === 'QUALITY_ISSUE' ? '[FUEL_QUALITY]' : '[KEY_REQUIRED]'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[7px] font-black text-zinc-700 uppercase tracking-[0.2em]">Visual Command HUD</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
          <span className="text-[7px] font-bold text-zinc-800 uppercase">v4.0.7_OMEGA</span>
        </div>
      </div>
    </motion.div>
  );
}
