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
import ProvidersActivity from './pages/ProvidersActivity';
import Coupons from './pages/Coupons';
import Services from './pages/Services';
import Marketing from './pages/Marketing';
import Reports from './pages/Reports';
import Schedule from './pages/Schedule';
import Quotes from './pages/Quotes';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import NotificationSettings from './pages/NotificationSettings';
import ScheduleSettings from './pages/ScheduleSettings';
import PaymentSettings from './pages/PaymentSettings';
import PortalSettings from './pages/PortalSettings';
import IntegrationSettings from './pages/IntegrationSettings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookingPortal from './pages/BookingPortal';

type Page = 'dashboard' | 'bookings' | 'leads' | 'customers' | 'service-providers' | 'payouts' | 'invoices' | 'providers-activity' | 'coupons' | 'services' | 'marketing' | 'reports' | 'schedule' | 'quotes' | 'reviews' | 'settings' | 'notification-settings' | 'schedule-settings' | 'payment-settings' | 'portal-settings' | 'integration-settings';

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
      case 'providers-activity': return <ProvidersActivity />;
      case 'coupons': return <Coupons />;
      case 'services': return <Services />;
      case 'marketing': return <Marketing />;
      case 'reports': return <Reports />;
      case 'schedule': return <Schedule />;
      case 'quotes': return <Quotes />;
      case 'reviews': return <Reviews />;
      case 'settings': return <Settings />;
      case 'notification-settings': return <NotificationSettings />;
      case 'schedule-settings': return <ScheduleSettings />;
      case 'payment-settings': return <PaymentSettings />;
      case 'portal-settings': return <PortalSettings />;
      case 'integration-settings': return <IntegrationSettings />;
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

  // Handle public booking portal route
  if (window.location.pathname.startsWith('/book')) {
    const tenantId = new URLSearchParams(window.location.search).get('tenant');
    if (tenantId) {
      return <TenantProvider explicitTenantId={tenantId}><ToastProvider><BookingPortal /></ToastProvider></TenantProvider>;
    }
    return <div className="p-8 text-center text-gray-600">Tenant ID not specified. Please use a valid booking link.</div>;
  }

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
