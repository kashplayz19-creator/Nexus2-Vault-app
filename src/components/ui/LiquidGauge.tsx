import { motion } from 'motion/react';

interface LiquidGaugeProps {
  progress: number; // 0-100
  height?: number;
}

export default function LiquidGauge({ progress, height = 200 }: LiquidGaugeProps) {
  // Color transition from cool blue to hot emerald
  const getColor = (p: number) => {
    if (p < 30) return '#3b82f6'; // Blue
    if (p < 70) return '#10b981'; // Emerald
    return '#34d399'; // Lighter Emerald
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative w-16 rounded-3xl overflow-hidden neu-sunken"
        style={{ height }}
      >
        {/* Liquid Fill */}
        <motion.div
          className="absolute bottom-0 left-0 w-full"
          initial={{ height: 0 }}
          animate={{ height: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ backgroundColor: getColor(progress) }}
        >
          {/* Wave Animation */}
          <motion.div
            className="absolute -top-4 left-0 w-[200%] h-8 opacity-50"
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ 
              background: `radial-gradient(circle at 50% 100%, transparent 40%, ${getColor(progress)} 41%)`,
              backgroundSize: '20px 40px'
            }}
          />
          
          {/* Bubbles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{ bottom: 0, left: `${20 + i * 15}%`, opacity: 0 }}
              animate={{ 
                bottom: '100%', 
                opacity: [0, 1, 0],
                x: [0, (i % 2 === 0 ? 5 : -5)]
              }}
              transition={{ 
                duration: 2 + Math.random(), 
                repeat: Infinity, 
                delay: i * 0.4 
              }}
            />
          ))}
        </motion.div>
      </div>
      <div className="text-center">
        <span className="text-xl font-black text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
