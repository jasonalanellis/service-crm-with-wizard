import { useState } from 'react';
import { ArrowLeft, Phone, MapPin, Clock, Play, CheckCircle, AlertTriangle, Camera, X } from 'lucide-react';
import { Job } from '../types';
import { updateJobStatus } from '../api';
import { DelayPicker } from './DelayPicker';
import { CompletionModal } from './CompletionModal';

interface Props {
  job: Job;
  onBack: () => void;
  onUpdate: () => void;
}

const statusColors = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export function JobDetail({ job, onBack, onUpdate }: Props) {
  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await updateJobStatus(job.appointment_id, 'start');
      onUpdate();
      onBack();
    } catch {
      alert('Failed to start job');
    } finally {
      setLoading(false);
    }
  };

  const handleDelay = async (minutes: 15 | 30 | 45 | 60) => {
    setLoading(true);
    try {
      await updateJobStatus(job.appointment_id, 'delay', { minutes });
      setShowDelayPicker(false);
      alert(`Customer notified of ${minutes} minute delay`);
    } catch {
      alert('Failed to send delay notification');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (notes: string, photos: string[]) => {
    setLoading(true);
    try {
      await updateJobStatus(job.appointment_id, 'complete', { notes, photos });
      setShowCompletion(false);
      onUpdate();
      onBack();
    } catch {
      alert('Failed to complete job');
    } finally {
      setLoading(false);
    }
  };

  const industryFields = Object.entries(job.customer.industry_fields || {});

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-500 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-blue-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold truncate">{job.customer.name}</h1>
            <p className="text-blue-100 text-sm">{job.job_type}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColors[job.status]}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
      </header>

      <main className="p-4 pb-32">
        {/* Time & Duration */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>{formatTime(job.scheduled_time)}</span>
            <span className="text-gray-400">-</span>
            <span>{job.estimated_duration} min</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 font-semibold text-gray-900">Contact</h2>
          <a
            href={`tel:${job.customer.phone}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-t"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{job.customer.phone}</p>
              <p className="text-sm text-gray-500">Tap to call</p>
            </div>
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(job.customer.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-t"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{job.customer.address}</p>
              <p className="text-sm text-gray-500">Tap for directions</p>
            </div>
          </a>
        </div>

        {/* Industry Fields */}
        {industryFields.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Details</h2>
            <div className="space-y-2">
              {industryFields.map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-900 font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Job Notes</h2>
            <p className="text-gray-600">{job.notes}</p>
          </div>
        )}

        {job.internal_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-amber-800 mb-2">Internal Notes</h2>
            <p className="text-amber-700">{job.internal_notes}</p>
          </div>
        )}
      </main>

      {/* Action Buttons */}
      {job.status !== 'completed' && job.status !== 'cancelled' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-2">
          {job.status === 'scheduled' && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 active:bg-blue-600 disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              Start Job
            </button>
          )}
          {job.status === 'in_progress' && (
            <button
              onClick={() => setShowCompletion(true)}
              disabled={loading}
              className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 active:bg-green-600 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Job
            </button>
          )}
          <button
            onClick={() => setShowDelayPicker(true)}
            disabled={loading}
            className="w-full py-4 bg-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 active:bg-amber-600 disabled:opacity-50"
          >
            <AlertTriangle className="w-5 h-5" />
            Running Late
          </button>
        </div>
      )}

      {showDelayPicker && (
        <DelayPicker
          onSelect={handleDelay}
          onClose={() => setShowDelayPicker(false)}
          loading={loading}
        />
      )}

      {showCompletion && (
        <CompletionModal
          onComplete={handleComplete}
          onClose={() => setShowCompletion(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
