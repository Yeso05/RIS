import React, { useState, useEffect } from 'react';
import { TrendingUp, CloudRain, Waves, Droplets, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';
import { DEFAULT_PREDICTIONS } from '../utils/simulatedData';

export default function AIPredictions() {
  const [data, setData] = useState(DEFAULT_PREDICTIONS);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/predictions')
      .then(res => res.ok ? res.json() : null)
      .then(resData => {
        if (resData?.predictions && isMounted) {
          setData(resData.predictions);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232f45] pb-4">
        <div>
          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
            FORECAST HORIZON
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            7-Day Hydrological Forecast
          </h2>
        </div>

        <div className="bg-[#0f1520] px-4 py-2 rounded-xl border border-[#232f45] text-right font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">PREDICTIVE HORIZON</span>
          <span className="text-teal-400 font-bold">7-Day Lookahead</span>
        </div>
      </div>

      {/* Grid of 4 Predictive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase text-slate-300">Tomorrow's Rain</span>
            <CloudRain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{data[0]?.predicted_rainfall_mm} <span className="text-base font-normal text-slate-400">mm</span></div>
          <span className="text-[11px] text-teal-400 block mt-1">Catchment forecast</span>
        </div>

        <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase text-slate-300">Water Coming In</span>
            <Waves className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{data[0]?.predicted_inflow_cusecs?.toLocaleString()} <span className="text-base font-normal text-slate-400">cusecs</span></div>
          <span className="text-[11px] text-teal-400 block mt-1">Expected flow</span>
        </div>

        <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase text-slate-300">Expected Water Level</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{data[0]?.predicted_level_m} <span className="text-base font-normal text-slate-400">m</span></div>
          <span className="text-[11px] text-teal-400 block mt-1">Tomorrow's storage depth</span>
        </div>

        <div className="bg-[#0f1520] p-5 rounded-2xl border border-[#232f45]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase text-slate-300">Power Needed</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{data[0]?.predicted_demand_mw?.toLocaleString()} <span className="text-base font-normal text-slate-400">MW</span></div>
          <span className="text-[11px] text-amber-400 block mt-1">Grid demand estimate</span>
        </div>
      </div>

      {/* 7-Day Inflow vs Level Chart */}
      <div className="bg-[#0f1520] p-6 sm:p-8 rounded-3xl border border-[#232f45]">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <TrendingUp className="w-4 h-4 text-teal-400" />
          7-Day Trajectory: Water Coming In (cusecs) vs Water Level (m)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232f45" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis yAxisId="left" stroke="#14b8a6" tick={{ fontSize: 11, fontFamily: 'monospace' }} label={{ value: 'Water Coming In (cusecs)', angle: -90, position: 'insideLeft', fill: '#14b8a6', style: { fontSize: 11, fontFamily: 'monospace' } }} />
              <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" domain={[15, 50]} tick={{ fontSize: 11, fontFamily: 'monospace' }} label={{ value: 'Water Level (m)', angle: 90, position: 'insideRight', fill: '#38bdf8', style: { fontSize: 11, fontFamily: 'monospace' } }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1520', borderColor: '#232f45', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="predicted_inflow_cusecs" name="Water Coming In (cusecs)" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="predicted_level_m" name="Water Level (m)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Rainfall & Demand Chart */}
      <div className="bg-[#0f1520] p-6 sm:p-8 rounded-3xl border border-[#232f45]">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
          <CloudRain className="w-4 h-4 text-sky-400" />
          7-Day Forecast: Rain Expected (mm) & Regional Power Needed (MW)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232f45" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis yAxisId="rain" stroke="#38bdf8" tick={{ fontSize: 11, fontFamily: 'monospace' }} label={{ value: 'Rain Expected (mm)', angle: -90, position: 'insideLeft', fill: '#38bdf8', style: { fontSize: 11, fontFamily: 'monospace' } }} />
              <YAxis yAxisId="demand" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11, fontFamily: 'monospace' }} label={{ value: 'Power Needed (MW)', angle: 90, position: 'insideRight', fill: '#f59e0b', style: { fontSize: 11, fontFamily: 'monospace' } }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1520', borderColor: '#232f45', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
              <Area yAxisId="rain" type="monotone" dataKey="predicted_rainfall_mm" name="Rain Expected (mm)" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
              <Area yAxisId="demand" type="monotone" dataKey="predicted_demand_mw" name="Power Needed (MW)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
