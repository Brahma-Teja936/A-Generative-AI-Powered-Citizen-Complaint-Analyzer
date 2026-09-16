import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, SeverityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  CheckCircle2, Clock, MapPin, Calendar, Building2, 
  Star, MessageSquare, ArrowLeft, Image as ImageIcon, AlertCircle, Trash2 
} from 'lucide-react';

export const CitizenComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete complaint ${id}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/client/complaints/${id}`);
      alert(`Complaint ${id} deleted successfully.`);
      navigate('/client/complaints');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint.');
    }
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/client/complaints/${id}`);
      setData(res.data);
      if (res.data.feedback) {
        setRating(res.data.feedback.rating);
        setComment(res.data.feedback.comment || '');
        setFeedbackSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.post(`/client/complaints/${id}/feedback`, { rating, comment });
      setFeedbackSuccess(true);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading complaint details...</div>;
  }

  const c = data?.complaint;
  if (!c) {
    return <div className="text-center py-20 text-rose-400 text-xs">Complaint not found.</div>;
  }

  const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/client/complaints" className="inline-flex items-center text-xs text-slate-400 hover:text-white space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs text-slate-400">ID: {c.complaint_id}</span>
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

      {/* Main Status & Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-civic-400">{c.complaint_id}</span>
            <StatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
            <UrgencyBadge urgency={c.urgency} />
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Filed on {new Date(c.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">{c.title}</h2>
          <div className="mt-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
            <div>
              <span className="font-semibold text-slate-400">Citizen Description: </span>
              {c.original_text}
            </div>
            {c.translated_text_en && c.original_language !== 'en' && (
              <div className="pt-2 border-t border-slate-800 text-slate-300">
                <span className="font-semibold text-civic-400">AI English Translation: </span>
                {c.translated_text_en}
              </div>
            )}
          </div>
        </div>

        {/* Location & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
            <Building2 className="w-4 h-4 text-civic-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-400">Assigned Department</div>
              <div className="font-bold text-white mt-0.5">{c.department || 'Processing Assignment'}</div>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-400">Location</div>
              <div className="font-medium text-slate-200 mt-0.5">{c.location?.address || 'GPS Coordinates Logged'}</div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {c.attachments && c.attachments.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-civic-400" />
              <span>Evidence Attachments</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={`/${att}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-civic-400 border border-slate-800 inline-flex items-center space-x-1"
                >
                  <span>Attachment #{idx + 1}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Card (if resolved) */}
      {isResolved && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Official Resolution</h3>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-emerald-900/40">
            {c.resolution_description || 'Work completed and verified by municipal operations.'}
          </p>
          <div className="text-[11px] text-slate-400">
            Resolved on {c.resolved_at ? new Date(c.resolved_at).toLocaleString() : 'N/A'}
          </div>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-civic-400" />
          <span>Incident Progression Timeline</span>
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {(c.timeline || []).map((t, idx) => (
            <div key={idx} className="relative text-xs">
              <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-civic-500 border-2 border-slate-900" />
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white uppercase">{t.event.replace('_', ' ')}</span>
                <span className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleString()}</span>
              </div>
              {t.notes && <p className="text-slate-300 mt-1 text-[11px]">{t.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Feedback Form (After resolution) */}
      {isResolved && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Citizen Feedback on Resolution</span>
          </h3>

          {feedbackSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
              Thank you! Your feedback has been recorded for municipal accountability.
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Satisfaction Rating (1-5 Stars)</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-lg border transition ${
                      rating >= star
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Your Feedback Comments</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the resolution speed and work quality?"
                className="w-full bg-slate-950 text-slate-200 p-3 rounded-xl border border-slate-800 outline-none"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" loading={submittingFeedback}>
              Submit Citizen Feedback
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
