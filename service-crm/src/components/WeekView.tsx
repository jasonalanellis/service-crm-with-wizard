import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

type Event = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color?: string;
};

type Props = {
  date: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (date: Date, hour: number) => void;
};

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

export default function WeekView({ date, events, onEventClick, onSlotClick }: Props) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(e.start, day));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b dark:border-gray-700">
        <div className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r dark:border-gray-700">Time</div>
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={`p-2 text-center border-r dark:border-gray-700 last:border-r-0 ${
              isSameDay(day, today) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{format(day, 'EEE')}</div>
            <div className={`text-lg font-semibold ${isSameDay(day, today) ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b dark:border-gray-700 min-h-[60px]">
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-r dark:border-gray-700 text-right pr-3">
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
            {days.map(day => {
              const dayEvents = getEventsForDay(day).filter(e => e.start.getHours() === hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  onClick={() => onSlotClick?.(day, hour)}
                  className="border-r dark:border-gray-700 last:border-r-0 p-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer relative"
                >
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={e => { e.stopPropagation(); onEventClick?.(event); }}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${event.color || 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
