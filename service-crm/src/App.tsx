import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import ServiceProviders from './pages/ServiceProviders';
import Payouts from './pages/Payouts';
import Invoices from './pages/Invoices';
import Schedule from './pages/Schedule';
import Quotes from './pages/Quotes';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

type Page = 'dashboard' | 'bookings' | 'leads' | 'customers' | 'service-providers' | 'payouts' | 'invoices' | 'schedule' | 'quotes' | 'reviews' | 'settings';

function AuthenticatedApp() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { signOut } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'bookings': return <Bookings />;
      case 'leads': return <Leads />;
      case 'customers': return <Customers />;
      case 'service-providers': return <ServiceProviders />;
      case 'payouts': return <Payouts />;
      case 'invoices': return <Invoices />;
      case 'schedule': return <Schedule />;
      case 'quotes': return <Quotes />;
      case 'reviews': return <Reviews />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <TenantProvider>
      <ToastProvider>
        <div className="flex h-screen bg-gray-100">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={signOut} />
          <main className="flex-1 overflow-auto lg:ml-0">
            <div className="lg:hidden h-16" />
            {renderPage()}
          </main>
        </div>
      </ToastProvider>
    </TenantProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' 
      ? <Login onSwitchToSignup={() => setAuthView('signup')} />
      : <Signup onSwitchToLogin={() => setAuthView('login')} />;
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
