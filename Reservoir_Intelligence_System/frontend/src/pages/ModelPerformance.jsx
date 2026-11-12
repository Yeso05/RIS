import React, { useState, useEffect } from 'react';
import { Cpu, Info } from 'lucide-react';
import { DEFAULT_MODEL_METRICS } from '../utils/simulatedData';
import DataStatus from '../components/DataStatus';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(DEFAULT_MODEL_METRICS);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/model-performance')
      .then(res => {
        if (!res.ok) throw new Error(`Model metrics request failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && isMounted) setMetrics(data);
      })
      .catch((error) => {
        console.error('Unable to load model metrics.', error);
        if (isMounted) setApiError(true);
      });
    return () => { isMounted = false; };
  }, []);

  const rain = metrics.rainfall_model;
  const inflow = metrics.inflow_model;
  const demand = metrics.electricity_demand_model;
  const flood = metrics.flood_risk_model;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <DataStatus error={apiError} />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a364f] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-teal-400 font-bold uppercase">PAGE 8 OF 8</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-400">MACHINE LEARNING DIAGNOSTICS</span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-white mt-1">AI Model Performance</h2>
        </div>

        <div className="bg-[#141c2b] px-3 py-1.5 rounded border border-[#2a364f] text-right font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">EVALUATION STATUS</span>
          <span className="text-amber-300 font-bold">{metrics.disclaimer || "Prototype evaluation using synthetic data"}</span>
        </div>
      </div>

      {/* Model Performance Overview Card */}
      <div className="bg-[#141c2b] p-6 rounded-xl border border-teal-500/30 font-mono shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded border border-teal-500/30">
            <Cpu className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase">HYBRID AI PREDICTION & TRANSPARENT RULES ENGINE</h3>
            <p className="text-xs text-slate-400">{metrics.disclaimer || "Prototype evaluation using synthetic data"}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#0f1726] border border-[#2a364f] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-slate-300">
          <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f] flex-1 w-full">
            <span className="text-teal-400 font-bold block mb-1">1. STATISTICAL ML MODELS</span>
            <span className="text-[11px] text-slate-400">Regression models forecast rainfall (mm), inflow (cusecs), & grid load (MW).</span>
          </div>
          <span className="text-teal-400 font-bold text-lg">+</span>
          <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f] flex-1 w-full">
            <span className="text-amber-400 font-bold block mb-1">2. SAFETY RULES ENGINE</span>
            <span className="text-[11px] text-slate-400">Strict physical bounds override recommendations if storage &gt;43.0 m or surge inflow occurs.</span>
          </div>
          <span className="text-teal-400 font-bold text-lg">+</span>
          <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f] flex-1 w-full">
            <span className="text-emerald-400 font-bold block mb-1">3. MASS BALANCE</span>
            <span className="text-[11px] text-slate-400">Continuity mass-balance calculates expected storage level tomorrow (m).</span>
          </div>
        </div>
      </div>

      {/* Grid of 4 Model Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        {/* Model 1 */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a364f] space-y-4">
          <div className="flex justify-between items-start border-b border-[#2a364f] pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MODEL: {rain?.model_type}</span>
              <h4 className="text-base font-bold text-white">Rainfall Forecast</h4>
              <span className="text-xs text-sky-400">{rain?.purpose}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
              REGRESSION
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">MAE</span>
              <span className="text-lg font-bold text-white">{rain?.metrics?.mae} <span className="text-[10px] text-slate-400 font-normal">mm</span></span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">RMSE</span>
              <span className="text-lg font-bold text-white">{rain?.metrics?.rmse}</span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">R² SCORE</span>
              <span className="text-lg font-bold text-teal-400">{rain?.metrics?.r2}</span>
            </div>
          </div>
        </div>

        {/* Model 2 */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a364f] space-y-4">
          <div className="flex justify-between items-start border-b border-[#2a364f] pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MODEL: {inflow?.model_type}</span>
              <h4 className="text-base font-bold text-white">Inflow Prediction</h4>
              <span className="text-xs text-teal-400">{inflow?.purpose}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30">
              REGRESSION
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">MAE</span>
              <span className="text-lg font-bold text-white">{inflow?.metrics?.mae} <span className="text-[10px] text-slate-400 font-normal">cusecs</span></span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">RMSE</span>
              <span className="text-lg font-bold text-white">{inflow?.metrics?.rmse}</span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">R² SCORE</span>
              <span className="text-lg font-bold text-teal-400">{inflow?.metrics?.r2}</span>
            </div>
          </div>
        </div>

        {/* Model 3 */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a364f] space-y-4">
          <div className="flex justify-between items-start border-b border-[#2a364f] pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MODEL: {demand?.model_type}</span>
              <h4 className="text-base font-bold text-white">Electricity Demand</h4>
              <span className="text-xs text-amber-400">{demand?.purpose}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              REGRESSION
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">MAE</span>
              <span className="text-lg font-bold text-white">{demand?.metrics?.mae} <span className="text-[10px] text-slate-400 font-normal">MW</span></span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">RMSE</span>
              <span className="text-lg font-bold text-white">{demand?.metrics?.rmse}</span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">R² SCORE</span>
              <span className="text-lg font-bold text-teal-400">{demand?.metrics?.r2}</span>
            </div>
          </div>
        </div>

        {/* Model 4 */}
        <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a364f] space-y-4">
          <div className="flex justify-between items-start border-b border-[#2a364f] pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MODEL: {flood?.model_type}</span>
              <h4 className="text-base font-bold text-white">Flood Risk Classification</h4>
              <span className="text-xs text-emerald-400">{flood?.purpose}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CLASSIFIER
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">ACCURACY</span>
              <span className="text-xl font-bold text-emerald-400">{Math.round((flood?.metrics?.accuracy || 0.88) * 100)}%</span>
            </div>
            <div className="bg-[#1a2436] p-3 rounded border border-[#2a364f]">
              <span className="text-slate-400 block text-[10px]">F1 SCORE (MACRO)</span>
              <span className="text-xl font-bold text-teal-400">{flood?.metrics?.f1_score || 0.86}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
