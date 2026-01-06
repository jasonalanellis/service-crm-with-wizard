import { useState } from 'react';
import { TenantProvider } from './context/TenantContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Schedule from './pages/Schedule';
import Quotes from './pages/Quotes';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

type Page = 'dashboard' | 'leads' | 'customers' | 'schedule' | 'quotes' | 'reviews' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'leads': return <Leads />;
      case 'customers': return <Customers />;
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
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          <main className="flex-1 overflow-auto lg:ml-0">
            <div className="lg:hidden h-16" />
            {renderPage()}
          </main>
        </div>
      </ToastProvider>
    </TenantProvider>
  );
}

export default App;
