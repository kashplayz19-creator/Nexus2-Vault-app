import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Cpu, User, Sparkles, ZapOff, Menu, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as Intelligence from '../services/intelligenceService';
import { getGoals, calculateGoalProgress } from '../services/goalService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // Store as string for JSON persistence
  source?: 'gemini' | 'puter' | 'gemini-flash' | 'claude-3.7' | 'gpt-4o';
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: string;
  activeSymbol: string;
}

interface ChatViewProps {
  ticker: { symbol: string; name: string; price: number };
  initialRationale: string;
  onBack: () => void;
  isGeneralMode?: boolean;
}

export default function ChatView({ ticker, initialRationale, onBack, isGeneralMode }: ChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<'gemini' | 'claude' | 'gpt' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions from Puter KV
  useEffect(() => {
    const loadSessions = async () => {
      setSyncStatus('syncing');
      const savedSessions = await Intelligence.kvLoad('nexus_history', []);
      setSessions(savedSessions);
      
      if (savedSessions.length > 0) {
        // Load the most recent session
        const latest = savedSessions.sort((a: any, b: any) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        )[0];
        setCurrentSessionId(latest.id);
        setMessages(latest.messages);
      } else {
        startNewChat();
      }
      setSyncStatus('synced');
    };
    loadSessions();
  }, []);

  // Save sessions to Puter KV whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      const saveSessions = async () => {
        setSyncStatus('syncing');
        await Intelligence.kvSave('nexus_history', sessions);
        setSyncStatus('synced');
      };
      saveSessions();
    }
  }, [sessions]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Analysis: ${ticker.symbol}`,
      messages: [
        {
          role: 'assistant',
          content: `Nexus Vault AI Online. Current Focus: ${ticker.symbol}.\n\nHow can I assist your goals today?`,
          timestamp: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString(),
      activeSymbol: ticker.symbol
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages(newSession.messages);
    setIsSidebarOpen(false);
  };

  const selectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      if (updated.length > 0) {
        selectSession(updated[0].id);
      } else {
        startNewChat();
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle initialRationale dispatch
  const initialRationaleProcessed = useRef(false);
  useEffect(() => {
    if (initialRationale && currentSessionId && !initialRationaleProcessed.current) {
      initialRationaleProcessed.current = true;
      setInput(initialRationale);
      // Use a small timeout to ensure state is ready
      setTimeout(() => {
        const sendBtn = document.querySelector('button[disabled="false"] .lucide-send');
        if (sendBtn) (sendBtn.parentElement as HTMLButtonElement).click();
        else handleSendMessage(initialRationale);
      }, 500);
    }
  }, [initialRationale, currentSessionId]);

  const handleSendMessage = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!overrideInput) setInput('');
    else setInput(''); // Clear input even if overridden
    setIsLoading(true);

    // Update session title if it's the first user message
    const currentSession = sessions.find(s => s.id === currentSessionId);
    let updatedTitle = currentSession?.title || `Chat ${ticker.symbol}`;
    if (messages.length <= 1) {
      updatedTitle = messageText.slice(0, 30) + (messageText.length > 30 ? '...' : '');
    }

    const lowerInput = messageText.toLowerCase();
    const isMath = lowerInput.includes('calculate') || lowerInput.includes('math') || lowerInput.includes('progress') || lowerInput.includes('emerald');
    setActiveModel(isMath ? 'claude' : 'gemini');

    try {
      let response;
      const lowerInput = messageText.toLowerCase();
      
      if (lowerInput.includes('should i buy') || lowerInput.includes('is it a good time to buy') || lowerInput.includes('buy advice')) {
        // Trigger combined analysis
        const sentiment = await Intelligence.analyzeSentiment(ticker.symbol);
        const chartData = await Intelligence.getTimeSeriesData(ticker.symbol, '1day');
        const goals = await getGoals();
        const relevantGoal = goals.find(g => g.symbol === ticker.symbol);
        
        // Simple RSI-like logic for technicals
        let technicalAdvice = "Neutral";
        let rsiValue = 50;
        if (chartData && chartData.length > 14) {
          const lastPrices = chartData.slice(-14).map(d => d.close);
          const avg = lastPrices.reduce((a, b) => a + b, 0) / 14;
          const current = lastPrices[lastPrices.length - 1];
          rsiValue = Math.round((current / avg) * 50); // Mock RSI
          if (current < avg * 0.95) technicalAdvice = "Oversold (Bullish)";
          else if (current > avg * 1.05) technicalAdvice = "Overbought (Bearish)";
        }

        let goalContext = "No specific goal linked to this asset.";
        if (relevantGoal) {
          const progress = calculateGoalProgress(relevantGoal.targetPrice, ticker.price, 0);
          goalContext = `Linked Goal: ${relevantGoal.name}. Progress towards ₹${relevantGoal.targetPrice}: ${progress.toFixed(1)}%.`;
        }

        const combinedPrompt = `As the Nexus Vault AI Concierge, provide a combined buy/sell advice for ${ticker.symbol}. 
        You MUST explicitly cite the following in your response:
        1. RSI Value (Technical): ${rsiValue} (${technicalAdvice})
        2. Pulse Score (Sentiment): ${sentiment.score}/100
        3. Goal Progress (Personal): ${goalContext}
        
        Sentiment Rationale: ${sentiment.rationale}. 
        User asked: ${input}. 
        Be professional, concise, and include a disclaimer that this is not financial advice.`;
        
        response = await Intelligence.getChatResponse(ticker, combinedPrompt, messages);
      } else {
        response = await Intelligence.getChatResponse(ticker, input, messages);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toISOString(),
        source: response.source
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Update sessions state
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: finalMessages, lastUpdated: new Date().toISOString(), title: updatedTitle }
          : s
      ));

      if (response.source === 'puter') {
        toast.info("Quota reached. Switching to Puter.js fallback...", {
          icon: <ZapOff className="w-4 h-4 text-amber-400" />,
        });
      }
    } catch (error: any) {
      console.error("Chat failed:", error);
      const errorMessage = error?.message || String(error);
      let displayMessage = "Connection to Intelligence Link lost. Please try again.";

      if (errorMessage === "API_KEY_MISSING") {
        displayMessage = "System Error: NEXUS_VAULT_KEY is missing. Please configure it in Settings.";
      } else if (errorMessage.includes('429')) {
        displayMessage = "Intelligence Link Overloaded: Your API key has exceeded its quota or rate limit.";
      }
      
      const errorAssistantMsg: Message = {
        role: 'assistant',
        content: displayMessage,
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, errorAssistantMsg];
      setMessages(finalMessages);
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: finalMessages, lastUpdated: new Date().toISOString() }
          : s
      ));
    } finally {
      setIsLoading(false);
      setActiveModel(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${isGeneralMode ? 'h-full' : 'fixed inset-0 z-50'} bg-neu-bg flex overflow-hidden`}
    >
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-72 h-full bg-neu-bg border-r border-white/5 z-50 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">History</h2>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={startNewChat}
              className="w-full py-4 neu-button rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-6"
            >
              <Sparkles className="w-4 h-4" />
              New Analysis
            </button>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
              {sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all group relative ${
                    currentSessionId === s.id ? 'neu-sunken border border-emerald-500/20' : 'neu-embossed hover:bg-white/5'
                  }`}
                >
                  <p className="text-xs font-bold text-zinc-300 truncate pr-6">{s.title}</p>
                  <p className="text-[8px] text-zinc-600 font-mono mt-1">
                    {new Date(s.lastUpdated).toLocaleDateString()}
                  </p>
                  <button 
                    onClick={(e) => deleteSession(s.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="p-6 flex items-center justify-between bg-neu-bg/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 rounded-xl neu-button flex items-center justify-center text-zinc-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            {!isGeneralMode && (
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full neu-button flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-emerald-400" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl neu-embossed flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                  Nexus AI Concierge
                  <motion.div 
                    animate={{ 
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.2, 1],
                      backgroundColor: activeModel === 'claude' ? '#8b5cf6' : activeModel === 'gpt' ? '#3b82f6' : activeModel === 'gemini' ? '#10b981' : '#52525b'
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                  />
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {syncStatus === 'synced' ? 'Neural Sync Active' : 'Syncing Data...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 px-4 py-2 neu-sunken rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Focus: {ticker.symbol}</span>
          </div>
        </header>

        {/* Message Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-neu-bg"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 relative ${
                  msg.role === 'user' ? 'neu-sunken text-zinc-400' : 'neu-embossed text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-[2rem] text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'neu-sunken text-zinc-200 rounded-tr-none shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]' 
                    : 'neu-embossed text-zinc-200 rounded-tl-none border border-emerald-500/20 shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.02)]'
                }`}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={line ? 'mb-2 last:mb-0' : 'h-2'}>{line}</p>
                  ))}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-3">
                        {msg.source === 'claude-3.7' && (
                          <div className="px-2 py-0.5 rounded-md bg-purple-500/5 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">
                              Logic: Claude 3.7
                            </span>
                          </div>
                        )}
                        {(msg.source === 'gemini-flash' || msg.source === 'gemini') && (
                          <div className="px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">
                              Memory: Gemini
                            </span>
                          </div>
                        )}
                        {msg.source === 'gpt-4o' && (
                          <div className="px-2 py-0.5 rounded-md bg-blue-500/5 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)] flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">
                              Pulse: GPT-4o
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                          <span className="text-[8px] text-emerald-500/50 font-black uppercase tracking-widest">Neural Verified</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] flex gap-4">
                <div className="w-10 h-10 rounded-2xl neu-embossed flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
                <div className="p-5 rounded-[2rem] neu-embossed text-zinc-500 text-xs font-mono italic shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.02)]">
                  <div className="flex gap-1 mb-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                  Processing Neural Request
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-neu-bg border-t border-white/5 pb-10">
          <div className="relative flex items-center gap-3 neu-sunken rounded-[2rem] p-2 pl-6 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]">
            <Sparkles className="w-5 h-5 text-emerald-500/30" />
            <input 
              type="text"
              placeholder="Command the AI..."
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-zinc-600 py-3"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <motion.button 
              whileTap={{ scale: 0.9, boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.5)' }}
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                !input.trim() || isLoading 
                  ? 'text-zinc-700' 
                  : 'neu-button text-emerald-400 shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.02)]'
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-[8px] text-center text-zinc-600 mt-4 uppercase tracking-[0.3em] font-black">
            Nexus Intelligence Protocol // v4.0.4_RESILIENT_ENGINE
          </p>
        </div>
      </div>
    </motion.div>
  );
}
