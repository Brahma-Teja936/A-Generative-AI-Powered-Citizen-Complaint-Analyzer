import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { EmergencyMap } from '../../components/maps/EmergencyMap';
import { SeverityBadge, UrgencyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  ShieldAlert, AlertTriangle, Phone, Flame, Truck, 
  Activity, CheckCircle2, Clock, MapPin, Eye, Radio, RefreshCw 
} from 'lucide-react';

export const EmergencyCommandCenter = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [nearestServices, setNearestServices] = useState([]);
  const [actions, setActions] = useState([]);
  const [servicesDirectory, setServicesDirectory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirmation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState('AMBULANCE');
  const [selectedService, setSelectedService] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Resolution Modal State
  const [resolveModal, setResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const fetchIncidents = async () => {
    try {
      const [incRes, dirRes] = await Promise.all([
        api.get('/admin/emergency'),
        api.get('/admin/emergency/services')
      ]);
      const incList = incRes.data.incidents || [];
      setIncidents(incList);
      setServicesDirectory(dirRes.data.services || []);

      if (incList.length > 0 && !selectedIncident) {
        loadIncidentDetails(incList[0].complaint_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadIncidentDetails = async (cid) => {
    try {
      const res = await api.get(`/admin/emergency/${cid}`);
      setSelectedIncident(res.data.incident);
      setNearestServices(res.data.nearest_services || []);
      setActions(res.data.actions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  const handleOpenConfirm = (svcType, svcObj = null) => {
    setActionType(svcType);
    setSelectedService(svcObj);
    setActionNotes(`Emergency responder dispatch authorized for incident ${selectedIncident?.complaint_id}.`);
    setModalOpen(true);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setDispatching(true);

    try {
      const serviceId = selectedService ? (selectedService.service_id || selectedService.id) : `EMS-GENERIC-${actionType}`;
      await api.post(`/admin/emergency/${selectedIncident.complaint_id}/contact-service`, {
        service_id: serviceId,
        service_type: actionType,
        notes: actionNotes
      });

      setModalOpen(false);
      loadIncidentDetails(selectedIncident.complaint_id);
      fetchIncidents();
      alert(`Dispatch order logged for ${actionType}. Emergency responder alerted.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record emergency dispatch.');
    } finally {
      setDispatching(false);
    }
  };

  const handleAcknowledge = async (actionId) => {
    try {
      await api.post(`/admin/emergency/actions/${actionId}/acknowledge`, {
        notes: 'Service dispatcher acknowledged and dispatched response unit.'
      });
      loadIncidentDetails(selectedIncident.complaint_id);
    } catch (err) {
      alert('Failed to record acknowledgment.');
    }
  };

  const handleResolveEmergency = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      await api.post(`/admin/emergency/${selectedIncident.complaint_id}/resolve`, {
        notes: resolveNotes || 'Emergency hazard stabilized and contained.'
      });
      setResolveModal(false);
      loadIncidentDetails(selectedIncident.complaint_id);
      fetchIncidents();
      alert('Incident marked as EMERGENCY RESOLVED.');
    } catch (err) {
      alert('Failed to resolve emergency.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 text-xs">Connecting to Emergency Operations Grid...</div>;
  }

  const coords = selectedIncident?.location?.coordinates || [78.4867, 17.3850];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-950/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-950/80 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Emergency Command Center</span>
              <span className="flex items-center space-x-1 text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>GRID ACTIVE</span>
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Authorized multi-agency civic disaster, fire, rescue, and health emergency coordination
            </p>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={fetchIncidents}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Live Grid
        </Button>
      </div>

      {/* Grid: Left Incidents Column, Right Action Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Incidents */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider">Critical Incidents ({incidents.length})</span>
            <span>Live Sync</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {incidents.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                No active critical incidents reported in the civic grid.
              </div>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.complaint_id === inc.complaint_id;
                return (
                  <div
                    key={inc.complaint_id}
                    onClick={() => loadIncidentDetails(inc.complaint_id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition text-xs space-y-2 ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/40'
                        : 'glass-card border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-400">{inc.complaint_id}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {inc.emergency_status || 'DETECTED'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-white truncate">{inc.title}</h4>
                    <p className="text-slate-400 text-[11px] line-clamp-2">
                      {inc.translated_text_en || inc.original_text}
                    </p>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                      <span>{inc.location?.area || 'GPS Location'}</span>
                      <span>{new Date(inc.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Incident Operations Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedIncident ? (
            <>
              {/* Active Incident Header */}
              <div className="glass-panel p-5 rounded-3xl border border-rose-900/60 bg-rose-950/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-900/40 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-black text-rose-400">{selectedIncident.complaint_id}</span>
                    <SeverityBadge severity={selectedIncident.severity} />
                    <UrgencyBadge urgency={selectedIncident.urgency} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-mono">Status: </span>
                    <span className="text-xs font-bold text-rose-300 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-lg">
                      {selectedIncident.emergency_status || 'DETECTED'}
                    </span>
                    <Button variant="success" size="sm" onClick={() => setResolveModal(true)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Resolve Incident
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{selectedIncident.title}</h3>
                  <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
                    <div><b>Citizen Raw Text:</b> {selectedIncident.original_text}</div>
                    {selectedIncident.translated_text_en && selectedIncident.original_language !== 'en' && (
                      <div className="mt-1 text-civic-300"><b>AI Translation:</b> {selectedIncident.translated_text_en}</div>
                    )}
                  </div>
                </div>

                {/* Quick Action Dispatch Buttons */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Authorized First Responder Dispatch</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                      variant="emergency"
                      size="sm"
                      onClick={() => handleOpenConfirm('AMBULANCE')}
                      className="py-2.5 text-xs font-bold"
                    >
                      🚑 Ambulance
                    </Button>
                    <Button
                      variant="emergency"
                      size="sm"
                      onClick={() => handleOpenConfirm('POLICE')}
                      className="py-2.5 text-xs font-bold"
                    >
                      🚔 Police Patrol
                    </Button>
                    <Button
                      variant="emergency"
                      size="sm"
                      onClick={() => handleOpenConfirm('FIRE_RESCUE')}
                      className="py-2.5 text-xs font-bold"
                    >
                      🚒 Fire & Rescue
                    </Button>
                    <Button
                      variant="emergency"
                      size="sm"
                      onClick={() => handleOpenConfirm('HOSPITAL')}
                      className="py-2.5 text-xs font-bold"
                    >
                      🏥 Hospital ER
                    </Button>
                  </div>
                </div>
              </div>

              {/* Emergency Map with Live Responders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Incident Proximity & Responders Map</span>
                  <span>Coordinates: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}</span>
                </div>
                <EmergencyMap
                  incidents={[selectedIncident]}
                  services={servicesDirectory}
                  center={[coords[1], coords[0]]}
                  zoom={13}
                />
              </div>

              {/* Nearest Responders Directory (Geospatial Calculated) */}
              <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nearest Emergency Services (Geospatial Proximity)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {nearestServices.map((svc) => (
                    <div key={svc.service_id || svc.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{svc.organization_name}</div>
                        <div className="text-slate-400 text-[11px]">{svc.service_type} &bull; 📞 {svc.phone}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{svc.address}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-civic-400 text-sm">{svc.distance_km} km</div>
                        <button
                          onClick={() => handleOpenConfirm(svc.service_type, svc)}
                          className="mt-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition"
                        >
                          Dispatch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatch Action Log & Acknowledgement */}
              <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Dispatched Emergency Actions Log ({actions.length})
                </h4>
                {actions.length === 0 ? (
                  <div className="text-slate-500 text-xs py-2">No responder actions dispatched yet.</div>
                ) : (
                  <div className="space-y-2">
                    {actions.map((act) => (
                      <div key={act.id || act._id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{act.action}</div>
                          <div className="text-[11px] text-slate-400">Notes: {act.notes}</div>
                          <div className="text-[10px] text-slate-500">Initiated: {new Date(act.initiated_at).toLocaleTimeString()}</div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            act.status === 'SERVICE_ACKNOWLEDGED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {act.status}
                          </span>
                          {act.status !== 'SERVICE_ACKNOWLEDGED' && (
                            <Button variant="secondary" size="sm" onClick={() => handleAcknowledge(act.id || act._id)}>
                              Confirm Ack
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs">
              Select an incident from the left panel to open tactical command controls.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal (Section 43) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-rose-600/60 shadow-2xl shadow-rose-950/50 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <h3 className="text-base font-bold text-white">Confirm Emergency Action</h3>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-200">
              <b>Critical Incident Detected.</b> You are authorizing dispatch coordination for <b>{actionType}</b>.
            </div>

            <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div><span className="text-slate-400">Complaint ID:</span> <b className="text-white font-mono">{selectedIncident?.complaint_id}</b></div>
              <div><span className="text-slate-400">Location:</span> <span className="text-white">{selectedIncident?.location?.address}</span></div>
              <div><span className="text-slate-400">Service:</span> <span className="text-civic-400 font-bold">{selectedService ? selectedService.organization_name : `Generic Emergency Grid (${actionType})`}</span></div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Dispatch Authorization Order Notes</label>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="emergency" size="sm" loading={dispatching}>
                  Confirm Emergency Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Incident Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Mark Emergency Resolved</span>
            </h3>

            <form onSubmit={handleResolveEmergency} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Emergency De-escalation Notes</label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Scene secured, victims treated, power isolated..."
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setResolveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" size="sm">
                  De-escalate & Resolve
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
