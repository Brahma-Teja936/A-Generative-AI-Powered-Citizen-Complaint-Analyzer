import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  CheckCircle2, Play, PauseCircle, Clock, MapPin, 
  UploadCloud, ArrowLeft, Image as ImageIcon, AlertCircle 
} from 'lucide-react';

export const DepartmentComplaintDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [progressDesc, setProgressDesc] = useState('');
  const [progressStatus, setProgressStatus] = useState('IN_PROGRESS');
  const [estCompletion, setEstCompletion] = useState('');
  const [progressFiles, setProgressFiles] = useState([]);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Resolution Form
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState([]);
  const [resolving, setResolving] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/department/complaints/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAccept = async () => {
    try {
      await api.post(`/department/complaints/${id}/accept`);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept complaint');
    }
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!progressDesc.trim()) return;
    setUpdatingProgress(true);

    try {
      const formData = new FormData();
      formData.append('description', progressDesc);
      formData.append('status', progressStatus);
      if (estCompletion) formData.append('estimated_completion', estCompletion);
      progressFiles.forEach((file) => formData.append('evidence', file));

      await api.post(`/department/complaints/${id}/progress`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProgressDesc('');
      setProgressFiles([]);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionDesc.trim()) return;
    setResolving(true);

    try {
      const formData = new FormData();
      formData.append('resolution_description', resolutionDesc);
      resolutionFiles.forEach((file) => formData.append('evidence', file));

      await api.post(`/department/complaints/${id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowResolveModal(false);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve complaint');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading work order...</div>;
  }

  const c = data?.complaint;
  const history = data?.progress_history || [];

  if (!c) {
    return <div className="text-center py-20 text-rose-400 text-xs">Work order not found.</div>;
  }

  const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/department/complaints" className="inline-flex items-center text-xs text-slate-400 hover:text-white space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Orders</span>
        </Link>
        <span className="font-mono text-xs text-indigo-400">Order #{c.complaint_id}</span>
      </div>

      {/* Main Order Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-indigo-400">{c.complaint_id}</span>
            <StatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
            <UrgencyBadge urgency={c.urgency} />
          </div>

          <div className="flex items-center space-x-2">
            {c.status === 'ASSIGNED' && (
              <Button variant="primary" size="sm" onClick={handleAccept}>
                <Play className="w-3.5 h-3.5 mr-1" />
                Accept Work Order
              </Button>
            )}
            {!isResolved && (
              <Button variant="success" size="sm" onClick={() => setShowResolveModal(true)}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Mark Resolved
              </Button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">{c.title}</h2>
          <div className="mt-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
            <div>
              <span className="font-semibold text-slate-400">Original Citizen Text: </span>
              {c.original_text}
            </div>
            {c.translated_text_en && c.original_language !== 'en' && (
              <div className="pt-2 border-t border-slate-800 text-slate-300">
                <span className="font-semibold text-civic-400">English Translation: </span>
                {c.translated_text_en}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
            <div className="text-slate-400">Location Address</div>
            <div className="font-medium text-slate-200 mt-0.5">{c.location?.address}</div>
          </div>
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
            <div className="text-slate-400">Estimated Target Resolution</div>
            <div className="font-medium text-slate-200 mt-0.5">{c.estimated_completion || 'Not specified'}</div>
          </div>
        </div>
      </div>

      {/* Add Progress Update Form */}
      {!isResolved && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Add Work Progress & Evidence</span>
          </h3>

          <form onSubmit={handleAddProgress} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-1">Progress Description / Crew Action</label>
              <textarea
                rows={3}
                required
                value={progressDesc}
                onChange={(e) => setProgressDesc(e.target.value)}
                placeholder="e.g. Repair vehicle dispatched. Damaged asphalt removed and base layer ready..."
                className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Update Status</label>
                <select
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none"
                >
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="ON_HOLD">ON HOLD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estimated Completion Date</label>
                <input
                  type="date"
                  value={estCompletion}
                  onChange={(e) => setEstCompletion(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2 rounded-xl border border-slate-800 outline-none"
                >
                </input>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Upload Work Evidence Photo/Doc</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => e.target.files && setProgressFiles(Array.from(e.target.files))}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:bg-slate-800 file:text-slate-200 file:border-0 hover:file:bg-slate-700"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" loading={updatingProgress}>
              Post Progress Update
            </Button>
          </form>
        </div>
      )}

      {/* Progress History List */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Work Log & Updates ({history.length})</h3>
        {history.length === 0 ? (
          <div className="text-slate-500 text-xs py-4">No progress logs recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-400">{h.status}</span>
                  <span className="text-[10px] text-slate-500">{new Date(h.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300">{h.description}</p>
                {h.evidence && h.evidence.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {h.evidence.map((ev, i) => (
                      <a key={i} href={`/${ev}`} target="_blank" rel="noreferrer" className="text-[11px] text-civic-400 underline">
                        Evidence #{i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Resolve Complaint Work Order</span>
            </h3>

            <p className="text-slate-400">
              Please document the final remediation steps. This will notify the citizen and dispatch an official resolution email.
            </p>

            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Resolution Description (Required)</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionDesc}
                  onChange={(e) => setResolutionDesc(e.target.value)}
                  placeholder="Detailed summary of repairs completed, parts replaced, or site cleared..."
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Resolution Evidence Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files && setResolutionFiles(Array.from(e.target.files))}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:bg-slate-800 file:text-slate-200 file:border-0 hover:file:bg-slate-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowResolveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" size="sm" loading={resolving}>
                  Confirm & Finalize Resolution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
