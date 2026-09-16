import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { VoiceInput } from '../../components/complaints/VoiceInput';
import { LocationPicker } from '../../components/maps/LocationPicker';
import { Button } from '../../components/ui/Button';
import { Send, UploadCloud, AlertCircle, FileText, Calendar, Clock } from 'lucide-react';

export const NewComplaint = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputMethod, setInputMethod] = useState('TEXT');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState(new Date().toTimeString().slice(0, 5));
  const [location, setLocation] = useState({
    address: 'MG Road, Hyderabad',
    area: 'Central Zone',
    city: 'Hyderabad',
    state: 'Telangana',
    postal_code: '500003',
    latitude: 17.3850,
    longitude: 78.4867
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVoiceTranscription = (text) => {
    setDescription(text);
    setInputMethod('VOICE');
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a brief title for your complaint.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide the complaint details via voice or text.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('input_method', inputMethod);
      formData.append('incident_date', incidentDate);
      formData.append('incident_time', incidentTime);
      formData.append('address', location.address || '');
      formData.append('area', location.area || '');
      formData.append('city', location.city || 'Hyderabad');
      formData.append('state', location.state || 'Telangana');
      formData.append('postal_code', location.postal_code || '');
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await api.post('/client/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newCmp = res.data;
      navigate(`/client/complaints/${newCmp.complaint_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-extrabold text-white">File a Civic Complaint</h2>
        <p className="text-xs text-slate-400 mt-1">
          Speak in Telugu, Hindi, or English or type below. AI will automatically translate and route to the concerned municipal department.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/60 flex items-center space-x-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-civic-400" />
              <span>Complaint Title / Main Subject</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken transformer sparking near school entrance"
              className="w-full bg-slate-950 text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-civic-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Incident Date</span>
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Incident Time</span>
              </label>
              <input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Voice & Multilingual Input */}
        <VoiceInput
          initialText={description}
          onTranscriptionChange={handleVoiceTranscription}
        />

        {/* Location Intelligence */}
        <LocationPicker
          initialCoords={[location.latitude, location.longitude]}
          onLocationChange={(newLoc) => setLocation(newLoc)}
        />

        {/* Attachments Upload */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <UploadCloud className="w-4 h-4 text-civic-400" />
            <span>Upload Photo or Evidence (Optional)</span>
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.mp4"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
          />
          {files.length > 0 && (
            <div className="text-[11px] text-slate-400 mt-1">
              Selected {files.length} file(s): {files.map(f => f.name).join(', ')}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/client/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Complaint
          </Button>
        </div>
      </form>
    </div>
  );
};
