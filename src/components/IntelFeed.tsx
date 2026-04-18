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

  // Removes everything after the dot (e.g., RELIANCE.BSE -> RELIANCE)
  const cleanSymbol = (s: string) => s.split('.')[0];

  const getSentiment = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('surge') || t.includes('profit') || t.includes('buy') || t.includes('gain') || t.includes('high')) 
      return { label: 'BULLISH', color: 'text-emerald-400' };
    if (t.includes('drop') || t.includes('risk') || t.includes('inflation') || t.includes('fall') || t.includes('loss')) 
      return { label: 'BEARISH', color: 'text-rose-400' };
    return { label: 'NEUTRAL', color: 'text-zinc-500' };
  };

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      console.log(`%c [INTEL_SCAN] Initiating scan for: ${symbol}`, "color: #10b981; font-weight: bold;");
      try {
        const searchQuery = cleanSymbol(symbol);
        
        // Try multiple sources
        let allNews: any[] = [];
        
        // 1. NewsAPI.ai (Registry)
        const registryNews = await Intelligence.getNewsFromRegistry(searchQuery);
        if (registryNews.length > 0) {
          console.log(`[INTEL_SCAN] Alpha Source (NewsAPI.ai) returned ${registryNews.length} articles.`);
          allNews = [...allNews, ...registryNews];
        }
        
        // 2. GNews
        if (allNews.length < 3) {
          const gNews = await Intelligence.getNewsFromGNews(searchQuery);
          if (gNews.length > 0) {
            console.log(`[INTEL_SCAN] Beta Source (GNews) returned ${gNews.length} articles.`);
            allNews = [...allNews, ...gNews];
          }
        }

        // 3. NewsData.io
        if (allNews.length < 3) {
          const newsData = await Intelligence.getNewsFromNewsData(searchQuery);
          if (newsData.length > 0) {
            console.log(`[INTEL_SCAN] Gamma Source (NewsData.io) returned ${newsData.length} articles.`);
            allNews = [...allNews, ...newsData];
          }
        }

        // 4. FINAL FALLBACK: AI Search (Puter.js)
        if (allNews.length === 0) {
          console.warn(`[INTEL_SCAN] All API sources failed. Triggering AI Search Fallback...`);
          const aiNews = await Intelligence.getNewsFromAISearch(searchQuery);
          if (aiNews.length > 0) {
            console.log(`[INTEL_SCAN] AI Search returned ${aiNews.length} articles.`);
            allNews = aiNews;
          }
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
          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">
            {isLoading ? 'Scanning...' : news.length > 0 ? `Gamma Active (${news[0].source})` : 'Gamma Standby'}
          </span>
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
            {news.map((article, i) => {
              const sentiment = getSentiment(article.title);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="neu-embossed p-4 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${sentiment.color}`}>
                      {sentiment.label} // Gamma
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {(article.publishedAt || article.date || new Date().toISOString()).split('T')[0]}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold leading-tight text-zinc-200 group-hover:text-white transition-colors">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-500 font-bold uppercase underline hover:text-emerald-400 transition-colors"
                    >
                      Read Full Intel
                    </a>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
                      Source: {article.source || 'Intel'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
