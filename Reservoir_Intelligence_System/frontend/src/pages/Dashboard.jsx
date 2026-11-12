import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Waves, 
  CloudRain, 
  Zap, 
  Info,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import WaterLevelVisual from '../components/WaterLevelVisual';
import { 
  DEFAULT_CURRENT_CONDITIONS, 
  DEFAULT_TODAYS_DECISION, 
  DEFAULT_PREDICTIONS 
} from '../utils/simulatedData';

export default function Dashboard({ setActiveTab, reservoirConfig }) {
  const [current, setCurrent] = useState(DEFAULT_CURRENT_CONDITIONS);
  const [decision, setDecision] = useState(DEFAULT_TODAYS_DECISION);
  const [predictions, setPredictions] = useState(DEFAULT_PREDICTIONS);
  const [isLiveApi, setIsLiveApi] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [resCurr, resDec, resPred] = await Promise.all([
          fetch('/api/current-conditions'),
          fetch('/api/decision/today'),
          fetch('/api/predictions')
        ]);

        if (!resCurr.ok || !resDec.ok || !resPred.ok) {
          throw new Error('One or more dashboard data requests failed.');
        }

        const dataCurr = await resCurr.json();
        const dataDec = await resDec.json();
        const dataPred = await resPred.json();

        if (isMounted) {
          setCurrent(dataCurr);
          setDecision(dataDec);
          setPredictions(dataPred.predictions || DEFAULT_PREDICTIONS);
          setIsLiveApi(true);
        }
      } catch (error) {
        console.error('Unable to load dashboard data.', error);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const rec = decision.recommendation;
  const floodRisk = decision.assessment?.flood_risk || "HIGH";

  const decisionTheme = {
    OPEN: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      badge: 'bg-emerald-500 text-slate-950',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]'
    },
    HOLD: {
      bg: 'bg-teal-500/10 border-teal-500/30',
      badge: 'bg-teal-500 text-slate-950',
      text: 'text-teal-400',
      glow: 'shadow-[0_0_30px_rgba(20,184,166,0.15)]'
    },
    REDUCE: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      badge: 'bg-amber-500 text-slate-950',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]'
    },
    CLOSE: {
      bg: 'bg-red-500/10 border-red-500/30',
      badge: 'bg-red-500 text-white',
      text: 'text-red-400',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]'
    }
  }[rec.action] || { bg: 'bg-teal-500/10 border-teal-500/30', badge: 'bg-teal-500 text-slate-950', text: 'text-teal-400', glow: '' };

  const riskTheme = {
    CRITICAL: { badge: 'bg-red-500 text-white', desc: 'Critical water level & surge inflow. Controlled release required immediately.' },
    HIGH: { badge: 'bg-red-500/20 text-red-400 border border-red-500/40', desc: 'Water levels and incoming water are elevated. Controlled release advised.' },
    MODERATE: { badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/40', desc: 'Operating in normal range. Continuous monitoring active.' },
    LOW: { badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40', desc: 'Water levels are low to normal. No spillway discharge risk.' }
  }[floodRisk] || { badge: 'bg-slate-800 text-slate-300', desc: 'Operating within safe parameters.' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* 1. WEBSITE HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111928] to-[#0c121d] border border-[#1e2c44] p-6 sm:p-10 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI-ASSISTED WATER MANAGEMENT • {reservoirConfig.name.toUpperCase()}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {reservoirConfig.name} Intelligence System
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Understand today's water conditions. Predict what is coming next. Make safer, data-driven release decisions.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('decision')}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-teal-500/20 text-sm"
            >
              <span>Explore Today's Decision</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className="px-5 py-2.5 bg-[#172338] hover:bg-[#20304c] text-white border border-[#2b3e5f] font-semibold rounded-xl flex items-center gap-2 transition text-sm"
            >
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Simulation Mode</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION: TODAY'S RESERVOIR SITUATION (METRICS + WATER LEVEL VISUAL) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Today's Reservoir Situation</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Observed conditions at {current.reservoir_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-3 py-1 rounded-lg border ${isLiveApi ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-300 bg-amber-500/10 border-amber-500/30'}`}>
              {isLiveApi ? 'API DATA' : 'SYNTHETIC DATA'}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-[#121927] px-3 py-1 rounded-lg border border-[#222f46]">
              Updated {current.timestamp_ist}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 4 Human-Friendly Parameter Panels */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Water Level */}
            <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45] flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Water Level</span>
                <Droplets className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {current.reservoir_level_m} <span className="text-base font-normal text-slate-400">m</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Current level against full level ({current.max_reservoir_level_m} m)
                </p>
              </div>
            </div>

            {/* 2. Water Coming In */}
            <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45] flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Water Coming In</span>
                <Waves className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {current.inflow_cusecs?.toLocaleString()} <span className="text-base font-normal text-slate-400">cusecs</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Water entering from upstream catchment
                </p>
              </div>
            </div>

            {/* 3. Rain Expected Today */}
            <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45] flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Rain Expected Today</span>
                <CloudRain className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {current.rainfall_mm} <span className="text-base font-normal text-slate-400">mm</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  24-hour rainfall forecast across basin
                </p>
              </div>
            </div>

            {/* 4. Power Needed */}
            <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45] flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Power Needed</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {current.electricity_demand_mw?.toLocaleString()} <span className="text-base font-normal text-slate-400">MW</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Regional power grid requirement
                </p>
              </div>
            </div>

            {/* 5. Storage */}
            <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45] flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Water Stored</span>
                <Droplets className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {current.storage_mcm?.toLocaleString()} <span className="text-base font-normal text-slate-400">MCM</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Of {current.max_storage_mcm?.toLocaleString()} MCM capacity
                </p>
              </div>
            </div>

            {/* 6. Water Released */}
            <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45] flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Water Released</span>
                <Waves className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {current.outflow_cusecs?.toLocaleString()} <span className="text-base font-normal text-slate-400">cusecs</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Recommended controlled release
                </p>
              </div>
            </div>

          </div>

          {/* Right: Tasteful Water Level Cross-Section Visual */}
          <div className="lg:col-span-4">
            <WaterLevelVisual level_m={current.reservoir_level_m} max_level_m={current.max_reservoir_level_m} safety_threshold_m={reservoirConfig.safety_threshold_m} floodRisk={floodRisk} />
          </div>
        </div>
      </section>

      {/* 3. SECTION: FLOOD SAFETY & WHAT SHOULD WE DO TODAY? (HERO DECISION) */}
      <section className="space-y-4">
        {/* Flood Safety Header Ribbon */}
        <div className="bg-[#0f1520] border border-[#232f45] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                FLOOD SAFETY ASSESSMENT
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {riskTheme.desc}
              </p>
            </div>
          </div>

          <span className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold ${riskTheme.badge}`}>
            {floodRisk} RISK
          </span>
        </div>

        {/* HERO DECISION CARD (WHAT SHOULD WE DO TODAY?) */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${decisionTheme.bg} ${decisionTheme.glow} relative overflow-hidden transition-all space-y-6`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[#232f45] pb-6">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest block">
                DECISION DIRECTIVE
              </span>

              <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                  What Should We Do Today?
                </h3>
                <span className={`px-6 py-2 rounded-2xl text-3xl font-black font-mono tracking-wider shadow-lg ${decisionTheme.badge}`}>
                  {rec.action}
                </span>
              </div>

              <p className="text-xs font-mono text-slate-300">
                AI decision recommendation generated strictly from current water conditions without gate status input.
              </p>
            </div>

            {/* Key Decision Output Stats */}
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto font-mono">
              <div className="bg-[#0c121d]/90 p-4 rounded-2xl border border-[#232f45] text-center min-w-[130px]">
                <span className="text-[11px] text-slate-400 block font-semibold">Recommended Gate Opening</span>
                <span className="text-2xl sm:text-3xl font-black text-white block my-1">{rec.recommended_opening_pct}%</span>
                <span className="text-[10px] text-teal-400 font-semibold">Gate Aperture</span>
              </div>

              <div className="bg-[#0c121d]/90 p-4 rounded-2xl border border-[#232f45] text-center min-w-[140px]">
                <span className="text-[11px] text-slate-400 block font-semibold">Water to Release</span>
                <span className="text-2xl sm:text-3xl font-black text-white block my-1">{rec.recommended_release_cusecs?.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">cusecs</span>
              </div>

              <div className="bg-[#0c121d]/90 p-4 rounded-2xl border border-[#232f45] text-center min-w-[130px]">
                <span className="text-[11px] text-slate-400 block font-semibold">Expected Level Tomorrow</span>
                <span className="text-2xl sm:text-3xl font-black text-teal-300 block my-1">{rec.expected_level_tomorrow_m}</span>
                <span className="text-[10px] text-slate-400">meters</span>
              </div>
            </div>
          </div>

          {/* 4. WHY THIS RECOMMENDATION? */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400" />
              Why This Recommendation?
            </h4>

            <div className="p-4 rounded-2xl bg-[#0c121d]/80 border border-[#232f45] text-sm text-slate-200 leading-relaxed font-sans">
              "{decision.paragraph_reason}"
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              {decision.reasons?.map((reason, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#0e1420] border border-[#232f45] flex items-center gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: WHAT'S CHANGING? (7-DAY PREDICTION PREVIEW) */}
      <section className="bg-[#0f1520] border border-[#232f45] rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">What's Changing? (7-Day Forecast)</h3>
            <p className="text-xs text-slate-400 font-mono">Predicted incoming water and catchment rainfall</p>
          </div>

          <button
            onClick={() => setActiveTab('predictions')}
            className="text-xs font-mono text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>Full 7-Day Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1520', borderColor: '#232f45', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="predicted_inflow_cusecs" name="Water Coming In (cusecs)" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#inflowGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 6. SYSTEM DISCLAIMER & STATUS FOOTER */}
      <div className="p-4 rounded-2xl bg-[#0b0f17] border border-[#1e293b] flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 text-amber-300">
          <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>AI Decision Support • Operator Approval Required Before Physical Gate Actuation</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Data: {current.data_source || reservoirConfig.data_source}</span>
          <span>•</span>
          <span>Physical Gate Control: Not Connected</span>
        </div>
      </div>

    </div>
  );
}
