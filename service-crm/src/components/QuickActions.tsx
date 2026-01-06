import { Plus, UserPlus, CalendarPlus, FileText, DollarSign } from 'lucide-react';

type Props = {
  onNavigate: (page: string) => void;
};

export default function QuickActions({ onNavigate }: Props) {
  const actions = [
    { label: 'New Booking', icon: CalendarPlus, page: 'bookings', color: 'bg-blue-500' },
    { label: 'Add Customer', icon: UserPlus, page: 'customers', color: 'bg-green-500' },
    { label: 'Create Quote', icon: FileText, page: 'quotes', color: 'bg-purple-500' },
    { label: 'New Invoice', icon: DollarSign, page: 'invoices', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => onNavigate(action.page)}
            className={`flex items-center gap-2 px-3 py-2 ${action.color} text-white rounded-lg text-sm hover:opacity-90 transition-opacity`}
          >
            <Icon size={16} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
