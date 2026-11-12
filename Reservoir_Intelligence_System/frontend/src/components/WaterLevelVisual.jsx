import React from 'react';
import { Droplets, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function WaterLevelVisual({ level_m = 42.5, max_level_m = 50.0, safety_threshold_m = 45.0, floodRisk = "HIGH" }) {
  const percentage = Math.min(100, Math.max(0, (level_m / max_level_m) * 100));
  const safetyThresholdPct = (safety_threshold_m / max_level_m) * 100;
  
  const riskTheme = {
    CRITICAL: { barColor: 'bg-red-500', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', badge: 'text-red-400 bg-red-950/40 border-red-500/30' },
    HIGH: { barColor: 'bg-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', badge: 'text-red-400 bg-red-950/40 border-red-500/30' },
    MODERATE: { barColor: 'bg-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', badge: 'text-amber-400 bg-amber-950/40 border-amber-500/30' },
    LOW: { barColor: 'bg-teal-400', glow: 'shadow-[0_0_15px_rgba(20,184,166,0.2)]', badge: 'text-teal-400 bg-teal-950/40 border-teal-500/30' }
  }[floodRisk] || { barColor: 'bg-teal-400', glow: '', badge: 'text-teal-400 bg-teal-950/40 border-teal-500/30' };

  return (
    <div className="bg-[#0f1520] border border-[#232f45] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
            RESERVOIR CROSS-SECTION
          </span>
          <h4 className="text-sm font-bold text-white font-sans mt-0.5 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-sky-400" />
            Water Level Visual
          </h4>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${riskTheme.badge}`}>
          {level_m.toFixed(1)} m / {max_level_m.toFixed(0)} m
        </span>
      </div>

      {/* Vertical Reservoir Visual */}
      <div className="relative h-44 w-full bg-[#151e2d] rounded-xl border border-[#26354d] overflow-hidden flex flex-col justify-end p-1">
        {/* Background Depth Scale Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none z-10 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between items-center border-b border-dashed border-red-500/40 pb-0.5">
            <span className="text-red-400 font-semibold">50 m — Dam Crest (Max FRL)</span>
            <span className="text-red-400">100%</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-amber-500/40 pb-0.5">
            <span className="text-amber-300">{safety_threshold_m} m — Safety Threshold</span>
            <span className="text-amber-300">{safetyThresholdPct.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700/40 pb-0.5">
            <span className="text-slate-400">35 m — Normal Operating Buffer</span>
            <span>70%</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>0 m — Base</span>
            <span>0%</span>
          </div>
        </div>

        {/* Dynamic Water Volume with smooth gradient */}
        <div 
          className={`w-full rounded-lg transition-all duration-700 relative z-0 ${riskTheme.glow}`}
          style={{
            height: `${percentage}%`,
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.85) 0%, rgba(13, 148, 136, 0.95) 60%, rgba(15, 23, 42, 0.98) 100%)'
          }}
        >
          {/* Surface Ripples line */}
          <div className="w-full h-1 bg-white/40 border-t border-white/60 animate-pulse rounded-t-lg" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#232f45] flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Current Storage Fill:</span>
        <span className="font-bold text-white">{percentage.toFixed(0)}% Capacity</span>
      </div>
    </div>
  );
}
