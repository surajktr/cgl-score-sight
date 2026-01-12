import { useEffect, useState } from 'react';
import { FileSearch, Database, Calculator, CheckCircle } from 'lucide-react';

const steps = [
  { icon: FileSearch, label: 'Fetching response sheet...', duration: 1500 },
  { icon: Database, label: 'Extracting questions & answers...', duration: 2000 },
  { icon: Calculator, label: 'Calculating scores...', duration: 1000 },
  { icon: CheckCircle, label: 'Preparing analysis...', duration: 500 },
];

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    let elapsed = 0;
    const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

    const interval = setInterval(() => {
      elapsed += 50;
      setProgress((elapsed / totalDuration) * 100);

      let accumulated = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulated += steps[i].duration;
        if (elapsed < accumulated) {
          setCurrentStep(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setCurrentStep(steps.length - 1);
        setProgress(100);
        setTimeout(() => onComplete?.(), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Response Sheet</h2>
          <p className="text-muted-foreground">Please wait while we process your data</p>
        </div>

        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-8">
          <div 
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep || progress === 100;
            const Icon = step.icon;

            return (
              <div 
                key={step.label}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-primary/10 border border-primary/20' : 
                  isComplete ? 'bg-correct-bg border border-correct/20' : 
                  'bg-muted/30'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isComplete ? 'bg-correct text-white' : 
                  isActive ? 'bg-primary text-primary-foreground' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-sm font-medium ${
                  isComplete ? 'text-correct' : 
                  isActive ? 'text-foreground' : 
                  'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
                {isActive && !isComplete && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
