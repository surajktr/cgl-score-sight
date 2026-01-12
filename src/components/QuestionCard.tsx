import type { QuestionData } from '@/lib/mockData';

interface QuestionCardProps {
  question: QuestionData;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
  const getStatusBadge = () => {
    switch (question.status) {
      case 'correct':
        return (
          <span className="px-2 py-1 rounded-md bg-correct-bg text-correct text-xs font-semibold">
            +2.0
          </span>
        );
      case 'wrong':
        return (
          <span className="px-2 py-1 rounded-md bg-wrong-bg text-wrong text-xs font-semibold">
            -0.5
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-md bg-unattempted-bg text-unattempted text-xs font-semibold">
            0.0
          </span>
        );
    }
  };

  const getOptionClass = (option: QuestionData['options'][0]) => {
    if (option.isSelected && option.isCorrect) {
      return 'border-2 border-correct bg-correct-bg';
    }
    if (option.isSelected && !option.isCorrect) {
      return 'border-2 border-wrong bg-wrong-bg';
    }
    if (!option.isSelected && option.isCorrect && question.status === 'wrong') {
      return 'border-2 border-right-answer bg-right-answer-bg';
    }
    if (!option.isSelected && option.isCorrect && question.status === 'unattempted') {
      return 'border-2 border-right-answer bg-right-answer-bg';
    }
    return 'border border-border bg-muted/30';
  };

  return (
    <div className="card-elevated p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            {question.questionNumber}
          </span>
          <span className="text-xs text-muted-foreground">
            Part {question.part} • {question.subject}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Question Image */}
      <div className="mb-4 rounded-lg overflow-hidden border border-border bg-white">
        <img 
          src={question.questionImageUrl} 
          alt={`Question ${question.questionNumber}`}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((option) => (
          <div 
            key={option.id}
            className={`relative rounded-lg overflow-hidden p-2 ${getOptionClass(option)}`}
          >
            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
              <span className="text-xs font-medium text-foreground">{option.id}</span>
            </div>
            <img 
              src={option.imageUrl}
              alt={`Option ${option.id}`}
              className="w-full h-auto rounded"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Legend for wrong answers */}
      {question.status !== 'correct' && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          {question.status === 'wrong' && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border-2 border-wrong bg-wrong-bg"></span>
                Your answer
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border-2 border-right-answer bg-right-answer-bg"></span>
                Correct answer
              </span>
            </>
          )}
          {question.status === 'unattempted' && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-right-answer bg-right-answer-bg"></span>
              Correct answer
            </span>
          )}
        </div>
      )}
    </div>
  );
};
