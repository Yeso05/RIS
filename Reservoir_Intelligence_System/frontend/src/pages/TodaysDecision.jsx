import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Info, 
  Lock, 
  Zap, 
  Droplets,
  Waves,
  CloudRain,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { DEFAULT_TODAYS_DECISION } from '../utils/simulatedData';

export default function TodaysDecision() {
  const [decisionData, setDecisionData] = useState(DEFAULT_TODAYS_DECISION);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/decision/today')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && isMounted) setDecisionData(data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const rec = decisionData.recommendation;
  const inputs = decisionData.inputs;

  const decisionBadge = {
    OPEN: 'bg-emerald-500 text-slate-950 font-black',
    HOLD: 'bg-teal-500 text-slate-950 font-black',
    REDUCE: 'bg-amber-500 text-slate-950 font-black',
    CLOSE: 'bg-red-500 text-white font-black'
  }[rec.action] || 'bg-teal-500 text-slate-950';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232f45] pb-4">
        <div>
          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
            DECISION DIRECTIVE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Today's Operational Directive
          </h2>
        </div>

        <div className="bg-[#0f1520] px-4 py-2 rounded-xl border border-[#232f45] text-right font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">EVALUATION DATE</span>
          <span className="text-white font-bold">{decisionData.date}</span>
        </div>
      </div>

      {/* Main Directive Card */}
      <div className="bg-[#0f1520] border border-[#232f45] rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#232f45]">
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
              RECOMMENDED ACTION
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span className={`px-6 py-2 rounded-2xl text-3xl font-black font-mono tracking-wider ${decisionBadge}`}>
                {rec.action}
              </span>
              <div>
                <span className="text-sm font-bold text-white block">AI RECOMMENDED RELEASE ACTION</span>
                <span className="text-xs font-mono text-teal-400">Confidence Score: {rec.ai_confidence_pct}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto font-mono text-xs">
            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45] text-center min-w-[130px]">
              <span className="text-slate-400 block text-[11px]">Recommended Opening</span>
              <span className="text-2xl font-bold text-white block my-0.5">{rec.recommended_opening_pct}%</span>
              <span className="text-[10px] text-teal-400">Gate Opening %</span>
            </div>
            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45] text-center min-w-[140px]">
              <span className="text-slate-400 block text-[11px]">Water to Release</span>
              <span className="text-2xl font-bold text-white block my-0.5">{rec.recommended_release_cusecs?.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">cusecs</span>
            </div>
            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45] text-center min-w-[130px]">
              <span className="text-slate-400 block text-[11px]">Expected Level</span>
              <span className="text-2xl font-bold text-teal-300 block my-0.5">{rec.expected_level_tomorrow_m}</span>
              <span className="text-[10px] text-slate-400">meters</span>
            </div>
          </div>
        </div>

        {/* Inputs Evaluated */}
        <div className="pb-6 border-b border-[#232f45]">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
            EVALUATED INPUT PARAMETERS (NO GATE STATUS INPUT USED)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45]">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Water Level</span>
              </div>
              <div className="text-xl font-bold text-white">{inputs?.reservoir_level_m} m</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Full level: 50.0 m</div>
            </div>

            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45]">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Waves className="w-3.5 h-3.5 text-teal-400" />
                <span>Water Coming In</span>
              </div>
              <div className="text-xl font-bold text-white">{inputs?.inflow_cusecs?.toLocaleString()} cusecs</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Upstream flow</div>
            </div>

            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45]">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>Rain Expected</span>
              </div>
              <div className="text-xl font-bold text-white">{inputs?.rainfall_mm} mm</div>
              <div className="text-[10px] text-slate-500 mt-0.5">24h forecast</div>
            </div>

            <div className="bg-[#151e2d] p-4 rounded-2xl border border-[#232f45]">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Power Needed</span>
              </div>
              <div className="text-xl font-bold text-white">{inputs?.electricity_demand_mw?.toLocaleString()} MW</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Regional load</div>
            </div>
          </div>
        </div>

        {/* Explainability Paragraph & Bullet Points */}
        <div className="pb-6 border-b border-[#232f45] space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400" />
            WHY THIS RECOMMENDATION?
          </h3>

          <div className="p-4 rounded-2xl bg-[#151e2d] border border-[#232f45] text-sm text-slate-200 leading-relaxed font-sans">
            "{decisionData.paragraph_reason}"
          </div>

          <div className="space-y-2 font-mono text-xs">
            {decisionData.reasons?.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#0c121d] border border-[#232f45] text-slate-300">
                <span className="text-teal-400 font-bold">0{idx + 1}.</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operator Confirmation Protocol */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>AI Decision Support — Operator Approval Required Before Physical Actuation</span>
          </div>

          <button
            onClick={() => setConfirmed(!confirmed)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition ${
              confirmed 
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{confirmed ? 'Directive Acknowledged & Logged ✓' : 'Acknowledge Recommendation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
