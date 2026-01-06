import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { ScheduleView } from './components/ScheduleView';
import { JobDetail } from './components/JobDetail';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Job, ScheduleResponse } from './types';
import { fetchSchedule } from './api';
import { supabase } from './lib/supabase';

function AuthenticatedApp() {
  const { user, signOut } = useAuth();
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Get technician ID from user_profiles based on auth user
  useEffect(() => {
    async function getTechnicianId() {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (data) {
        setTechnicianId(data.id);
      } else {
        // For now, use user.id as fallback or the first available technician
        const { data: techData } = await supabase
          .from('technicians')
          .select('id')
          .limit(1)
          .single();
        if (techData) setTechnicianId(techData.id);
      }
      setLoading(false);
    }
    getTechnicianId();
  }, [user]);

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

  const handleLogout = async () => {
    localStorage.removeItem('cached_schedule');
    await signOut();
  };

  const refreshSchedule = () => {
    if (technicianId) loadSchedule(technicianId);
  };

  useEffect(() => {
    if (technicianId) loadSchedule(technicianId);
  }, [technicianId]);

  if (loading && !schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
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

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
