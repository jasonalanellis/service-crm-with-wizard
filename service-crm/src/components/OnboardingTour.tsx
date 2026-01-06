import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

const TOUR_STEPS: Step[] = [
  { title: 'Welcome to Service CRM! 👋', description: 'Let\'s take a quick tour to help you get started with managing your service business.' },
  { title: 'Dashboard Overview', description: 'Your dashboard shows key metrics: today\'s jobs, new leads, revenue, and total customers at a glance.' },
  { title: 'Navigation Sidebar', description: 'Use the sidebar to navigate between different sections: Bookings, Customers, Services, Reports, and more.' },
  { title: 'Global Search', description: 'Press Cmd+K (or Ctrl+K) to quickly search across customers, bookings, and services.' },
  { title: 'Quick Actions', description: 'Create new bookings, add customers, or generate quotes directly from the dashboard.' },
  { title: 'Dark Mode', description: 'Toggle dark mode anytime using the theme switch in the header for comfortable viewing.' },
  { title: 'Keyboard Shortcuts', description: 'Press ? to see all available keyboard shortcuts for faster navigation.' },
  { title: 'You\'re All Set! 🎉', description: 'That\'s the basics! Explore the app to discover more features. Need help? Check the settings for support options.' },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding_complete');
    if (!hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Sparkles size={20} />
              <span className="text-sm font-medium">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
            </div>
            <button
              onClick={completeTour}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={completeTour}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                {isLast ? 'Get Started' : 'Next'} {!isLast && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a button to restart the tour
export function RestartTourButton() {
  const handleRestart = () => {
    localStorage.removeItem('onboarding_complete');
    window.location.reload();
  };

  return (
    <button
      onClick={handleRestart}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
    >
      <Sparkles size={16} /> Restart Tour
    </button>
  );
}
