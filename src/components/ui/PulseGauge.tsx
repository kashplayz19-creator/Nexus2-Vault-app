import { motion } from 'motion/react';

interface PulseGaugeProps {
  score: number; // 0-100
  label?: string;
}

export default function PulseGauge({ score, label = "Sentiment" }: PulseGaugeProps) {
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  const getMoodState = (s: number) => {
    if (s <= 20) return { label: '[CAPITULATION]', color: 'text-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]', pulse: true };
    if (s <= 45) return { label: '[BEARISH_TIDE]', color: 'text-amber-500', glow: '', pulse: false };
    if (s <= 55) return { label: '[CONSOLIDATING]', color: 'text-zinc-500', glow: '', pulse: false };
    if (s <= 80) return { label: '[BULLISH_SURGE]', color: 'text-emerald-500', glow: '', pulse: false };
    return { label: '[FRENZY_OVERHEAT]', color: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.6)]', pulse: true };
  };

  const mood = getMoodState(score);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-40 h-20 overflow-hidden">
        {/* Gauge Background */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[10px] border-white/5" />
        
        {/* Gauge Progress */}
        <svg className="absolute top-0 left-0 w-40 h-40 -rotate-180" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray="141.37"
            strokeDashoffset={141.37 - (score / 100) * 141.37}
            className={`${mood.color} transition-all duration-1000 ease-out opacity-40`}
            strokeLinecap="round"
          />
        </svg>

        {/* Needle */}
        <motion.div
          className={`absolute bottom-0 left-1/2 w-0.5 h-16 ${mood.color} origin-bottom -translate-x-1/2`}
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        >
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 ${mood.color} rounded-full ${mood.glow}`} />
        </motion.div>
      </div>

      <div className="mt-2 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-mono font-black ${mood.color}`}>{score}</span>
          <span className="text-[10px] font-mono text-zinc-600">/100</span>
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${mood.color} ${mood.pulse ? 'animate-pulse' : ''}`}>
          {mood.label}
        </p>
        <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
