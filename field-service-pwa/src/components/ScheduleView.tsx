import { RefreshCw, LogOut, MapPin, Clock } from 'lucide-react';
import { Job, ScheduleResponse } from '../types';

interface Props {
  schedule: ScheduleResponse | null;
  loading: boolean;
  error: string | null;
  onSelectJob: (job: Job) => void;
  onRefresh: () => void;
  onLogout: () => void;
}

const statusColors = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusBg = {
  scheduled: 'bg-blue-50 border-blue-200',
  in_progress: 'bg-amber-50 border-amber-200',
  completed: 'bg-green-50 border-green-200',
  cancelled: 'bg-red-50 border-red-200',
};

export function ScheduleView({ schedule, loading, error, onSelectJob, onRefresh, onLogout }: Props) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-500 text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Today's Schedule</h1>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        {schedule && (
          <p className="text-blue-100 text-sm mt-1">
            {new Date(schedule.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })} - {schedule.total_jobs} jobs
          </p>
        )}
      </header>

      <main className="p-4">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {loading && !schedule && (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {schedule?.schedule.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No jobs scheduled for today
          </div>
        )}

        <div className="space-y-3">
          {schedule?.schedule.map((job) => (
            <button
              key={job.appointment_id}
              onClick={() => onSelectJob(job)}
              className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm active:shadow-none transition-shadow ${statusBg[job.status]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-full min-h-[60px] rounded-full ${statusColors[job.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 truncate">
                      {job.customer.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColors[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{job.job_type}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(job.scheduled_time)}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{job.customer.address}</span>
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
