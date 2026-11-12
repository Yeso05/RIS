import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TodaysDecision from './pages/TodaysDecision';
import AIPredictions from './pages/AIPredictions';
import GateOptimization from './pages/GateOptimization';
import History30Days from './pages/History30Days';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import ModelPerformance from './pages/ModelPerformance';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#f0f6fc] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} alertCount={2} />

      <main className="flex-1 pb-12">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'decision' && <TodaysDecision />}
        {activeTab === 'predictions' && <AIPredictions />}
        {activeTab === 'simulation' && <GateOptimization />}
        {activeTab === 'history' && <History30Days />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'alerts' && <Alerts />}
        {activeTab === 'model' && <ModelPerformance />}
      </main>

      <footer className="border-t border-[#2a364f] bg-[#0f1726] px-6 py-3 text-center text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span className="font-bold text-teal-400">RIS — Reservoir Intelligence System</span> (Reservoir Alpha Prototype)
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Decision Support System</span>
          <span>•</span>
          <span className="text-amber-300">Operator Approval Required</span>
          <span>•</span>
          <span>Simulated Prototype Data</span>
        </div>
      </footer>
    </div>
  );
}
