import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import GlobalSearch from './components/GlobalSearch';
import ThemeToggle from './components/ThemeToggle';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import OnboardingTour from './components/OnboardingTour';
import RecentActivitySidebar from './components/RecentActivitySidebar';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
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
import PaymentHistory from './pages/PaymentHistory';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookingPortal from './pages/BookingPortal';
import CustomerPortal from './pages/CustomerPortal';
import SubmitReview from './pages/SubmitReview';
import ManageBooking from './pages/ManageBooking';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Waitlist from './pages/Waitlist';
import Locations from './pages/Locations';
import Payroll from './pages/Payroll';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import LoyaltyProgram from './pages/LoyaltyProgram';
import CustomForms from './pages/CustomForms';
import Referrals from './pages/Referrals';
import FollowUps from './pages/FollowUps';
import Analytics from './pages/Analytics';
import Tags from './pages/Tags';
import Team from './pages/Team';
import WorkOrders from './pages/WorkOrders';
import Checklists from './pages/Checklists';
import Contracts from './pages/Contracts';
import AuditLog from './pages/AuditLog';
import Equipment from './pages/Equipment';
import ServiceZones from './pages/ServiceZones';
import EmailTemplates from './pages/EmailTemplates';
import SMSTemplates from './pages/SMSTemplates';
import RecurringBookings from './pages/RecurringBookings';
import RevenueForecast from './pages/RevenueForecast';
import GiftCards from './pages/GiftCards';
import CustomerSegments from './pages/CustomerSegments';
import StaffCertifications from './pages/StaffCertifications';
import PackageBuilder from './pages/PackageBuilder';
import BusinessHoursExceptions from './pages/BusinessHoursExceptions';
import CustomerSurveys from './pages/CustomerSurveys';
import KnowledgeBase from './pages/KnowledgeBase';
import CapacityPlanning from './pages/CapacityPlanning';
import PriceRules from './pages/PriceRules';
import Deposits from './pages/Deposits';
import Suppliers from './pages/Suppliers';
import SLAs from './pages/SLAs';
import AutoScheduler from './pages/AutoScheduler';
import ResourceOptimization from './pages/ResourceOptimization';
import PerformanceScorecard from './pages/PerformanceScorecard';
import MultiLocationDashboard from './pages/MultiLocationDashboard';
import ReviewDashboard from './pages/ReviewDashboard';
import SetupWizard from './components/SetupWizard';
import MagicSetup from './components/MagicSetup';

type Page = 'dashboard' | 'bookings' | 'leads' | 'customers' | 'service-providers' | 'payouts' | 'invoices' | 'providers-activity' | 'coupons' | 'services' | 'marketing' | 'reports' | 'schedule' | 'quotes' | 'reviews' | 'review-dashboard' | 'settings' | 'notification-settings' | 'schedule-settings' | 'payment-settings' | 'portal-settings' | 'integration-settings' | 'payment-history' | 'inventory' | 'expenses' | 'waitlist' | 'locations' | 'payroll' | 'notifications' | 'messages' | 'loyalty' | 'custom-forms' | 'referrals' | 'follow-ups' | 'analytics' | 'tags' | 'team' | 'work-orders' | 'checklists' | 'contracts' | 'audit-log' | 'equipment' | 'service-zones' | 'email-templates' | 'sms-templates' | 'recurring-bookings' | 'revenue-forecast' | 'gift-cards' | 'customer-segments' | 'staff-certifications' | 'package-builder' | 'business-hours-exceptions' | 'customer-surveys' | 'knowledge-base' | 'capacity-planning' | 'price-rules' | 'deposits' | 'suppliers' | 'slas' | 'auto-scheduler' | 'resource-optimization' | 'performance-scorecard' | 'multi-location';

