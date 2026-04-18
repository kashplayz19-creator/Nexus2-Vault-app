import { LayoutGrid, Shield, MessageSquare, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'portfolio' | 'vault' | 'concierge' | 'settings';
  onTabChange: (tab: 'portfolio' | 'vault' | 'concierge' | 'settings') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/80 backdrop-blur-xl border-t border-zinc-800/50 pb-8 pt-4 px-8 z-40">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <button 
          onClick={() => onTabChange('portfolio')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'portfolio' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Terminal</span>
          {activeTab === 'portfolio' && <div className="w-4 h-0.5 bg-emerald-400 rounded-full mt-0.5" />}
        </button>
        
        <button 
          onClick={() => onTabChange('vault')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'vault' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <Shield className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Vault</span>
          {activeTab === 'vault' && <div className="w-4 h-0.5 bg-emerald-400 rounded-full mt-0.5" />}
        </button>

        <button 
          onClick={() => onTabChange('concierge')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'concierge' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Concierge</span>
          {activeTab === 'concierge' && <div className="w-4 h-0.5 bg-emerald-400 rounded-full mt-0.5" />}
        </button>

        <button 
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">System</span>
          {activeTab === 'settings' && <div className="w-4 h-0.5 bg-emerald-400 rounded-full mt-0.5" />}
        </button>
      </div>
    </nav>
  );
}
