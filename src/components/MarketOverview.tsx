import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { ALL_TICKERS } from '../constants';
import PulseGauge from './ui/PulseGauge';
import * as Intelligence from '../services/intelligenceService';

interface MarketOverviewProps {
  symbol?: string;
  latency?: number | null;
  newsStatus?: { newsApi: boolean; gnews: boolean; activeSource?: string };
}

export default function MarketOverview({ symbol = 'SBIN.NS', latency = null, newsStatus = { newsApi: false, gnews: false } }: MarketOverviewProps) {
  const [pulseScore, setPulseScore] = useState(50);
  const [pulseModel, setPulseModel] = useState('');
  const [pulseSource, setPulseSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the first few tickers as market overview data
  const marketData = ALL_TICKERS.slice(0, 6);

  useEffect(() => {
    const fetchPulse = async () => {
      setIsLoading(true);
      try {
        const sentiment = await Intelligence.analyzeSentiment(symbol);
        setPulseScore(sentiment.score);
        setPulseModel(sentiment.model);
        setPulseSource(sentiment.newsSource || '');
      } catch (error) {
        console.error("Failed to fetch pulse score:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPulse();
  }, [symbol]);

  return (
    <div className="w-full h-full space-y-6">
      <div className="neu-embossed p-6 rounded-[40px] flex flex-col items-center relative overflow-hidden">
        {pulseModel && (
          <div className="absolute top-4 right-6 px-2 py-0.5 rounded-full bg-blue-500/5 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)] z-20">
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">
              [Mood Engine: {pulseModel}]
            </span>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-neu-bg/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
        <PulseGauge score={pulseScore} label={`${symbol.split('.')[0]} Pulse`} />
      </div>

      <div className="space-y-4">
        {marketData.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full neu-sunken flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">No market data available. Use the search terminal to analyze specific assets.</p>
          </div>
        ) : (
          marketData.map((stock, i) => {
            const isPositive = Math.random() > 0.4; // Simulate some variation
            const change = (Math.random() * 2).toFixed(2);
            
            return (
              <motion.div
                key={`${stock.symbol}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="neu-embossed p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl neu-sunken flex items-center justify-center">
                    <Activity className={`w-5 h-5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">{stock.symbol.split(':')[1] || stock.symbol}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold">₹{(stock.price || 0).toLocaleString()}</p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isPositive ? '+' : '-'}{change}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
