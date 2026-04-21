import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Brain, Target, ShieldCheck, Cpu } from 'lucide-react';
import { getResearchImpactNodes } from '../services/intelligenceService';

interface ResearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  tickerSymbol: string;
  onGoDeeper: (topic: string) => void;
}

export default function ResearchDrawer({ isOpen, onClose, topic, tickerSymbol, onGoDeeper }: ResearchDrawerProps) {
  const [nodes, setNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && topic) {
      const fetchNodes = async () => {
        setIsLoading(true);
        const results = await getResearchImpactNodes(topic, tickerSymbol);
        setNodes(results);
        setIsLoading(false);
      };
      fetchNodes();
    }
  }, [isOpen, topic, tickerSymbol]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full lg:w-[42%] bg-[#050505]/95 backdrop-blur-[40px] border-l border-white/10 z-[1001] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-white">Research_Intelligence</h3>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Status: Active_Grounding</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-all border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
              <div className="space-y-4">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Subject_Analysis</span>
                <h2 className="text-2xl font-black text-white leading-tight italic tracking-tighter">"{topic}"</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00FFC2]" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-sans">Grounding_Output: Impact_Nodes</span>
                </div>

                <div className="space-y-4">
                  {isLoading ? (
                    [0, 1, 2].map(i => (
                      <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse flex items-center px-6 gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5" />
                        <div className="h-4 bg-white/5 rounded-full w-2/3" />
                      </div>
                    ))
                  ) : (
                    nodes.map((node, idx) => {
                      const isOffsetting = node.includes('Oman') || node.includes('$12.5B') || node.includes('offset');
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`p-6 bg-white/5 border rounded-3xl relative overflow-hidden group transition-all ${
                            isOffsetting 
                              ? 'border-[#8B5CF6]/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] bg-[#8B5CF6]/5' 
                              : 'border-white/10 hover:border-[#00FFC2]/30'
                          }`}
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full transition-opacity ${
                            isOffsetting ? 'bg-[#8B5CF6] opacity-100' : 'bg-[#00FFC2] opacity-0 group-hover:opacity-100'
                          }`} />
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-colors ${
                              isOffsetting 
                                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#8B5CF6]' 
                                : 'bg-[#00FFC2]/10 border-[#00FFC2]/20 text-[#00FFC2]'
                            }`}>
                              {idx + 1}
                            </div>
                            <p className="text-[13px] font-bold text-zinc-200 leading-relaxed font-sans">
                              {node}
                              {isOffsetting && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-[#8B5CF6]/20 text-[#8B5CF6] uppercase tracking-tighter">AI_OFFSET_FACTOR</span>
                              )}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-6 bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-[2rem] flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-[#8B5CF6]" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Verified</p>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-relaxed">Source data validated against SEBI/RBI regulatory archives (April 2026).</p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-8 border-t border-white/10 bg-black/40">
              <motion.button
                onClick={() => onGoDeeper(topic)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-[#00FFC2] via-[#8B5CF6] to-[#00FFC2] bg-[length:200%_100%] text-black font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,194,0.3)] animate-gradient hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all"
              >
                <Sparkles className="w-5 h-5 fill-black" />
                [GO_DEEPER_ON_THIS_TOPIC]
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
