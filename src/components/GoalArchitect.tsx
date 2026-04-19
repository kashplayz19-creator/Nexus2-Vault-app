import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, TrendingUp, Calculator, X, Brain, RefreshCw } from 'lucide-react';
import { getGoals, saveGoal, deleteGoal, calculateSharesNeeded, calculateGoalProgress } from '../services/goalService';
import * as Intelligence from '../services/intelligenceService';
import { toast } from 'sonner';
import LiquidGauge from './ui/LiquidGauge';

interface GoalArchitectProps {
  activeSymbol?: string;
}

export default function GoalArchitect({ activeSymbol = 'SBIN.NS' }: GoalArchitectProps) {
  const [goals, setGoals] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [symbol, setSymbol] = useState(activeSymbol);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [emeraldAnalyses, setEmeraldAnalyses] = useState<Record<string, { text: string; loading: boolean }>>({});

  useEffect(() => {
    setSymbol(activeSymbol);
  }, [activeSymbol]);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const data = await getGoals();
    setGoals(data);
    
    // Fetch latest prices for all goal symbols
    const prices: Record<string, number> = {};
    for (const goal of data) {
      if (!prices[goal.symbol]) {
        prices[goal.symbol] = await Intelligence.getLatestPrice(goal.symbol);
      }
    }
    setCurrentPrices(prices);
  };

  const handleAddGoal = async () => {
    if (!name || !targetPrice || !symbol) return;
    await saveGoal({ name, targetPrice: parseFloat(targetPrice), symbol });
    setIsAdding(false);
    setName('');
    setTargetPrice('');
    loadGoals();
    toast.success('Goal secured in the vault.');
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
    loadGoals();
    toast.error('Goal purged.');
  };

  const handleEmeraldAnalysis = async (goal: any, currentPrice: number) => {
    setEmeraldAnalyses(prev => ({ ...prev, [goal.id]: { text: '', loading: true } }));
    try {
      const analysis = await Intelligence.getEmeraldAnalysis(goal, currentPrice);
      setEmeraldAnalyses(prev => ({ ...prev, [goal.id]: { text: analysis, loading: false } }));
      toast.success('Precision math core synced.');
    } catch (error) {
      setEmeraldAnalyses(prev => ({ ...prev, [goal.id]: { text: 'Analysis failed.', loading: false } }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Goal Architect</h2>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 neu-button rounded-xl text-emerald-400 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {goals.map((goal) => {
            const currentPrice = currentPrices[goal.symbol] || 0;
            const sharesNeeded = calculateSharesNeeded(goal.targetPrice, currentPrice);
            const progress = calculateGoalProgress(goal.targetPrice, currentPrice, 0); // Assuming 0 holdings for now
            
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="neu-embossed p-6 rounded-[40px] flex items-center gap-8 relative group"
              >
                <div className="shrink-0">
                  <LiquidGauge progress={progress} height={160} />
                </div>

                <div className="flex-1 space-y-4">
                  <button 
                    onClick={() => handleDelete(goal.id)}
                    className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Acquisition</p>
                    <h3 className="text-xl font-black text-white">{goal.name}</h3>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Required Capital</p>
                      <p className="text-2xl font-black text-emerald-400">₹{(goal.targetPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Asset: {goal.symbol}</p>
                      <p className="text-sm font-mono text-zinc-400">₹{(currentPrice || 0).toLocaleString()}/sh</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-zinc-400">Shares Needed:</span>
                    </div>
                    <span className="text-lg font-black text-white">{(sharesNeeded || 0).toLocaleString()}</span>
                  </div>

                  {/* Emerald Analysis Section */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Emerald Analysis</span>
                      </div>
                      <button 
                        onClick={() => handleEmeraldAnalysis(goal, currentPrice)}
                        disabled={emeraldAnalyses[goal.id]?.loading}
                        className="px-3 py-1.5 neu-button rounded-lg text-[8px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2"
                      >
                        {emeraldAnalyses[goal.id]?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                        {emeraldAnalyses[goal.id]?.text ? 'Re-Analyze' : 'Run Precision Math'}
                      </button>
                    </div>
                    
                    {emeraldAnalyses[goal.id]?.text && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 neu-sunken rounded-2xl bg-purple-500/5 border border-purple-500/10"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-0.5 rounded-full bg-purple-500/5 border border-purple-500/40 shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                            <span className="text-[7px] font-black text-purple-400 uppercase tracking-widest">[Logic: Claude 3.7]</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium italic">
                          "{emeraldAnalyses[goal.id].text}"
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-neu-bg/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="neu-embossed p-8 rounded-[40px] w-full max-w-md space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter text-white">New Objective</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Item Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tesla Model 3"
                  className="w-full neu-sunken rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Target Price (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full neu-sunken rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 transition-all font-mono"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Asset Symbol</label>
                <input 
                  type="text" 
                  placeholder="e.g. SBIN.NS"
                  className="w-full neu-sunken rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 transition-all font-mono"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <button 
              onClick={handleAddGoal}
              className="w-full py-5 neu-button text-emerald-400 font-black uppercase tracking-widest text-sm rounded-3xl"
            >
              Architect Goal
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
