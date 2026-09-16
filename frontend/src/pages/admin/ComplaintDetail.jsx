import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, PriorityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AIAnalysisReport } from '../../components/complaints/AIAnalysisReport';
import { 
  Building2, MapPin, Calendar, Clock, UserCheck, 
  ArrowLeft, CheckCircle2, AlertOctagon, Send, Image as ImageIcon, Trash2 
} from 'lucide-react';

export const AdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Department Assignment State
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Quick Resolve State
  const [resolveModal, setResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint ${id}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/complaints/${id}`);
      alert(`Complaint ${id} deleted successfully.`);
      navigate('/admin/complaints');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cmpRes, deptRes] = await Promise.all([
        api.get(`/admin/complaints/${id}`),
        api.get('/admin/departments')
      ]);
      setComplaint(cmpRes.data);
      setDepartments(deptRes.data || []);
      if (cmpRes.data.assigned_department_id) {
        setSelectedDeptId(cmpRes.data.assigned_department_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSaveDecision = async (decisionData) => {
    try {
      const res = await api.put(`/admin/complaints/${id}/decision`, decisionData);
      setComplaint(res.data);
      alert('Administrator review decision and classification successfully saved.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save review decision.');
    }
  };

  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    if (!selectedDeptId) return;
    setAssigning(true);
    try {
      const res = await api.put(`/admin/complaints/${id}/assign`, { department_id: selectedDeptId });
      setComplaint(res.data);
      alert('Complaint assigned to department. In-app notification & dispatch email sent.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign department.');
    } finally {
      setAssigning(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    setResolving(true);
    try {
      const res = await api.post(`/admin/complaints/${id}/resolve`, {
        resolution_description: resolutionNotes
      });
      setComplaint(res.data);
      setResolveModal(false);
      alert('Complaint marked as RESOLVED. Resolution email dispatched to citizen.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve complaint.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading complaint intelligence...</div>;
  }

  if (!complaint) {
    return <div className="text-center py-20 text-rose-400 text-xs">Complaint not found.</div>;
  }

  const isCritical = complaint.severity === 'CRITICAL' || complaint.emergency_status;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/complaints" className="inline-flex items-center text-xs text-slate-400 hover:text-white space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Directory</span>
        </Link>

        <div className="flex items-center space-x-2">
          {isCritical && (
            <Link
              to={`/admin/emergency/${complaint.complaint_id}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold animate-pulse shadow-lg shadow-rose-950/50"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Emergency Center</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Complaint</span>
          </button>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold text-civic-400">{complaint.complaint_id}</span>
            <StatusBadge status={complaint.status} />
            <SeverityBadge severity={complaint.severity} />
            <PriorityBadge priority={complaint.priority} />
            <UrgencyBadge urgency={complaint.urgency} />
          </div>

          <div className="flex items-center space-x-2">
            {complaint.status !== 'RESOLVED' && (
              <Button variant="success" size="sm" onClick={() => setResolveModal(true)}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Resolve Complaint
              </Button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">{complaint.title}</h2>
          <div className="mt-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
            <div>
              <span className="font-semibold text-slate-400">Citizen Raw Complaint: </span>
              {complaint.original_text}
            </div>
            {complaint.translated_text_en && complaint.original_language !== 'en' && (
              <div className="pt-2 border-t border-slate-800 text-slate-300">
                <span className="font-semibold text-civic-400">English Translation ({complaint.translation_source}): </span>
                {complaint.translated_text_en}
              </div>
            )}
          </div>
        </div>

        {/* Location & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Location Address</span>
            </div>
            <div className="font-medium text-slate-200">{complaint.location?.address}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Coords: {complaint.location?.coordinates ? `${complaint.location.coordinates[1].toFixed(5)}, ${complaint.location.coordinates[0].toFixed(5)}` : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assigned Department</span>
            </div>
            <div className="font-semibold text-white">{complaint.department || 'Awaiting Assignment'}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Assigned By: {complaint.assigned_by || 'None'}</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submission Time</span>
            </div>
            <div className="font-medium text-slate-200">{new Date(complaint.created_at).toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Method: {complaint.input_method || 'TEXT'}</div>
          </div>
        </div>
      </div>

      {/* Embedded AI Analysis Report with Review/Override Controls */}
      <AIAnalysisReport
        complaint={complaint}
        onSaveDecision={handleSaveDecision}
        isAdmin={true}
        departments={departments}
      />

      {/* Department Assignment Section */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Department Dispatch & Work Assignment</span>
        </h3>

        <form onSubmit={handleAssignDepartment} className="flex flex-col sm:flex-row gap-3 text-xs">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="flex-1 bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none"
          >
            <option value="">-- Select Municipal Department --</option>
            {departments.map((d) => (
              <option key={d.id || d._id} value={d.id || d._id}>
                {d.department_name} ({d.department_email})
              </option>
            ))}
          </select>

          <Button type="submit" variant="primary" size="sm" loading={assigning} disabled={!selectedDeptId}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {complaint.assigned_department_id ? 'Reassign Department' : 'Assign Department'}
          </Button>
        </form>
      </div>

      {/* Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-civic-400" />
          <span>Complete Event & Audit Timeline</span>
        </h3>

        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {(complaint.timeline || []).map((t, idx) => (
            <div key={idx} className="relative text-xs">
              <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-civic-500 border-2 border-slate-900" />
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white uppercase">{t.event.replace('_', ' ')}</span>
                <span className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleString()}</span>
                <span className="text-[10px] font-mono text-slate-400">Actor: {t.actor}</span>
              </div>
              {t.notes && <p className="text-slate-300 mt-1 text-[11px]">{t.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Admin Resolution Override</span>
            </h3>

            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Official Resolution Description</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Remediation steps completed..."
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setResolveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" size="sm" loading={resolving}>
                  Confirm & Resolve
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
