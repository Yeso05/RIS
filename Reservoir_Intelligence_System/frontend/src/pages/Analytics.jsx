import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart, 
  BarChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { DEFAULT_HISTORY_30 } from '../utils/simulatedData';

export default function Analytics() {
  const [data, setData] = useState({
    time_series: DEFAULT_HISTORY_30.map(d => ({
      date: d.date,
      full_date: d.full_date,
      reservoir_level_m: d.reservoir_level_m,
      inflow_cusecs: d.inflow_cusecs,
      rainfall_mm: d.rainfall_mm,
      electricity_demand_mw: d.electricity_demand_mw,
      recommended_opening_pct: d.recommended_opening_pct,
      recommended_release_cusecs: d.recommended_release_cusecs,
      gate_decision: d.ai_decision
    }))
  });
  useEffect(() => {
    let isMounted = true;
    fetch('/api/analytics')
      .then(res => {
        if (!res.ok) throw new Error(`Analytics request failed: ${res.status}`);
        return res.json();
      })
      .then(resData => {
        if (resData?.time_series && isMounted) setData(resData);
      })
      .catch((error) => {
        console.error('Unable to load analytics data.', error);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232f45] pb-4">
        <div>
          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
            ANALYTICS ENGINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Operational Trends & Correlation
          </h2>
        </div>

        <div className="bg-[#0f1520] px-4 py-2 rounded-xl border border-[#232f45] text-right font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">TIME HORIZON</span>
          <span className="text-teal-400 font-bold">Past 30 Days</span>
        </div>
      </div>

      {/* FEATURED CHART: Conditions vs Decisions */}
      <div className="bg-[#0f1520] p-6 sm:p-8 rounded-3xl border border-teal-500/30 shadow-2xl space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest block">
            CORE CORRELATION
          </span>
          <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2 font-mono">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Water Conditions vs Gate Decision Actions
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Shows how changing water level (m), incoming water (cusecs), and rainfall (mm) determine the recommended gate opening.
          </p>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.time_series} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232f45" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis yAxisId="lvl" stroke="#14b8a6" domain={[15, 50]} tick={{ fontSize: 11, fontFamily: 'monospace' }} label={{ value: 'Water Level (m)', angle: -90, position: 'insideLeft', fill: '#14b8a6', style: { fontSize: 11, fontFamily: 'monospace' } }} />
              <YAxis yAxisId="op" orientation="right" stroke="#f59e0b" domain={[0, 100]} tick={{ fontSize: 11, fontFamily: 'monospace' }} label={{ value: 'Gate Opening (%)', angle: 90, position: 'insideRight', fill: '#f59e0b', style: { fontSize: 11, fontFamily: 'monospace' } }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1520', borderColor: '#232f45', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12 }} />
              <Bar yAxisId="op" dataKey="recommended_opening_pct" name="Gate Opening (%)" fill="#f59e0b" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              <Line yAxisId="lvl" type="monotone" dataKey="reservoir_level_m" name="Water Level (m)" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} />
              <Line yAxisId="lvl" type="monotone" dataKey="rainfall_mm" name="Rain (mm)" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Secondary Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Water Coming In vs Water Released */}
        <div className="bg-[#0f1520] p-6 rounded-3xl border border-[#232f45]">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
            Water Coming In (cusecs) vs Water Released (cusecs)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.time_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232f45" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1520', borderColor: '#232f45', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                <Line type="monotone" dataKey="inflow_cusecs" name="Water Coming In (cusecs)" stroke="#14b8a6" strokeWidth={2} />
                <Line type="monotone" dataKey="recommended_release_cusecs" name="Water Released (cusecs)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Regional Power Needed */}
        <div className="bg-[#0f1520] p-6 rounded-3xl border border-[#232f45]">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
            Regional Power Needed (MW)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.time_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232f45" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1520', borderColor: '#232f45', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="electricity_demand_mw" name="Power Needed (MW)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
