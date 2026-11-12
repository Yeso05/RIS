import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Sliders, 
  History, 
  BarChart3, 
  Bell, 
  BrainCircuit, 
  Waves,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, alertCount = 2 }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' • ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'decision', label: "Today's Decision", icon: ShieldCheck },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'simulation', label: 'Optimization', icon: Sliders },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
    { id: 'model', label: 'AI Performance', icon: BrainCircuit }
  ];

  return (
    <header className="bg-[#070c16]/95 backdrop-blur-md border-b border-[#182338] sticky top-0 z-50 shadow-lg shadow-black/40">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand & Identity */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-sky-300 p-[1px] shadow-md shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#070c16] rounded-[11px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black tracking-widest text-white">RIS</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                SIMULATION MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-wide">
              Reservoir Intelligence System
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0c1424] p-1 rounded-xl border border-[#1b2a44]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm border border-cyan-500/35 ring-1 ring-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#131f36]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded-full font-mono border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status / Actions */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden sm:block text-slate-400 bg-[#0c1424] px-3 py-1.5 rounded-lg border border-[#1b2a44]">
            {timeStr}
          </div>

          <button
            onClick={() => setActiveTab('simulation')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold font-sans rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition hover:shadow-cyan-400/30"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Try Scenario</span> Simulator
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <div className="lg:hidden border-t border-[#182338] px-4 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none bg-[#09101c]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/35 ring-1 ring-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
