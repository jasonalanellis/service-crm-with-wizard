import { Clock, DollarSign, ChevronRight } from 'lucide-react';
import { Service } from '../types';

interface Props {
  services: Service[];
  onSelect: (service: Service) => void;
}

export function ServiceSelect({ services, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Service</h2>
      <div className="space-y-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="w-full bg-white border rounded-xl p-4 text-left hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-gray-900">
                    <DollarSign className="w-4 h-4" />
                    {service.price}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
