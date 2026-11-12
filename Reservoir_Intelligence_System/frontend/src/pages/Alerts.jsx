import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { DEFAULT_ALERTS } from '../utils/simulatedData';

export default function Alerts() {
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/alerts')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.alerts && isMounted) setAlerts(data.alerts);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a364f] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-teal-400 font-bold uppercase">PAGE 7 OF 8</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-400">TELEMETRY & RISK ADVISORIES</span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-white mt-1">Operational Alerts & Warnings</h2>
        </div>

        <div className="bg-[#141c2b] px-3 py-1.5 rounded border border-[#2a364f] text-right font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">ACTIVE NOTIFICATIONS</span>
          <span className="text-amber-400 font-bold">{alerts.length} System Advisories</span>
        </div>
      </div>

      <div className="space-y-3 font-mono">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
          const isWarning = alert.severity === 'WARNING';
          
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border flex items-start gap-4 transition ${
                isCritical 
                  ? 'bg-red-950/20 border-red-500/40 text-red-300' 
                  : isWarning 
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' 
                  : 'bg-[#141c2b] border-[#2a364f] text-slate-200'
              }`}
            >
              <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50 flex-shrink-0">
                {isCritical ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Info className="w-5 h-5 text-teal-400" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {alert.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                <div className="pt-2 flex items-center gap-3 text-[10px] text-slate-400">
                  <span>ID: {alert.id}</span>
                  <span>•</span>
                  <span>Severity: <strong className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-teal-400'}>{alert.severity}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
