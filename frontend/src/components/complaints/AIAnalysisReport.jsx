import React, { useState } from 'react';
import { SeverityBadge, PriorityBadge, UrgencyBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Sparkles, AlertTriangle, CheckCircle, ShieldAlert, Users, 
  Clock, Activity, Layers, Copy, FileText, ChevronDown, ChevronUp 
} from 'lucide-react';

export const AIAnalysisReport = ({ 
  complaint, 
  onSaveDecision, 
  isAdmin = false, 
  departments = [] 
}) => {
  const ai = complaint?.ai_prediction || {};
  const decision = complaint?.final_admin_decision;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    accepted_ai: !decision || decision.accepted_ai !== false,
    department: decision?.department || ai?.primary_department || complaint?.department || '',
    secondary_department: decision?.secondary_department || ai?.secondary_department || '',
    category: decision?.category || ai?.complaint_category || complaint?.category || '',
    subcategory: decision?.subcategory || ai?.subcategory || complaint?.subcategory || '',
    severity: decision?.severity || ai?.severity || complaint?.severity || 'MEDIUM',
    priority: decision?.priority || ai?.priority || complaint?.priority || 'MEDIUM',
    urgency: decision?.urgency || ai?.urgency || complaint?.urgency || 'WITHIN 3 DAYS',
    safety_risk: decision?.safety_risk || ai?.safety_risk || 'MEDIUM',
    public_impact: decision?.public_impact || ai?.public_impact || 'MODERATE',
    response_time: decision?.response_time || ai?.recommended_response_time || '',
    admin_notes: decision?.admin_notes || '',
    override_reason: decision?.override_reason || ''
  });
  const [saving, setSaving] = useState(false);

  const handleAcceptAI = async () => {
    setSaving(true);
    try {
      await onSaveDecision({
        accepted_ai: true,
        department: ai?.primary_department || complaint?.department,
        secondary_department: ai?.secondary_department,
        category: ai?.complaint_category || complaint?.category,
        subcategory: ai?.subcategory || complaint?.subcategory,
        severity: ai?.severity || complaint?.severity,
        priority: ai?.priority || complaint?.priority,
        urgency: ai?.urgency || complaint?.urgency,
        safety_risk: ai?.safety_risk,
        public_impact: ai?.public_impact,
        response_time: ai?.recommended_response_time,
        admin_notes: 'Administrator verified and accepted AI classification recommendations.'
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!formData.override_reason && !formData.accepted_ai) {
      alert('Please provide an override reason explaining the change from AI prediction.');
      return;
    }
    setSaving(true);
    try {
      await onSaveDecision({
        ...formData,
        accepted_ai: false
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header & Confidence */}
      <div className="glass-panel p-5 rounded-2xl border border-civic-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-civic-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-civic-500/20 border border-civic-500/40 flex items-center justify-center text-civic-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>AI Multilingual Analysis & Classification Report</span>
                <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {ai.model_version || 'xgboost-v1.0'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Source: {ai.prediction_source || 'TF-IDF + XGBoost & Groq Generative AI'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Model Confidence</div>
              <div className="text-lg font-bold text-civic-400 font-mono">
                {ai.ai_confidence ? `${(ai.ai_confidence * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-civic-500 flex items-center justify-center text-xs font-bold font-mono">
              {ai.ai_confidence ? Math.round(ai.ai_confidence * 100) : 0}
            </div>
          </div>
        </div>

        {/* Low Confidence Warning */}
        {ai.is_low_confidence && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center space-x-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{ai.confidence_warning || 'AI classification confidence is below threshold. Manual administrator review is recommended.'}</span>
          </div>
        )}

        {/* Multi-Issue Alert */}
        {ai.multiple_issues_detected && (
          <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center space-x-2 text-xs text-purple-300">
            <Layers className="w-4 h-4 shrink-0 text-purple-400" />
            <div>
              <span className="font-semibold">Multiple Issues Detected: </span>
              <span>{ai.multi_issue_explanation || 'Secondary civic issue found in complaint text. Manual review recommended.'}</span>
            </div>
          </div>
        )}

        {/* AI Executive Summary */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-civic-400" />
            <span>AI Executive Summary</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {ai.ai_summary || complaint.translated_text_en || complaint.original_text}
          </p>
        </div>

        {/* Core Predictions Grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 mb-1">Primary Department</div>
            <div className="font-semibold text-white text-sm">{ai.primary_department || complaint.department || 'Unassigned'}</div>
            {ai.secondary_department && (
              <div className="text-[11px] text-purple-300 mt-1 font-mono">Sec: {ai.secondary_department}</div>
            )}
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 mb-1">Category / Subcategory</div>
            <div className="font-semibold text-white">{ai.complaint_category || complaint.category}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ai.subcategory || complaint.subcategory}</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="text-slate-400 mb-1">Severity & Priority</div>
            <div className="flex flex-wrap gap-1.5">
              <SeverityBadge severity={ai.severity || complaint.severity} />
              <PriorityBadge priority={ai.priority || complaint.priority} />
            </div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="text-slate-400 mb-1">Recommended Response</div>
            <UrgencyBadge urgency={ai.urgency || complaint.urgency} />
          </div>
        </div>

        {/* Public & Safety Impact Details */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Safety Risk & Public Impact</span>
            </div>
            <div className="font-medium text-slate-200">
              Safety: <span className="font-bold text-white">{ai.safety_risk || 'LOW'}</span> | Impact: <span className="font-bold text-white">{ai.public_impact || 'MODERATE'}</span>
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Affected Population</span>
            </div>
            <div className="font-medium text-slate-200">
              {ai.potentially_affected_people || 'Local citizens'} ({ai.affected_groups || 'Commuters'})
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Action</span>
            </div>
            <div className="font-medium text-slate-200 truncate" title={ai.recommended_action}>
              {ai.recommended_action || 'Inspect site'}
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Complaints Section */}
      {ai.possible_duplicates && ai.possible_duplicates.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Copy className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-300">
                Potential Duplicate Complaints Detected ({ai.possible_duplicates.length})
              </h4>
            </div>
            <span className="text-xs text-slate-400">Never automatically merged</span>
          </div>

          <div className="space-y-2">
            {ai.possible_duplicates.map((dup) => (
              <div key={dup.complaint_id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{dup.complaint_id} — {dup.title}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Location: {dup.location_name} {dup.distance_km !== null ? `(${dup.distance_km} km away)` : ''} | Dept: {dup.department}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-400 text-sm">
                    {(dup.similarity_score * 100).toFixed(1)}% match
                  </div>
                  <span className="text-[10px] text-slate-500">{dup.date ? new Date(dup.date).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Review & Override Decision Panel */}
      {isAdmin && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Administrator Review & Decision</h4>
              <p className="text-xs text-slate-400">
                {decision 
                  ? (decision.accepted_ai ? 'Status: Accepted AI Recommendations' : `Status: Overridden by Admin (${decision.overridden_by})`)
                  : 'Action required: Review AI recommendations or modify fields.'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="success"
                size="sm"
                loading={saving}
                onClick={handleAcceptAI}
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Accept AI Recommendations
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {isEditing ? 'Cancel Edit' : 'Override / Modify AI'}
              </Button>
            </div>
          </div>

          {isEditing && (
            <form onSubmit={handleSaveOverride} className="space-y-4 pt-3 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 rounded-lg p-2 border border-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id || d._id} value={d.department_name}>{d.department_name}</option>
                    ))}
                    {!departments.some(d => d.department_name === formData.department) && (
                      <option value={formData.department}>{formData.department}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 rounded-lg p-2 border border-slate-800"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 rounded-lg p-2 border border-slate-800"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="VERY HIGH">VERY HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 rounded-lg p-2 border border-slate-800"
                  >
                    <option value="IMMEDIATE">IMMEDIATE</option>
                    <option value="WITHIN 24 HOURS">WITHIN 24 HOURS</option>
                    <option value="WITHIN 3 DAYS">WITHIN 3 DAYS</option>
                    <option value="WITHIN 7 DAYS">WITHIN 7 DAYS</option>
                    <option value="ROUTINE">ROUTINE</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-rose-400 font-semibold mb-1">Override Reason (Required for Audit Trail)</label>
                  <input
                    type="text"
                    required
                    value={formData.override_reason}
                    onChange={(e) => setFormData({ ...formData, override_reason: e.target.value })}
                    placeholder="e.g. On-site verification confirms critical electrical hazard overlooked by text."
                    className="w-full bg-slate-950 text-slate-200 rounded-lg p-2 border border-rose-900/60 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Internal Admin Notes</label>
                <textarea
                  rows={2}
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                  placeholder="Notes for assigned department or administrative history..."
                  className="w-full bg-slate-950 text-slate-200 rounded-lg p-2 border border-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Save Final Decision
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