function MainApp({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showWelcome, setShowWelcome] = useState(false);
  const { needsSetup, refreshTenants, tenant, loading } = useTenant();

  const handleSetupComplete = async () => {
    await refreshTenants();
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (needsSetup) {
    return <MagicSetup onComplete={handleSetupComplete} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={(p) => setCurrentPage(p as Page)} />;
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
      case 'review-dashboard': return <ReviewDashboard />;
      case 'settings': return <Settings />;
      case 'notification-settings': return <NotificationSettings />;
      case 'schedule-settings': return <ScheduleSettings />;
      case 'payment-settings': return <PaymentSettings />;
      case 'portal-settings': return <PortalSettings />;
      case 'integration-settings': return <IntegrationSettings />;
      case 'payment-history': return <PaymentHistory />;
      case 'inventory': return <Inventory />;
      case 'expenses': return <Expenses />;
      case 'waitlist': return <Waitlist />;
      case 'locations': return <Locations />;
      case 'payroll': return <Payroll />;
      case 'notifications': return <Notifications />;
      case 'messages': return <Messages />;
      case 'loyalty': return <LoyaltyProgram />;
      case 'custom-forms': return <CustomForms />;
      case 'referrals': return <Referrals />;
      case 'follow-ups': return <FollowUps />;
      case 'analytics': return <Analytics />;
      case 'tags': return <Tags />;
      case 'team': return <Team />;
      case 'work-orders': return <WorkOrders />;
      case 'checklists': return <Checklists />;
      case 'contracts': return <Contracts />;
      case 'audit-log': return <AuditLog />;
      case 'equipment': return <Equipment />;
      case 'service-zones': return <ServiceZones />;
      case 'email-templates': return <EmailTemplates />;
      case 'sms-templates': return <SMSTemplates />;
      case 'recurring-bookings': return <RecurringBookings />;
      case 'revenue-forecast': return <RevenueForecast />;
      case 'gift-cards': return <GiftCards />;
      case 'customer-segments': return <CustomerSegments />;
      case 'staff-certifications': return <StaffCertifications />;
      case 'package-builder': return <PackageBuilder />;
      case 'business-hours-exceptions': return <BusinessHoursExceptions />;
      case 'customer-surveys': return <CustomerSurveys />;
      case 'knowledge-base': return <KnowledgeBase />;
      case 'capacity-planning': return <CapacityPlanning />;
      case 'price-rules': return <PriceRules />;
      case 'deposits': return <Deposits />;
      case 'suppliers': return <Suppliers />;
      case 'slas': return <SLAs />;
      case 'auto-scheduler': return <AutoScheduler />;
      case 'resource-optimization': return <ResourceOptimization />;
      case 'performance-scorecard': return <PerformanceScorecard />;
      case 'multi-location': return <MultiLocationDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <KeyboardShortcuts onNavigate={(p) => setCurrentPage(p as Page)} />
      <OnboardingTour />
      <RecentActivitySidebar />
      <SessionTimeoutWarning timeoutMinutes={30} warningMinutes={1} onTimeout={onLogout} />
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 relative">
              {showWelcome && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
                  🎉 Welcome to {tenant?.name}! Your business is all set up.
                </div>
              )}
              <div className="lg:hidden w-10" />
              <HeaderContent onNavigate={(p) => setCurrentPage(p as Page)} />
            </header>
            {/* Main content */}
            <main className="flex-1 overflow-auto">
              {renderPage()}
            </main>
          </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { signOut } = useAuth();
  return (
    <TenantProvider>
      <ToastProvider>
        <MainApp onLogout={signOut} />
      </ToastProvider>
    </TenantProvider>
  );
}

function HeaderContent({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { tenant } = useTenant();
  return (
    <>
      <GlobalSearch tenantId={tenant?.id} onNavigate={onNavigate} />
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </>
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

  // Handle customer portal route
  if (window.location.pathname.startsWith('/portal')) {
    return <ToastProvider><CustomerPortal /></ToastProvider>;
  }

  // Handle review submission route
  if (window.location.pathname.startsWith('/review')) {
    return <ToastProvider><SubmitReview /></ToastProvider>;
  }

  // Handle manage booking route (reschedule/cancel)
  if (window.location.pathname.startsWith('/manage')) {
    return <ToastProvider><ManageBooking /></ToastProvider>;
  }

  // Handle magic setup route - entry point for new users
  if (window.location.pathname.startsWith('/setup')) {
    // If not logged in, show signup first then redirect to setup
    if (!user && !loading) {
      return (
        <ToastProvider>
          <Signup onSwitchToLogin={() => setAuthView('login')} />
        </ToastProvider>
      );
    }
    // If logged in, show magic setup
    if (user) {
      return (
        <TenantProvider>
          <ToastProvider>
            <MagicSetup onComplete={() => window.location.href = '/'} />
          </ToastProvider>
        </TenantProvider>
      );
    }
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
