
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { XMarkIcon } from '../icons';

type OnboardingStep = {
  target: string;
  content: string;
};

type OnboardingContextType = {
  startTour: (tourKey: string, steps: OnboardingStep[]) => void;
  isTourActive: boolean;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourKey, setTourKey] = useState<string>('');
  
  const startTour = (key: string, tourSteps: OnboardingStep[]) => {
    const hasSeenTour = localStorage.getItem(key);
    if (!hasSeenTour) {
      setTourKey(key);
      setSteps(tourSteps);
      setCurrentStep(0);
      setIsTourActive(true);
    }
  };

  const stopTour = () => {
    if (tourKey) {
      localStorage.setItem(tourKey, 'true');
    }
    setIsTourActive(false);
    setSteps([]);
    setCurrentStep(0);
    setTourKey('');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      stopTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <OnboardingContext.Provider value={{ startTour, isTourActive }}>
      {children}
      {isTourActive && steps.length > 0 && (
        <TourOverlay
          step={steps[currentStep]}
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={stopTour}
        />
      )}
    </OnboardingContext.Provider>
  );
};

const TourOverlay: React.FC<{
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}> = ({ step, currentStep, totalSteps, onNext, onPrev, onClose }) => {
  const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number } | null>(null);

  useEffect(() => {
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step]);

  if (!position) return null;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 animate-fade-in" onClick={onClose}></div>
      
      {/* Highlight Box */}
      <div
        className="absolute transition-all duration-300 ease-in-out border-2 border-dashed border-indigo-400 rounded-lg shadow-2xl shadow-indigo-500/50"
        style={{ ...position, transform: 'translate(-4px, -4px)', width: position.width + 8, height: position.height + 8 }}
      ></div>
      
      {/* Tooltip */}
      <div 
        className="absolute bg-slate-800 text-white p-4 rounded-lg shadow-xl w-64 animate-fade-in border border-slate-700"
        style={{ 
          top: position.top + position.height + 15, 
          left: Math.max(10, position.left + position.width / 2 - 128) 
        }}
      >
        <p className="text-sm text-slate-300 mb-4">{step.content}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">{currentStep + 1} / {totalSteps}</span>
          <div className="flex gap-2">
            {currentStep > 0 && <button onClick={onPrev} className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-700 rounded">Anterior</button>}
            <button onClick={onNext} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded">
              {currentStep === totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute -top-2 -right-2 bg-slate-700 rounded-full p-1 hover:bg-red-500">
            <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const OnboardingGuide: React.FC<{ tourKey: string, steps: OnboardingStep[] }> = ({ tourKey, steps }) => {
    const { startTour, isTourActive } = useOnboarding();
    const [hasShownWelcome, setHasShownWelcome] = useState(localStorage.getItem(`${tourKey}-welcomed`) === 'true');

    const handleStartTour = () => {
        setHasShownWelcome(true);
        localStorage.setItem(`${tourKey}-welcomed`, 'true');
        startTour(tourKey, steps);
    }
    
    const dismissWelcome = () => {
        setHasShownWelcome(true);
        localStorage.setItem(`${tourKey}-welcomed`, 'true');
        localStorage.setItem(tourKey, 'true'); // Also mark tour as seen
    }

    if (isTourActive || hasShownWelcome || localStorage.getItem(tourKey) === 'true') {
        return null;
    }

    return (
        <div className="fixed bottom-5 right-5 z-[9998] bg-slate-800 p-5 rounded-lg shadow-2xl max-w-sm animate-toast-in border border-slate-700">
            <h3 className="font-bold text-lg text-indigo-400 mb-2">¡Bienvenido a Gestión Pro!</h3>
            <p className="text-sm text-slate-300 mb-4">
                ¿Quieres un rápido recorrido por las funciones principales de la aplicación?
            </p>
            <div className="flex justify-end gap-3">
                <button onClick={dismissWelcome} className="text-sm font-semibold text-slate-400 hover:text-white">
                    Ahora no
                </button>
                <button onClick={handleStartTour} className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg">
                    Iniciar Tour
                </button>
            </div>
        </div>
    );
};
