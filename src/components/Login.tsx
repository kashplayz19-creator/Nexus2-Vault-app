import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [key, setKey] = useState('');

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl bg-[#0a0f1e]/40 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20"
        style={{
          boxShadow: '0 0 30px rgba(34, 211, 238, 0.3), 0 0 60px rgba(34, 211, 238, 0.15), inset 0 0 20px rgba(34, 211, 238, 0.1)'
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-white">NEXUS VAULT</h1>
          <p className="text-[10px] text-zinc-500 tracking-widest mt-2 uppercase">System Authorization Required</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="password"
              placeholder="ENTER ACCESS KEY..."
              className="w-full h-14 bg-black/40 border border-cyan-500/20 rounded-2xl pl-12 pr-4 text-xs font-bold tracking-widest text-cyan-400 outline-none focus:border-cyan-500/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <button 
            onClick={() => onLogin()}
            className="w-full h-14 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-2xl text-xs font-black text-cyan-400 uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Unlock Vault
          </button>
        </div>
      </motion.div>
    </div>
  );
}