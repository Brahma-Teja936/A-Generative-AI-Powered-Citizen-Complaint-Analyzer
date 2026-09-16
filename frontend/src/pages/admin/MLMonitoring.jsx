import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Cpu, CheckCircle2, BarChart2, Layers, RefreshCw } from 'lucide-react';

export const AdminMLMonitoring = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/ml-metrics');
      setMetrics(res.data.metrics || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading ML model metrics...</div>;
  }

  const targets = Object.keys(metrics || {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-civic-600/30 border border-civic-500/40 flex items-center justify-center text-civic-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Machine Learning Telemetry & Health</h2>
            <p className="text-xs text-slate-400 mt-1">
              Verified evaluation performance of TF-IDF vectorizer and 6 XGBoost classifiers
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {targets.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
          ML metrics file not found. Ensure models have been trained.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {targets.map((target) => {
            const m = metrics[target];
            return (
              <div key={target} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{target} Model</h3>
                    <span className="text-[10px] font-mono text-civic-400">XGBoost Multiclass</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Accuracy</div>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {(m.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Precision</div>
                    <div className="font-mono font-bold text-white mt-0.5">{(m.precision * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Recall</div>
                    <div className="font-mono font-bold text-white mt-0.5">{(m.recall * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">F1-Score</div>
                    <div className="font-mono font-bold text-civic-400 mt-0.5">{m.f1.toFixed(4)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Target Classes ({m.classes?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {(m.classes || []).map((cls, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
