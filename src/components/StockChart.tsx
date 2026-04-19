import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { motion } from 'motion/react';

interface StockChartProps {
  symbol: string;
  data: any[];
  isLoading: boolean;
  onRenderingChange?: (isRendering: boolean) => void;
}

const StockChart: React.FC<StockChartProps> = ({ symbol, data, isLoading, onRenderingChange }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [hoveredPrice, setHoveredPrice] = React.useState<number | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      timeScale: {
        borderColor: '#1f2937',
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: {
          color: '#10b981',
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: '#10b981',
        },
        horzLine: {
          color: '#10b981',
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: '#10b981',
        },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceScaleId: 'right',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Crosshair Sync
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.get(series)) {
        const dataPoint = param.seriesData.get(series) as any;
        setHoveredPrice(dataPoint.close);
      } else {
        setHoveredPrice(null);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      console.log("CHART_DATA_LENGTH:", data.length);
      onRenderingChange?.(true);
      // Lightweight charts expects data in ascending order of time
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
      
      const timer = setTimeout(() => onRenderingChange?.(false), 1000);
      return () => clearTimeout(timer);
    } else if (seriesRef.current && data.length === 0) {
      seriesRef.current.setData([]);
    }
  }, [data, onRenderingChange]);

  const lastPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const displayPrice = hoveredPrice !== null ? hoveredPrice : lastPrice;
  const firstPrice = data.length > 0 ? data[0].close : 0;
  const change = displayPrice - firstPrice;
  const changePercent = firstPrice !== 0 ? (change / firstPrice) * 100 : 0;

  return (
    <div 
      className="relative w-full neu-sunken rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/5" 
      style={{ height: '450px', width: '100%', position: 'relative' }}
    >
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* HUD Overlay */}
      {data.length > 0 && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <motion.div 
            animate={hoveredPrice !== null ? { scale: [1, 1.02, 1], borderColor: ['rgba(255,255,255,0.1)', 'rgba(16,185,129,0.5)', 'rgba(255,255,255,0.1)'] } : {}}
            transition={{ duration: 0.5, repeat: hoveredPrice !== null ? Infinity : 0 }}
            className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{symbol}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${change >= 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tighter">₹{(displayPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {change >= 0 ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {data.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">NO DATA FUEL - CHECK API KEY</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">Nexus Rendering...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockChart;
