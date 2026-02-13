import type { QuestionData } from '@/lib/mockData';
import type { DisplayLanguage } from './QuestionsTable';
import { Gift } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionData;
  displayLanguage?: DisplayLanguage;
}

export const QuestionCard = ({ question, displayLanguage = 'hindi' }: QuestionCardProps) => {
  const formatQuestionText = (text: string) => {
    const normalized = text.replace(/\r\n?/g, '\n');
    // If the text already has line breaks for options, keep as-is.
    if (/\n\s*[A-D][\)\.\:]/.test(normalized)) return normalized;

    // If a long multi-statement question is coming in a single line, add line breaks
    // between sentences and before common stems like "Which of the above".
    if (!normalized.includes('\n') && normalized.length > 180) {
      const withStemBreak = normalized.replace(/\s+(?=Which\s+of\s+the\s+(?:above|following)\b)/i, '\n\n');
      const sentenceSplitCount = (withStemBreak.match(/\./g) || []).length;
      if (sentenceSplitCount >= 3) {
        return withStemBreak
          .replace(/\.\s+(?=[A-Z])/g, '.\n')
          .replace(/^\n+/, '');
      }
      return withStemBreak.replace(/^\n+/, '');
    }

    // Insert line breaks before option markers when they appear in a single line.
    // Handles: "A)", "A.", "A:" (and similarly B/C/D)
    const withBreaks = normalized
      .replace(/\s+(?=[A-D][\)\.\:])/g, '\n')
      .replace(/(?<!\n)(?=[A-D][\)\.\:])/g, '\n');

    return withBreaks.replace(/^\n+/, '');
  };

  const getStatusBadge = () => {
    if (question.status === 'bonus' || question.isBonus) {
      return (
        <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1">
          <Gift className="h-3 w-3" />
          +{question.marksAwarded.toFixed(1)} Bonus
        </span>
      );
    }
    switch (question.status) {
      case 'correct':
        return (
          <span className="px-2 py-1 rounded-md bg-correct-bg text-correct text-xs font-semibold">
            +{question.marksAwarded.toFixed(1)}
          </span>
        );
      case 'wrong':
        return (
          <span className="px-2 py-1 rounded-md bg-wrong-bg text-wrong text-xs font-semibold">
            {question.marksAwarded.toFixed(1)}
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
    // For bonus questions, no option is correct
    if (question.status === 'bonus' || question.isBonus) {
      if (option.isSelected) {
        return 'bg-purple-100/50';
      }
      return '';
    }

    if (option.isSelected && option.isCorrect) {
      return 'bg-correct-bg/50';
    }
    if (option.isSelected && !option.isCorrect) {
      return 'bg-wrong-bg/50';
    }
    if (!option.isSelected && option.isCorrect && question.status === 'wrong') {
      return 'bg-right-answer-bg/50';
    }
    if (!option.isSelected && option.isCorrect && question.status === 'unattempted') {
      return 'bg-right-answer-bg/50';
    }
    return '';
  };

  const getOptionLabelClass = (option: QuestionData['options'][0]) => {
    // For bonus questions
    if (question.status === 'bonus' || question.isBonus) {
      if (option.isSelected) {
        return 'bg-purple-500 text-white';
      }
      return 'bg-muted text-foreground';
    }

    if (option.isSelected && option.isCorrect) {
      return 'bg-correct text-white';
    }
    if (option.isSelected && !option.isCorrect) {
      return 'bg-wrong text-white';
    }
    if (!option.isSelected && option.isCorrect && question.status !== 'correct') {
      return 'bg-right-answer text-white';
    }
    return 'bg-muted text-foreground';
  };

  // Get the correct image URL based on display language
  const getQuestionImage = () => {
    if (displayLanguage === 'hindi' && question.questionImageUrlHindi) {
      return question.questionImageUrlHindi;
    }
    if (displayLanguage === 'english' && question.questionImageUrlEnglish) {
      return question.questionImageUrlEnglish;
    }
    return question.questionImageUrl;
  };

  const getOptionImage = (option: QuestionData['options'][0]) => {
    if (displayLanguage === 'hindi' && option.imageUrlHindi) {
      return option.imageUrlHindi;
    }
    if (displayLanguage === 'english' && option.imageUrlEnglish) {
      return option.imageUrlEnglish;
    }
    return option.imageUrl;
  };

  const questionImageUrl = getQuestionImage();
  const hasQuestionImage = questionImageUrl && questionImageUrl.trim() !== '';

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">
            Q.{question.questionNumber}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Question Content - Text and/or Image */}
      <div className="mb-3">
        {hasQuestionImage ? (
          <img
            src={questionImageUrl}
            alt={`Question ${question.questionNumber}`}
            className="max-w-full h-auto"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : question.questionText ? (
          <p className="text-foreground text-sm leading-relaxed mb-2 whitespace-pre-line break-words">
            {formatQuestionText(question.questionText)}
          </p>
        ) : (
          <div className="text-muted-foreground text-sm italic py-2">
            Question image not available
          </div>
        )}
      </div>

      {/* Options - Vertical Layout */}
      <div className="space-y-2">
        {question.options.map((option) => {
          const optionImageUrl = getOptionImage(option);
          const hasOptionImage = optionImageUrl && optionImageUrl.trim() !== '';
          const hasOptionText = option.text && option.text.trim() !== '';

          return (
            <div
              key={option.id}
              className={`flex items-center gap-3 py-1 px-2 rounded ${getOptionClass(option)}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getOptionLabelClass(option)}`}>
                {option.id}
              </span>
              {hasOptionText || hasOptionImage ? (
                <div className="flex items-center gap-2">
                  {hasOptionImage && (
                    <img
                      src={optionImageUrl}
                      alt={`Option ${option.id}`}
                      className="max-h-10 h-auto"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  {!hasOptionImage && hasOptionText && (
                    <span className="text-foreground text-sm">{option.text}</span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Option {option.id}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bonus question note */}
      {(question.status === 'bonus' || question.isBonus) && (
        <div className="mt-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-xs">
          <Gift className="h-3.5 w-3.5 inline mr-1" />
          This question was marked as bonus. All candidates receive full marks.
        </div>
      )}
    </div>
  );
};
