import React, { useState } from 'react';
import { Sliders, Play, RotateCcw, ShieldAlert, Info, Sparkles, ArrowRight } from 'lucide-react';
import { computeDecision, DEFAULT_TODAYS_DECISION } from '../utils/simulatedData';

export default function GateOptimization({ reservoirConfig }) {
  const [levelM, setLevelM] = useState(42.5);
  const [inflowCusecs, setInflowCusecs] = useState(28500);
  const [rainfallMm, setRainfallMm] = useState(42.5);
  const [demandMw, setDemandMw] = useState(2450);

  const [assessment, setAssessment] = useState(DEFAULT_TODAYS_DECISION);

  const runAssessment = (overrideInputs = null) => {
    const lvl = overrideInputs ? overrideInputs.reservoir_level_m : levelM;
    const inf = overrideInputs ? overrideInputs.inflow_cusecs : inflowCusecs;
    const rain = overrideInputs ? overrideInputs.rainfall_mm : rainfallMm;
    const dem = overrideInputs ? overrideInputs.electricity_demand_mw : demandMw;

    const localResult = computeDecision(lvl, inf, rain, dem);
    setAssessment(localResult);

    fetch('/api/simulation/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservoir_level_m: lvl,
        inflow_cusecs: inf,
        rainfall_mm: rain,
        electricity_demand_mw: dem
      })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Simulation request failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.assessment) {
          setAssessment({
            ...localResult,
            recommendation: {
              ...localResult.recommendation,
              action: data.assessment.gate_decision || localResult.recommendation.action,
              recommended_opening_pct: data.assessment.recommended_opening_pct ?? localResult.recommendation.recommended_opening_pct,
              recommended_release_cusecs: data.assessment.recommended_release_cusecs ?? localResult.recommendation.recommended_release_cusecs,
              expected_level_tomorrow_m: data.assessment.expected_level_tomorrow_m ?? localResult.recommendation.expected_level_tomorrow_m
            },
            assessment: {
              ...localResult.assessment,
              flood_risk: data.assessment.flood_risk || localResult.assessment.flood_risk
            },
            paragraph_reason: data.assessment.paragraph_reason || localResult.paragraph_reason,
            reasons: data.assessment.reasons || localResult.reasons
          });
        }
      })
      .catch((error) => {
        console.error('Unable to load simulation assessment.', error);
      });
  };

  const loadScenario1 = () => {
    const s1 = { reservoir_level_m: 45.0, inflow_cusecs: 38000, rainfall_mm: 75.0, electricity_demand_mw: 3200 };
    setLevelM(s1.reservoir_level_m);
    setInflowCusecs(s1.inflow_cusecs);
    setRainfallMm(s1.rainfall_mm);
    setDemandMw(s1.electricity_demand_mw);
    runAssessment(s1);
  };

  const loadScenario2 = () => {
    const s2 = { reservoir_level_m: 22.0, inflow_cusecs: 2500, rainfall_mm: 2.0, electricity_demand_mw: 3400 };
    setLevelM(s2.reservoir_level_m);
    setInflowCusecs(s2.inflow_cusecs);
    setRainfallMm(s2.rainfall_mm);
    setDemandMw(s2.electricity_demand_mw);
    runAssessment(s2);
  };

  const resetDefaults = () => {
    const d = { reservoir_level_m: 42.5, inflow_cusecs: 28500, rainfall_mm: 42.5, electricity_demand_mw: 2450 };
    setLevelM(d.reservoir_level_m);
    setInflowCusecs(d.inflow_cusecs);
    setRainfallMm(d.rainfall_mm);
    setDemandMw(d.electricity_demand_mw);
    runAssessment(d);
  };

  const rec = assessment.recommendation;
  const floodRisk = assessment.assessment?.flood_risk || "MODERATE";

  const decisionBadge = {
    OPEN: 'bg-emerald-500 text-slate-950 font-black',
    HOLD: 'bg-teal-500 text-slate-950 font-black',
    REDUCE: 'bg-amber-500 text-slate-950 font-black',
    CLOSE: 'bg-red-500 text-white font-black'
  }[rec.action] || 'bg-teal-500 text-slate-950';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#232f45] pb-4 gap-4">
        <div>
          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
            SCENARIO SIMULATOR
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Gate Optimization & What-If Engine
          </h2>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={loadScenario1}
            className="px-3.5 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 rounded-xl font-semibold transition"
          >
            Scenario 1: Heavy Flood Inflow
          </button>
          <button
            onClick={loadScenario2}
            className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl font-semibold transition"
          >
            Scenario 2: Drought Conservation
          </button>
        </div>
      </div>

      {/* Decision Pipeline Ribbon */}
      <div className="bg-[#0f1520] p-4 rounded-2xl border border-[#232f45] font-mono text-xs text-slate-300">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">DECISION PIPELINE</span>
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center font-bold">
          <div className="bg-[#151e2d] px-3 py-2 rounded-xl border border-[#232f45] text-slate-200 flex-1 w-full">INPUT CONDITIONS</div>
          <ArrowRight className="w-4 h-4 text-teal-400 hidden md:block" />
          <div className="bg-[#151e2d] px-3 py-2 rounded-xl border border-[#232f45] text-teal-300 flex-1 w-full">AI PREDICTIONS</div>
          <ArrowRight className="w-4 h-4 text-teal-400 hidden md:block" />
          <div className="bg-[#151e2d] px-3 py-2 rounded-xl border border-[#232f45] text-amber-300 flex-1 w-full">SAFETY ASSESSMENT</div>
          <ArrowRight className="w-4 h-4 text-teal-400 hidden md:block" />
          <div className="bg-[#151e2d] px-3 py-2 rounded-xl border border-[#232f45] text-sky-300 flex-1 w-full">OPTIMIZATION ENGINE</div>
          <ArrowRight className="w-4 h-4 text-teal-400 hidden md:block" />
          <div className="bg-[#151e2d] px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-300 flex-1 w-full">FINAL RECOMMENDATION</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Sliders */}
        <div className="lg:col-span-5 bg-[#0f1520] p-6 rounded-3xl border border-[#232f45] space-y-5">
          <div className="flex items-center justify-between border-b border-[#232f45] pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              Adjust Inputs (No Gate Status Input)
            </h3>
            <button
              onClick={resetDefaults}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Level (m) */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">1. Water Level (m)</label>
              <span className="text-teal-400 font-bold">{levelM} m / {reservoirConfig.max_water_level_m} m</span>
            </div>
            <input
              type="range"
              min="15.0"
              max={reservoirConfig.max_water_level_m * 0.99}
              step="0.5"
              value={levelM}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLevelM(val);
                runAssessment({ reservoir_level_m: val, inflow_cusecs: inflowCusecs, rainfall_mm: rainfallMm, electricity_demand_mw: demandMw });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>15.0 m (Low)</span>
              <span>43.0 m (Safety Zone)</span>
              <span>{(reservoirConfig.max_water_level_m * 0.99).toFixed(1)} m (Critical)</span>
            </div>
          </div>

          {/* Inflow (cusecs) */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">2. Water Coming In (cusecs)</label>
              <span className="text-teal-400 font-bold">{inflowCusecs.toLocaleString()} cusecs</span>
            </div>
            <input
              type="range"
              min="1000"
              max="65000"
              step="500"
              value={inflowCusecs}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setInflowCusecs(val);
                runAssessment({ reservoir_level_m: levelM, inflow_cusecs: val, rainfall_mm: rainfallMm, electricity_demand_mw: demandMw });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1,000 cusecs</span>
              <span>25,000 cusecs</span>
              <span>65,000 cusecs</span>
            </div>
          </div>

          {/* Rain Forecast (mm) */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">3. Rain Expected Today (mm)</label>
              <span className="text-sky-400 font-bold">{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="140"
              step="1"
              value={rainfallMm}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRainfallMm(val);
                runAssessment({ reservoir_level_m: levelM, inflow_cusecs: inflowCusecs, rainfall_mm: val, electricity_demand_mw: demandMw });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 mm</span>
              <span>40 mm</span>
              <span>140 mm</span>
            </div>
          </div>

          {/* Power Needed (MW) */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-semibold">4. Power Needed (MW)</label>
              <span className="text-amber-400 font-bold">{demandMw.toLocaleString()} MW</span>
            </div>
            <input
              type="range"
              min="1200"
              max="3800"
              step="50"
              value={demandMw}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDemandMw(val);
                runAssessment({ reservoir_level_m: levelM, inflow_cusecs: inflowCusecs, rainfall_mm: rainfallMm, electricity_demand_mw: val });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1,200 MW</span>
              <span>2,500 MW</span>
              <span>3,800 MW</span>
            </div>
          </div>

          <button
            onClick={() => runAssessment()}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RECALCULATE SCENARIO</span>
          </button>
        </div>

        {/* Right Side: Output */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#0f1520] p-6 sm:p-8 rounded-3xl border border-[#232f45] space-y-6">
            <div className="flex items-center justify-between border-b border-[#232f45] pb-4 font-mono">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                RECALCULATED DECISION
              </span>
              <span className="text-xs text-teal-400 bg-teal-950 px-3 py-1 rounded-full border border-teal-800">
                AI CONFIDENCE: {rec.ai_confidence_pct}%
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232f45]">
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-mono">WHAT SHOULD WE DO TODAY?</span>
                <span className={`px-6 py-2 rounded-2xl text-3xl font-mono tracking-wider inline-block ${decisionBadge}`}>
                  {rec.action}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[#151e2d] p-3.5 rounded-2xl border border-[#232f45]">
                  <span className="text-slate-400 block text-[11px]">Recommended Opening</span>
                  <span className="text-2xl font-bold text-white block my-0.5">{rec.recommended_opening_pct}%</span>
                  <span className="text-[10px] text-teal-400">Gate Aperture</span>
                </div>
                <div className="bg-[#151e2d] p-3.5 rounded-2xl border border-[#232f45]">
                  <span className="text-slate-400 block text-[11px]">Water to Release</span>
                  <span className="text-2xl font-bold text-white block my-0.5">{rec.recommended_release_cusecs?.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400">cusecs</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-[#151e2d] p-3 rounded-xl border border-[#232f45]">
                <span className="text-slate-400 text-[10px] block">EXPECTED LEVEL TOMORROW</span>
                <span className="text-lg font-bold text-teal-300">{rec.expected_level_tomorrow_m} m</span>
              </div>
              <div className="bg-[#151e2d] p-3 rounded-xl border border-[#232f45]">
                <span className="text-slate-400 text-[10px] block">WATER COMING IN</span>
                <span className="text-lg font-bold text-white">{inflowCusecs.toLocaleString()} cusecs</span>
              </div>
              <div className="bg-[#151e2d] p-3 rounded-xl border border-[#232f45]">
                <span className="text-slate-400 text-[10px] block">FLOOD SAFETY RISK</span>
                <span className={`text-lg font-bold ${
                  floodRisk === 'CRITICAL' || floodRisk === 'HIGH' ? 'text-red-400' : floodRisk === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {floodRisk}
                </span>
              </div>
            </div>

            {/* Dynamic Reason */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" />
                Why This Recommendation?
              </h4>
              <div className="p-4 rounded-2xl bg-[#151e2d] border border-[#232f45] text-sm text-slate-200 leading-relaxed font-sans">
                "{assessment.paragraph_reason}"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
