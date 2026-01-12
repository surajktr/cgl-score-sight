import { Trophy, TrendingUp, Target } from 'lucide-react';

interface ScoreSummaryCardProps {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
}

export const ScoreSummaryCard = ({ 
  totalScore, 
  maxScore, 
  correctCount, 
  wrongCount, 
  unattemptedCount 
}: ScoreSummaryCardProps) => {
  const percentage = (totalScore / maxScore) * 100;
  const totalQuestions = correctCount + wrongCount + unattemptedCount;
  const attemptRate = ((correctCount + wrongCount) / totalQuestions) * 100;
  const accuracy = correctCount / (correctCount + wrongCount) * 100;

  return (
    <div className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Main Score Display */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Total Score</h2>
              <p className="text-xs text-muted-foreground">+2 correct, -0.5 wrong</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="score-display text-5xl font-bold text-primary">
              {totalScore.toFixed(1)}
            </span>
            <span className="text-2xl text-muted-foreground font-medium">/ {maxScore}</span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {percentage.toFixed(1)}% of maximum score
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 lg:gap-6">
          <div className="text-center p-4 rounded-xl bg-correct-bg">
            <div className="score-display text-2xl font-bold text-correct">{correctCount}</div>
            <div className="text-xs text-correct/80 font-medium mt-1">Correct</div>
            <div className="text-xs text-muted-foreground">+{(correctCount * 2).toFixed(0)}</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-wrong-bg">
            <div className="score-display text-2xl font-bold text-wrong">{wrongCount}</div>
            <div className="text-xs text-wrong/80 font-medium mt-1">Wrong</div>
            <div className="text-xs text-muted-foreground">{(wrongCount * -0.5).toFixed(1)}</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-unattempted-bg">
            <div className="score-display text-2xl font-bold text-unattempted">{unattemptedCount}</div>
            <div className="text-xs text-unattempted/80 font-medium mt-1">Skipped</div>
            <div className="text-xs text-muted-foreground">0</div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-lg font-semibold text-foreground">{accuracy.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <TrendingUp className="h-4 w-4 text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Attempt Rate</p>
            <p className="text-lg font-semibold text-foreground">{attemptRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
