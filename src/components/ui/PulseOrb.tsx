import { motion } from 'motion/react';

interface PulseOrbProps {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'noise';
  size?: 'sm' | 'md' | 'lg';
}

export default function PulseOrb({ sentiment, size = 'md' }: PulseOrbProps) {
  const colors = {
    Bullish: 'bg-[#00FFC2] shadow-[0_0_30px_#00FFC2]',
    Bearish: 'bg-rose-500 shadow-[0_0_30px_#f43f5e]',
    Neutral: 'bg-zinc-500 shadow-[0_0_30px_#71717a]',
    noise: 'bg-zinc-700 shadow-[0_0_20px_#3f3f46]'
  };

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-12 h-12',
    lg: 'w-[250px] h-[250px] md:w-32 md:h-32'
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute rounded-full blur-2xl ${colors[sentiment] || colors.noise}`}
        style={{ width: '150%', height: '150%' }}
      />
      
      {/* Core Orb */}
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`${sizes[size]} rounded-full border border-white/20 z-10 ${colors[sentiment] || colors.noise}`}
      />
      
      {/* Internal Glint */}
      <div className="absolute top-[15%] left-[15%] w-[25%] h-[25%] rounded-full bg-white/40 blur-[1px] z-20" />
    </div>
  );
}
