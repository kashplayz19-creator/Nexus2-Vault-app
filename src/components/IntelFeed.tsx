import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Newspaper, Clock, ExternalLink, ShieldAlert } from 'lucide-react';
import * as Intelligence from '../services/intelligenceService';

interface IntelFeedProps {
  symbol: string;
}

export default function IntelFeed({ symbol }: IntelFeedProps) {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const searchQuery = Intelligence.getCleanSymbol(symbol);
        
        // Try multiple sources
        let allNews: any[] = [];
        
        const registryNews = await Intelligence.getNewsFromRegistry(searchQuery);
        allNews = [...allNews, ...registryNews];
        
        if (allNews.length < 3) {
          const gNews = await Intelligence.getNewsFromGNews(searchQuery);
          allNews = [...allNews, ...gNews];
        }

        setNews(allNews);
      } catch (error) {
        console.error("Failed to fetch intel feed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, [symbol]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-emerald-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Intelligence Feed</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Live Stream</span>
        </div>
      </div>

      <div className="flex-1 neu-sunken rounded-3xl p-4 overflow-y-auto no-scrollbar bg-black/20 backdrop-blur-sm border border-white/5">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-pulse">Decrypting Feeds...</span>
          </div>
        ) : news.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <ShieldAlert className="w-8 h-8 text-zinc-800 mb-3" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              [SYSTEM_STATUS]: SCANNING GLOBAL FEEDS...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, i) => (
              <motion.a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="block p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-emerald-500/20 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 rounded">
                        {item.source || 'Intel'}
                      </span>
                      <div className="flex items-center gap-1 text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase">
                          {new Date(item.publishedAt || item.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-zinc-200 leading-relaxed group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-emerald-400 transition-colors mt-1" />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
