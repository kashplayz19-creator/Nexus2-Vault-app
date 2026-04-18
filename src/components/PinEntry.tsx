import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Shield, Delete } from 'lucide-react';

interface PinEntryProps {
  onUnlock: () => void;
}

export default function PinEntry({ onUnlock }: PinEntryProps) {
  const [pin, setPin] = useState<string>('');
  const controls = useAnimation();

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === '1234') {
        onUnlock();
      } else {
        // Shake animation for wrong PIN
        controls.start({
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.4 }
        });
        setTimeout(() => setPin(''), 500);
      }
    }
  }, [pin, onUnlock, controls]);

  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <div className="flex flex-col items-center justify-between h-full py-16 px-8 bg-gradient-to-b from-[#0a1a14] to-[#050505]">
      {/* Header */}
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-400 fill-emerald-400/20" />
          <h1 className="text-3xl font-bold tracking-tight">
            Nexus <span className="text-emerald-400">Vault</span>
          </h1>
        </div>
        <h2 className="text-xl font-light text-zinc-300">Enter Security PIN</h2>
      </div>

      {/* PIN Display */}
      <motion.div animate={controls} className="flex gap-6 my-12">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full border-2 transition-all duration-300 flex items-center justify-center
              ${pin.length > i 
                ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                : 'border-zinc-700 bg-transparent'}`}
          >
            {pin.length > i && <div className="w-3 h-3 bg-white rounded-full" />}
          </div>
        ))}
      </motion.div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {keypad.map((key, i) => {
          if (key === '') return <div key={i} />;
          
          return (
            <button
              key={i}
              onClick={() => key === 'delete' ? handleDelete() : handleNumberClick(key)}
              className={`h-20 rounded-2xl flex items-center justify-center text-2xl font-medium transition-all active:scale-95
                ${key === 'delete' 
                  ? 'text-emerald-400 hover:bg-emerald-400/10' 
                  : 'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50 text-white'}`}
            >
              {key === 'delete' ? <Delete className="w-8 h-8" /> : key}
            </button>
          );
        })}
      </div>

      <button className="text-emerald-400/70 hover:text-emerald-400 text-sm font-medium mt-8 transition-colors">
        Forgot PIN?
      </button>
    </div>
  );
}
