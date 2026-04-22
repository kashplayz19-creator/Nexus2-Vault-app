import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  ChevronRight, 
  Search, 
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Zap,
  Target
} from 'lucide-react';

interface NewsItem {
  title: string;
  sentiment: string;
  impact: string;
  target: string;
  isGlobal?: boolean;
  isOfficial?: boolean;
  importance: 'high' | 'medium' | 'low';
  macroDriver: string;
}

interface NewsHubProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  onGoDeeper: (topic: string) => void;
}

export default function NewsHub({ isOpen, onClose, symbol, onGoDeeper }: NewsHubProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'portfolio' | 'macro' | 'technical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Global Alpha Events with Impact Factors (Moved from IntelFeedDesktop)
  const globalAlphaEvents: NewsItem[] = [
    { 
      title: "RBI Hawkish Hold: 5.25% Rate Confirmed via $103.16 Oil Reference.", 
      sentiment: "Neutral", 
      impact: "-0.2%", 
      target: "Monetary Policy",
      importance: 'high',
      macroDriver: "RBI policy remains Hawkish Hold at 5.25% as crude oil benchmarks hit $103.16/bbl."
    },
    { 
      title: "India-Oman CEPA: $12.5B Services Opportunity Active.", 
      sentiment: "Bullish", 
      impact: "+3.1%", 
      target: "Tech/Services",
      importance: 'high',
      macroDriver: "Oman CEPA opens up a massive $12.5B services corridor, acting as a crucial volatility offset."
    },
    { 
      title: "SEBI Algo Mandate: 10 OPS Threshold Enforcement.", 
      sentiment: "Bearish", 
      impact: "-0.8%", 
      target: "Market Microstructure",
      importance: 'medium',
      macroDriver: "Strict SEBI oversight on HFT and retail algo execution limits."
    },
    { 
      title: "Interest Rate Hikes: Global Policy Shift indicates 25bps increase.", 
      sentiment: "Bearish", 
      impact: "-1.2%", 
      target: "Financials",
      isGlobal: true,
      importance: 'high',
      macroDriver: "Macroprudential tightening for Indian banks to curb inflation."
    },
    {
      title: "Manufacturing PMI Hits 16-Month High: $NIFTY Integration.",
      sentiment: "Bullish",
      impact: "+1.5%",
      target: "Industrials",
      importance: 'high',
      macroDriver: "Strongest factory output since 2022 driving industrial demand."
    },
    {
      title: "USD/INR Volatility Spike: Neural Hedge Required.",
      sentiment: "Neutral",
      impact: "N/A",
      target: "Currency",
      importance: 'medium',
      macroDriver: "Currency desk reporting high-volume outflows; volatility node active."
    }
  ];

  const filteredNews = useMemo(() => {
    return globalAlphaEvents.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.macroDriver.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        activeFilter === 'all' || 
        (activeFilter === 'portfolio' && (item.title.includes(symbol) || true)) || // Mocking portfolio logic
        (activeFilter === 'macro' && (item.target === 'Monetary Policy' || item.isGlobal)) ||
        (activeFilter === 'technical' && item.target === 'Market Microstructure');
      
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchQuery, symbol]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-2xl flex flex-col pt-20"
        >
          {/* Header */}
          <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between py-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#00FFC2]" />
              <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white italic">Alpha_News_Hub</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <X className="w-6 h-6 text-zinc-400" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="max-w-7xl mx-auto w-full px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'all', label: 'All Intel' },
                  { id: 'portfolio', label: 'Portfolio Only' },
                  { id: 'macro', label: 'Macro Events' },
                  { id: 'technical', label: 'Technical Patterns' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeFilter === filter.id 
                        ? 'bg-[#00FFC2]/10 border-[#00FFC2] text-[#00FFC2]' 
                        : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="relative group max-w-sm w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#00FFC2] transition-colors" />
                <input 
                  type="text"
                  placeholder="SEARCH ALPHA STREAM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[11px] font-mono font-bold text-white outline-none focus:border-[#00FFC2]/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Horizontal Perplexity Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNews.map((item, idx) => {
                  const hasGoldSeal = item.title.includes('RBI') || item.title.includes('SEBI') || item.title.includes('CEPA');
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-8 bg-white/5 backdrop-blur-xl border rounded-[2.5rem] glass-card transition-all duration-500 relative group flex flex-col justify-between min-h-[320px] hover:bg-white/[0.08] ${
                        hasGoldSeal ? 'border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.1)]' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {hasGoldSeal && (
                        <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Gold_Seal</span>
                        </div>
                      )}
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                            item.sentiment === 'Bullish' 
                              ? 'bg-[#00FFC2]/10 text-[#00FFC2]' 
                              : item.sentiment === 'Bearish'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {item.sentiment}
                          </div>
                          <span className="text-[11px] font-mono font-black text-zinc-500">{item.impact}</span>
                        </div>
                        
                        <h3 className="text-xl font-black text-white leading-tight italic tracking-tighter group-hover:text-[#00FFC2] transition-colors">
                          {item.title}
                        </h3>
                        
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                           <div className="flex items-center gap-2 mb-2">
                             <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                             <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest">Jarvis Conclusion</span>
                           </div>
                           <p className="text-[12px] text-zinc-400 italic font-medium leading-relaxed">
                            " {item.macroDriver} "
                           </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-8 mt-4 border-t border-white/5">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{item.target}</span>
                        <button 
                          onClick={() => onGoDeeper(item.title)}
                          className="px-6 py-2.5 rounded-full bg-[#00FFC2]/5 text-[#00FFC2] border border-[#00FFC2]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#00FFC2] hover:text-black transition-all flex items-center gap-2"
                        >
                          Go Deeper <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
