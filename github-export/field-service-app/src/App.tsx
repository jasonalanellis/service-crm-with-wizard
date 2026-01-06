import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ScheduleView } from './components/ScheduleView';
import { JobDetail } from './components/JobDetail';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Job, ScheduleResponse } from './types';
import { fetchSchedule } from './api';

function App() {
  const [technicianId, setTechnicianId] = useState<string | null>(() => 
    localStorage.getItem('technician_id')
  );
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSchedule = async (id: string) => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().split('T')[0];
    try {
      const data = await fetchSchedule(id, today);
      setSchedule(data);
      localStorage.setItem('cached_schedule', JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem('cached_schedule');
      if (cached) {
        setSchedule(JSON.parse(cached));
        setError('Using cached data - unable to refresh');
      } else {
        setError('Failed to load schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (id: string) => {
    localStorage.setItem('technician_id', id);
    setTechnicianId(id);
    loadSchedule(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('technician_id');
    setTechnicianId(null);
    setSchedule(null);
  };

  const refreshSchedule = () => {
    if (technicianId) loadSchedule(technicianId);
  };

  useEffect(() => {
    if (technicianId) loadSchedule(technicianId);
  }, []);

  if (!technicianId) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (selectedJob) {
    return (
      <>
        <OfflineIndicator isOnline={isOnline} />
        <JobDetail 
          job={selectedJob} 
          onBack={() => setSelectedJob(null)} 
          onUpdate={refreshSchedule}
        />
      </>
    );
  }

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <ScheduleView
        schedule={schedule}
        loading={loading}
        error={error}
        onSelectJob={setSelectedJob}
        onRefresh={refreshSchedule}
        onLogout={handleLogout}
      />
    </>
  );
}

export default App;
