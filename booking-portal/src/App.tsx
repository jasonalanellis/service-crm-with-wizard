import { useState, useEffect } from 'react';
import { Phone, Check } from 'lucide-react';
import { Tenant, Service, TimeSlot, BookingData } from './types';
import { getServices, getSlots, createBooking } from './api';
import { ServiceSelect } from './components/ServiceSelect';
import { DateTimeSelect } from './components/DateTimeSelect';
import { CustomerForm } from './components/CustomerForm';
import { Confirmation } from './components/Confirmation';

function App() {
  const [tenant, setTenant] = useState<string>('');
  const [tenantInfo, setTenantInfo] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingResult, setBookingResult] = useState<{ appointment_id: string; message: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tenant') || 'bravo-maids';
    setTenant(t);
    loadServices(t);
  }, []);

  const loadServices = async (t: string) => {
    setLoading(true);
    try {
      const data = await getServices(t);
      setTenantInfo(data.tenant);
      setServices(data.services);
    } catch {
      setError('Unable to load booking information');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleSlotSelect = (date: string, slot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBooking = async (formData: Omit<BookingData, 'service_id' | 'scheduled_start'>) => {
    if (!selectedService || !selectedSlot) return;
    
    setLoading(true);
    try {
      const result = await createBooking(tenant, {
        ...formData,
        service_id: selectedService.id,
        scheduled_start: selectedSlot.start,
      });
      setBookingResult(result);
      setStep(4);
    } catch {
      setError('Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (loading && !tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => loadServices(tenant)} className="text-blue-500 underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{tenantInfo?.name}</h1>
          {tenantInfo?.phone && (
            <a href={`tel:${tenantInfo.phone}`} className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <Phone className="w-4 h-4" />
              {tenantInfo.phone}
            </a>
          )}
        </div>
      </header>

      {/* Progress Indicator */}
      {step < 4 && (
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s < step
                        ? 'bg-green-500 text-white'
                        : s === step
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Service</span>
              <span>Date/Time</span>
              <span>Details</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">x</button>
          </div>
        )}

        {step === 1 && (
          <ServiceSelect services={services} onSelect={handleServiceSelect} />
        )}

        {step === 2 && (
          <DateTimeSelect
            tenant={tenant}
            onSelect={handleSlotSelect}
            onBack={goBack}
          />
        )}

        {step === 3 && selectedService && selectedSlot && (
          <CustomerForm
            service={selectedService}
            date={selectedDate}
            slot={selectedSlot}
            loading={loading}
            onSubmit={handleBooking}
            onBack={goBack}
          />
        )}

        {step === 4 && bookingResult && selectedService && selectedSlot && (
          <Confirmation
            service={selectedService}
            date={selectedDate}
            slot={selectedSlot}
            appointmentId={bookingResult.appointment_id}
            tenantPhone={tenantInfo?.phone || ''}
          />
        )}
      </main>
    </div>
  );
}

export default App;
