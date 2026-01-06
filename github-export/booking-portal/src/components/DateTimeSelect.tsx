import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { TimeSlot } from '../types';
import { getSlots } from '../api';

interface Props {
  tenant: string;
  onSelect: (date: string, slot: TimeSlot) => void;
  onBack: () => void;
}

export function DateTimeSelect({ tenant, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<Date[]>([]);

  useEffect(() => {
    // Generate next 14 days
    const d: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      d.push(date);
    }
    setDates(d);
    // Auto-select first date
    const firstDate = d[0].toISOString().split('T')[0];
    setSelectedDate(firstDate);
    loadSlots(firstDate);
  }, []);

  const loadSlots = async (date: string) => {
    setLoading(true);
    try {
      const data = await getSlots(tenant, date);
      setSlots(data.slots);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    loadSlots(dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-blue-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pick a Date</h2>
      
      {/* Date Picker */}
      <div className="overflow-x-auto pb-2 mb-6 -mx-4 px-4">
        <div className="flex gap-2">
          {dates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const selected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(date)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-all ${
                  selected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border hover:border-blue-500'
                }`}
              >
                <div className="text-xs font-medium">
                  {isToday(date) ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold">{date.getDate()}</div>
                <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Times</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : slots.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No available times for this date</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.start}
              onClick={() => slot.available && onSelect(selectedDate, slot)}
              disabled={!slot.available}
              className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                slot.available
                  ? 'bg-white border hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
              }`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
