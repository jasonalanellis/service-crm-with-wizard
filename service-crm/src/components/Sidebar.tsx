import { LayoutDashboard, Users, UserPlus, Calendar, CalendarCheck, FileText, Star, Settings, Menu, X, LogOut, Wrench, Wallet, Receipt, Activity, Tag, Package, Megaphone, BarChart3, Bell, Clock, CreditCard, Globe, Plug, Box, DollarSign, ClockIcon, MapPin, Banknote, MessageSquare, Gift, ClipboardList, Share2, RefreshCw, TrendingUp, UsersRound, FileSignature, CheckSquare, History, HardDrive, Map } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useState } from 'react';

type Page = 'dashboard' | 'bookings' | 'leads' | 'customers' | 'service-providers' | 'providers-activity' | 'payouts' | 'invoices' | 'payment-history' | 'coupons' | 'services' | 'marketing' | 'reports' | 'schedule' | 'quotes' | 'reviews' | 'settings' | 'notification-settings' | 'schedule-settings' | 'payment-settings' | 'portal-settings' | 'integration-settings' | 'inventory' | 'expenses' | 'waitlist' | 'locations' | 'payroll' | 'notifications' | 'messages' | 'loyalty' | 'custom-forms' | 'referrals' | 'follow-ups' | 'analytics' | 'tags' | 'team' | 'work-orders' | 'checklists' | 'contracts' | 'audit-log' | 'equipment' | 'service-zones';

type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout?: () => void;
};

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'service-providers', label: 'Service Providers', icon: Wrench },
  { id: 'providers-activity', label: 'Providers Activity', icon: Activity },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'payment-history', label: 'Payment History', icon: CreditCard },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'services', label: 'Services', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
  { id: 'waitlist', label: 'Waitlist', icon: Clock },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'notification-settings', label: 'Notifications', icon: Bell },
  { id: 'schedule-settings', label: 'Schedule Settings', icon: Clock },
  { id: 'payment-settings', label: 'Payment Settings', icon: CreditCard },
  { id: 'portal-settings', label: 'Portal Settings', icon: Globe },
  { id: 'integration-settings', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notification Center', icon: Bell },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'loyalty', label: 'Loyalty Program', icon: Gift },
  { id: 'custom-forms', label: 'Custom Forms', icon: ClipboardList },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
  { id: 'follow-ups', label: 'Follow-Ups', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'team', label: 'Team', icon: UsersRound },
  { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
  { id: 'checklists', label: 'Checklists', icon: CheckSquare },
  { id: 'contracts', label: 'Contracts', icon: FileSignature },
  { id: 'audit-log', label: 'Audit Log', icon: History },
  { id: 'equipment', label: 'Equipment', icon: HardDrive },
  { id: 'service-zones', label: 'Service Zones', icon: Map },
];

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const { tenant, tenants, setTenant } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transform transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400">ServiceCRM</h1>
          <select
            value={tenant?.id || ''}
            onChange={(e) => {
              const t = tenants.find(t => t.id === e.target.value);
              if (t) setTenant(t);
            }}
            className="mt-3 w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            <option value="">Select Business</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          {tenant ? (
            <div>
              <p className="font-medium text-white">{tenant.name}</p>
              {tenant.phone && <p>{tenant.phone}</p>}
            </div>
          ) : (
            <p>Select a business above</p>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
