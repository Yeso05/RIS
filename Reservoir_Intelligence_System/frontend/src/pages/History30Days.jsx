import React, { useState, useEffect } from 'react';
import { History, Search, ChevronRight, X, Info, Filter, ShieldCheck, Waves, Lock, Pause } from 'lucide-react';
import { DEFAULT_HISTORY_30 } from '../utils/simulatedData';

export default function History30Days() {
  const [history, setHistory] = useState(DEFAULT_HISTORY_30);
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/history/30-days')
      .then(res => {
        if (!res.ok) throw new Error(`History request failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.history && isMounted) setHistory(data.history);
      })
      .catch((error) => {
        console.error('Unable to load history data.', error);
      });
    return () => { isMounted = false; };
  }, []);

  const counts = {
    total: history.length,
    open: history.filter(r => r.ai_decision === 'OPEN').length,
    hold: history.filter(r => r.ai_decision === 'HOLD').length,
    reduce: history.filter(r => r.ai_decision === 'REDUCE').length,
    close: history.filter(r => r.ai_decision === 'CLOSE').length,
  };

  const filteredHistory = history.filter(row => {
    const matchesSearch = 
      row.date?.toLowerCase().includes(searchFilter.toLowerCase()) || 
      row.ai_decision?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.flood_risk?.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || row.ai_decision === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#1b263b] pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              OPERATIONAL AUDIT TRAIL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            30-Day Decision Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified record of inputs, flood safety assessments, and automated AI gate decisions.
          </p>
        </div>

        <div className="relative font-mono text-xs w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search date, action, risk..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-64 bg-[#0a101d] border border-[#1b263b] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>
      </div>

      {/* Quick Stats & Action Filters Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <button
          onClick={() => setActionFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            actionFilter === 'ALL'
              ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-[#0a101d] border-[#1b263b] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-slate-400 block uppercase">All Records</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-white">{counts.total}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">30 Days</span>
          </div>
        </button>

        <button
          onClick={() => setActionFilter('OPEN')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            actionFilter === 'OPEN'
              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-[#0a101d] border-[#1b263b] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-emerald-400 block uppercase font-bold flex items-center gap-1.5">
            <Waves className="w-3 h-3" /> OPEN GATES
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-emerald-400">{counts.open}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Surge Release</span>
          </div>
        </button>

        <button
          onClick={() => setActionFilter('HOLD')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            actionFilter === 'HOLD'
              ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10'
              : 'bg-[#0a101d] border-[#1b263b] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-sky-400 block uppercase font-bold flex items-center gap-1.5">
            <Pause className="w-3 h-3" /> HOLD STEADY
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-sky-400">{counts.hold}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">Balanced Gen</span>
          </div>
        </button>

        <button
          onClick={() => setActionFilter('REDUCE')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            actionFilter === 'REDUCE'
              ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
              : 'bg-[#0a101d] border-[#1b263b] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-amber-400 block uppercase font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> REDUCE
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-amber-400">{counts.reduce}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Easing Flow</span>
          </div>
        </button>

        <button
          onClick={() => setActionFilter('CLOSE')}
          className={`p-3.5 rounded-2xl border transition text-left col-span-2 sm:col-span-1 ${
            actionFilter === 'CLOSE'
              ? 'bg-rose-500/20 border-rose-400 text-white shadow-lg shadow-rose-500/10'
              : 'bg-[#0a101d] border-[#1b263b] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span className="text-[10px] text-rose-400 block uppercase font-bold flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> CLOSE GATES
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-rose-400">{counts.close}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Conservation</span>
          </div>
        </button>
      </div>

      {/* Main Historical Table */}
      <div className="bg-[#0a101d] border border-[#1b263b] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#10182b] border-b border-[#1b263b] text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-4 px-4 font-bold">Date</th>
                <th className="py-4 px-4 font-bold">Water Level</th>
                <th className="py-4 px-4 font-bold">Water Coming In</th>
                <th className="py-4 px-4 font-bold">Rain Forecast</th>
                <th className="py-4 px-4 font-bold">Power Needed</th>
                <th className="py-4 px-4 font-bold">Flood Safety</th>
                <th className="py-4 px-4 font-bold">Action Taken</th>
                <th className="py-4 px-4 font-bold">Gate Opening</th>
                <th className="py-4 px-4 font-bold">Water to Release</th>
                <th className="py-4 px-4 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b263b]/70 text-slate-200">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500 font-sans">
                    No records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row, idx) => {
                  const isSelected = selectedDay?.date === row.date;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedDay(row)}
                      className={`cursor-pointer transition hover:bg-[#10182b] ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400' 
                          : idx % 2 === 0 ? 'bg-[#0a101d]' : 'bg-[#080d17]'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">{row.date}</td>
                      <td className="py-3.5 px-4 text-cyan-300 font-bold">{row.reservoir_level_m} m</td>
                      <td className="py-3.5 px-4 text-slate-200">{row.inflow_cusecs?.toLocaleString()} cusecs</td>
                      <td className="py-3.5 px-4 text-sky-400">{row.rainfall_mm} mm</td>
                      <td className="py-3.5 px-4 text-amber-400">{row.electricity_demand_mw?.toLocaleString()} MW</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.flood_risk === 'CRITICAL' || row.flood_risk === 'HIGH' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          row.flood_risk === 'MODERATE' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {row.flood_risk}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={`px-3 py-1 rounded-xl text-xs inline-block text-center min-w-[70px] ${
                          row.ai_decision === 'OPEN' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/20 font-black' :
                          row.ai_decision === 'HOLD' 
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 ring-1 ring-sky-500/20 font-black' :
                          row.ai_decision === 'REDUCE' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20 font-black' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/20 font-black'
                        }`}>
                          {row.ai_decision}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {row.ai_decision === 'CLOSE' ? (
                          <span className="text-slate-400">0% (Closed)</span>
                        ) : (
                          <span className="text-white">{row.recommended_opening_pct}%</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{row.recommended_release_cusecs?.toLocaleString()} cusecs</td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-xl bg-[#10182b] border border-[#1b263b]">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a101d] border border-[#1b263b] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative font-sans">
            <div className="flex items-center justify-between border-b border-[#1b263b] pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">HISTORICAL RECORD</span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Record for {selectedDay.date}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-[#10182b] p-3.5 rounded-2xl border border-[#1b263b]">
                <span className="text-slate-400 block text-[10px]">WATER LEVEL</span>
                <span className="text-lg font-bold text-cyan-300">{selectedDay.reservoir_level_m} m</span>
              </div>

              <div className="bg-[#10182b] p-3.5 rounded-2xl border border-[#1b263b]">
                <span className="text-slate-400 block text-[10px]">WATER COMING IN</span>
                <span className="text-lg font-bold text-white">{selectedDay.inflow_cusecs?.toLocaleString()} cusecs</span>
              </div>

              <div className="bg-[#10182b] p-3.5 rounded-2xl border border-[#1b263b]">
                <span className="text-slate-400 block text-[10px]">RAIN EXPECTED</span>
                <span className="text-lg font-bold text-sky-400">{selectedDay.rainfall_mm} mm</span>
              </div>

              <div className="bg-[#10182b] p-3.5 rounded-2xl border border-[#1b263b]">
                <span className="text-slate-400 block text-[10px]">POWER NEEDED</span>
                <span className="text-lg font-bold text-amber-400">{selectedDay.electricity_demand_mw?.toLocaleString()} MW</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#10182b] border border-[#1b263b] flex items-center justify-between font-mono">
              <div>
                <span className="text-xs text-slate-400 block mb-1">WHAT WE DID</span>
                <span className={`text-2xl font-black uppercase ${
                  selectedDay.ai_decision === 'OPEN' ? 'text-emerald-400' :
                  selectedDay.ai_decision === 'HOLD' ? 'text-sky-400' :
                  selectedDay.ai_decision === 'REDUCE' ? 'text-amber-400' :
                  'text-rose-400'
                }`}>
                  {selectedDay.ai_decision}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">GATE OPENING</span>
                <span className="text-2xl font-black text-cyan-400">
                  {selectedDay.ai_decision === 'CLOSE' ? '0% (Closed)' : `${selectedDay.recommended_opening_pct}%`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Why this action was recommended:
              </h4>
              <div className="p-4 rounded-2xl bg-[#10182b] border border-[#1b263b] text-sm text-slate-200 leading-relaxed font-sans">
                "{selectedDay.paragraph_reason}"
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:from-cyan-400 hover:to-teal-400 font-sans shadow-lg shadow-cyan-500/20 transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
