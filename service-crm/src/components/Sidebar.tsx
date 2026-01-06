import { LayoutDashboard, Users, UserPlus, Calendar, CalendarCheck, FileText, Star, Settings, Menu, X, LogOut, Wrench, Wallet, Receipt, Activity, Tag, Package, Megaphone, BarChart3, Bell, Clock, CreditCard, Globe, Plug, Box, DollarSign, MapPin, Banknote, MessageSquare, Gift, ClipboardList, Share2, RefreshCw, TrendingUp, UsersRound, FileSignature, CheckSquare, History, HardDrive, Map, ChevronDown, ChevronRight } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useState } from 'react';

type Page = 'dashboard' | 'bookings' | 'leads' | 'customers' | 'service-providers' | 'providers-activity' | 'payouts' | 'invoices' | 'payment-history' | 'coupons' | 'services' | 'marketing' | 'reports' | 'schedule' | 'quotes' | 'reviews' | 'settings' | 'notification-settings' | 'schedule-settings' | 'payment-settings' | 'portal-settings' | 'integration-settings' | 'inventory' | 'expenses' | 'waitlist' | 'locations' | 'payroll' | 'notifications' | 'messages' | 'loyalty' | 'custom-forms' | 'referrals' | 'follow-ups' | 'analytics' | 'tags' | 'team' | 'work-orders' | 'checklists' | 'contracts' | 'audit-log' | 'equipment' | 'service-zones';

type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout?: () => void;
};

type NavItem = { id: Page; label: string; icon: React.ElementType };
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Scheduling',
    icon: Calendar,
    items: [
      { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
      { id: 'schedule', label: 'Calendar', icon: Calendar },
      { id: 'quotes', label: 'Quotes', icon: FileText },
      { id: 'waitlist', label: 'Waitlist', icon: Clock },
      { id: 'work-orders', label: 'Work Orders', icon: ClipboardList },
    ]
  },
  {
    label: 'Customers',
    icon: Users,
    items: [
      { id: 'customers', label: 'All Customers', icon: Users },
      { id: 'leads', label: 'Leads', icon: UserPlus },
      { id: 'loyalty', label: 'Loyalty', icon: Gift },
      { id: 'referrals', label: 'Referrals', icon: Share2 },
      { id: 'tags', label: 'Tags', icon: Tag },
    ]
  },
  {
    label: 'Team & Ops',
    icon: UsersRound,
    items: [
      { id: 'team', label: 'Team', icon: UsersRound },
      { id: 'service-providers', label: 'Providers', icon: Wrench },
      { id: 'providers-activity', label: 'Activity', icon: Activity },
      { id: 'checklists', label: 'Checklists', icon: CheckSquare },
      { id: 'payroll', label: 'Payroll', icon: Banknote },
    ]
  },
  {
    label: 'Financials',
    icon: DollarSign,
    items: [
      { id: 'invoices', label: 'Invoices', icon: Receipt },
      { id: 'payment-history', label: 'Payments', icon: CreditCard },
      { id: 'payouts', label: 'Payouts', icon: Wallet },
      { id: 'expenses', label: 'Expenses', icon: DollarSign },
      { id: 'coupons', label: 'Coupons', icon: Tag },
    ]
  },
  {
    label: 'Services',
    icon: Package,
    items: [
      { id: 'services', label: 'Services', icon: Package },
      { id: 'inventory', label: 'Inventory', icon: Box },
      { id: 'equipment', label: 'Equipment', icon: HardDrive },
      { id: 'locations', label: 'Locations', icon: MapPin },
      { id: 'service-zones', label: 'Zones', icon: Map },
    ]
  },
  {
    label: 'Communication',
    icon: MessageSquare,
    items: [
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'follow-ups', label: 'Follow-Ups', icon: RefreshCw },
      { id: 'reviews', label: 'Reviews', icon: Star },
    ]
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { id: 'marketing', label: 'Campaigns', icon: Megaphone },
      { id: 'custom-forms', label: 'Forms', icon: ClipboardList },
      { id: 'contracts', label: 'Contracts', icon: FileSignature },
    ]
  },
  {
    label: 'Reports',
    icon: BarChart3,
    items: [
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'audit-log', label: 'Audit Log', icon: History },
    ]
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { id: 'settings', label: 'General', icon: Settings },
      { id: 'notification-settings', label: 'Notifications', icon: Bell },
      { id: 'schedule-settings', label: 'Schedule', icon: Clock },
      { id: 'payment-settings', label: 'Payments', icon: CreditCard },
      { id: 'portal-settings', label: 'Portal', icon: Globe },
      { id: 'integration-settings', label: 'Integrations', icon: Plug },
    ]
  },
];

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const { tenant, tenants, setTenant } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Scheduling']);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  const isGroupActive = (group: NavGroup) => group.items.some(item => item.id === currentPage);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-gray-900 text-white flex flex-col transform transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 border-b border-gray-700">
          <h1 className="text-lg font-bold text-blue-400">ServiceCRM</h1>
          <select
            value={tenant?.id || ''}
            onChange={(e) => {
              const t = tenants.find(t => t.id === e.target.value);
              if (t) setTenant(t);
            }}
            className="mt-2 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs"
          >
            <option value="">Select Business</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {/* Dashboard - always visible */}
          <button
            onClick={() => { onNavigate('dashboard'); setMobileOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
              currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          {/* Grouped nav items */}
          {navGroups.map(group => {
            const isExpanded = expandedGroups.includes(group.label);
            const isActive = isGroupActive(group);
            const GroupIcon = group.icon;
            
            return (
              <div key={group.label} className="mb-0.5">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive && !isExpanded ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon size={16} />
                    <span>{group.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                
                {isExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const active = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                            active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
          {tenant ? (
            <p className="font-medium text-white truncate">{tenant.name}</p>
          ) : (
            <p>Select a business</p>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-2 w-full flex items-center gap-2 px-2 py-1.5 text-red-400 hover:bg-gray-800 rounded transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
