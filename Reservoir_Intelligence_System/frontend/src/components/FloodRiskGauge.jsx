import React from 'react';

export default function FloodRiskGauge({ riskLevel = "MEDIUM", scorePct = 52 }) {
  // Configs based on risk level
  const configs = {
    LOW: {
      color: "#10b981", // Emerald
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-400",
      description: "Normal Operating Margin. No Spillway Surge Risk."
    },
    MEDIUM: {
      color: "#f59e0b", // Amber
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
      description: "Elevated Inflow / Level. Pre-spill Monitoring Active."
    },
    HIGH: {
      color: "#ef4444", // Red
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      description: "Critical Overflow / Flood Alert. Controlled Discharge Required."
    }
  };

  const current = configs[riskLevel] || configs.MEDIUM;
  
  // Calculate SVG arc parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 240 degrees (from -210 to 30 deg)
  const strokeDashoffset = circumference - (scorePct / 100) * (circumference * 0.75);

  return (
    <div className={`p-4 rounded-lg border ${current.borderColor} ${current.bgColor} flex flex-col items-center text-center relative overflow-hidden`}>
      <div className="flex items-center justify-between w-full mb-2 text-xs font-mono">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">FLOOD RISK INDEX</span>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${current.borderColor} ${current.textColor} bg-slate-900/60`}>
          {riskLevel} RISK
        </span>
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center my-1">
        <svg className="w-full h-full transform -rotate-135" viewBox="0 0 120 120">
          {/* Background Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference * 0.75}
            strokeLinecap="round"
          />
          {/* Active Risk Gauge Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={current.color}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-white">{scorePct}%</span>
          <span className={`font-mono text-[10px] uppercase font-bold ${current.textColor}`}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-300 font-mono mt-1 leading-snug">
        {current.description}
      </p>
    </div>
  );
}
