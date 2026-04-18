import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  X,
  Briefcase,
  Layers,
  PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import { ALL_TICKERS } from '../constants';
import { kvLoad, kvSave, ensureExchangePrefix, getCleanSymbol } from '../services/intelligenceService';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  quantity: number;
  currentPrice: number;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
}

interface PortfolioVaultProps {
  onFocusTicker: (ticker: any) => void;
  onOpenSearch?: () => void;
}

export default function PortfolioVault({ onFocusTicker, onOpenSearch }: PortfolioVaultProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'holding' | 'watchlist'>('holding');
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const hData = await kvLoad('nexus_holdings', []);
      const wData = await kvLoad('nexus_watchlist', []);
      setHoldings(hData);
      setWatchlist(wData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      kvSave('nexus_holdings', holdings);
      kvSave('nexus_watchlist', watchlist);
    }
  }, [holdings, watchlist, isLoading]);

  const filteredStocks = ALL_TICKERS.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = () => {
    if (!selectedStock) return;
    
    if (addMode === 'holding') {
      if (!buyPrice || !quantity) return;
      const newHolding: Holding = {
        id: Date.now().toString(),
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        buyPrice: parseFloat(buyPrice),
        quantity: parseFloat(quantity),
        currentPrice: selectedStock.price
      };
      setHoldings(prev => [...prev, newHolding]);
      toast.success(`${selectedStock.symbol} secured in holdings.`);
    } else {
      const newItem: WatchlistItem = {
        id: Date.now().toString(),
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        currentPrice: selectedStock.price
      };
      setWatchlist(prev => [...prev, newItem]);
      toast.success(`${selectedStock.symbol} added to watchlist.`);
    }

    setIsAdding(false);
    setSelectedStock(null);
    setBuyPrice('');
    setQuantity('');
  };

  const deleteHolding = (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  const deleteWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
  };

  const totalValue = holdings.reduce((acc, h) => acc + ((h.currentPrice || 0) * (h.quantity || 0)), 0);
  const totalCost = holdings.reduce((acc, h) => acc + ((h.buyPrice || 0) * (h.quantity || 0)), 0);
  const totalPnL = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const isEmpty = holdings.length === 0 && watchlist.length === 0;

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-neu-bg p-6 pb-32">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 rounded-full neu-sunken flex items-center justify-center mb-6 relative">
            <Shield className="w-12 h-12 text-zinc-800" />
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Terminal Empty</h1>
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-8 max-w-[250px]">
            No neural links established. Secure assets or track symbols to begin.
          </p>
          <button 
            onClick={onOpenSearch}
            className="neu-button px-6 py-3 rounded-2xl text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-3"
          >
            <Search className="w-4 h-4" />
            Start Tracking Assets
          </button>
        </div>
      ) : (
        <>
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h1 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Nexus Vault</h1>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setAddMode('watchlist'); setIsAdding(true); }}
                  className="p-3 neu-button rounded-xl text-blue-400"
                  title="Add to Watchlist"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setAddMode('holding'); setIsAdding(true); }}
                  className="p-3 neu-button rounded-xl text-emerald-400"
                  title="Add Holding"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {holdings.length > 0 && (
              <div className="neu-embossed p-8 rounded-[40px] relative overflow-hidden mb-8">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Net Worth</p>
                  <div className="flex items-end gap-3">
                    <h1 className="text-4xl font-black tracking-tighter text-white">₹{totalValue.toLocaleString('en-IN')}</h1>
                    <span className={`font-bold text-sm mb-1.5 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalPnL >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
            )}
          </header>

          <div className="space-y-12">
            {/* LIVE HOLDINGS */}
            {holdings.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Briefcase className="w-3 h-3 text-emerald-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">[LIVE_HOLDINGS]</h2>
                </div>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {holdings.map((holding) => {
                      const pnl = (holding.currentPrice - holding.buyPrice) * holding.quantity;
                      const pnlP = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
                      
                      return (
                        <motion.div
                          key={holding.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="neu-embossed p-4 rounded-2xl flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onFocusTicker({
                            ...ALL_TICKERS.find(t => t.symbol === holding.symbol),
                            symbol: ensureExchangePrefix(holding.symbol, exchange)
                          })}>
                            <div className="w-10 h-10 rounded-xl neu-sunken flex items-center justify-center font-black text-xs text-emerald-400">
                              {getCleanSymbol(holding.symbol).slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="font-black text-sm tracking-tight text-white">{getCleanSymbol(holding.symbol)}</h3>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase">{holding.quantity} Shares @ ₹{holding.buyPrice.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-black text-sm text-white">₹{(holding.currentPrice * holding.quantity).toLocaleString('en-IN')}</p>
                              <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pnl >= 0 ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                                <span>{pnlP ? pnlP.toFixed(1) : "0.0"}%</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHolding(holding.id);
                                toast.error(`${holding.symbol} removed from holdings.`);
                              }}
                              className="p-3 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* WATCHLIST */}
            {watchlist.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Search className="w-3 h-3 text-blue-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">[WATCHLIST]</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {watchlist.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="neu-embossed p-4 rounded-2xl flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onFocusTicker({
                          ...ALL_TICKERS.find(t => t.symbol === item.symbol),
                          symbol: ensureExchangePrefix(item.symbol, exchange)
                        })}>
                          <div className="w-10 h-10 rounded-xl neu-sunken flex items-center justify-center font-black text-xs text-blue-400">
                            {getCleanSymbol(item.symbol).slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-black text-sm tracking-tight text-white">{getCleanSymbol(item.symbol)}</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{item.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-black text-sm text-white">₹{item.currentPrice.toLocaleString()}</p>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Live Price</p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWatchlist(item.id);
                              toast.error(`${item.symbol} removed from watchlist.`);
                            }}
                            className="p-3 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        </>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-neu-bg/95 backdrop-blur-xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-emerald-400">
                {addMode === 'holding' ? 'Secure Asset' : 'Track Symbol'}
              </h2>
              <button onClick={() => setIsAdding(false)} className="w-10 h-10 neu-button rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            {!selectedStock ? (
              <div className="flex-1 flex flex-col">
                <div className="relative mb-6 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      autoFocus
                      type="text"
                      placeholder={`Search ${exchange} Ticker...`}
                      className="w-full neu-sunken rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setExchange(prev => prev === 'NSE' ? 'BSE' : 'NSE')}
                    className="px-4 neu-button rounded-2xl text-xs font-black text-emerald-400"
                  >
                    {exchange}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                  {searchQuery && (
                    <button
                      onClick={() => setSelectedStock({
                        symbol: ensureExchangePrefix(searchQuery, exchange),
                        name: searchQuery,
                        price: 0
                      })}
                      className="w-full p-4 neu-embossed rounded-2xl flex items-center justify-between"
                    >
                      <div className="text-left">
                        <p className="font-black text-emerald-400">Search "{searchQuery}" on {exchange}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">External Protocol</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}

                  {filteredStocks.map(stock => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelectedStock({
                        ...stock,
                        symbol: ensureExchangePrefix(stock.symbol, exchange)
                      })}
                      className="w-full p-4 neu-embossed rounded-2xl flex items-center justify-between"
                    >
                      <div className="text-left">
                        <p className="font-black text-white">{getCleanSymbol(stock.symbol)}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{stock.name}</p>
                      </div>
                      <p className="font-mono text-sm text-emerald-400">₹{stock.price.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 neu-sunken rounded-3xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Selected Asset</p>
                    <p className="text-2xl font-black text-white">{getCleanSymbol(selectedStock.symbol)}</p>
                  </div>
                  <button onClick={() => setSelectedStock(null)} className="text-xs text-emerald-400 font-bold uppercase">Change</button>
                </div>

                {addMode === 'holding' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Buy Price (₹)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full neu-sunken rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 transition-colors font-mono"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full neu-sunken rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 transition-colors font-mono"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={addItem}
                  disabled={addMode === 'holding' && (!buyPrice || !quantity)}
                  className="w-full py-5 neu-button rounded-3xl text-emerald-400 font-black uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  {addMode === 'holding' ? 'Confirm Vault Entry' : 'Add to Watchlist'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
