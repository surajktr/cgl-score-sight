import type { QuestionData } from '@/lib/mockData';
import type { DisplayLanguage } from './QuestionsTable';

interface QuestionCardProps {
  question: QuestionData;
  displayLanguage?: DisplayLanguage;
}

export const QuestionCard = ({ question, displayLanguage = 'hindi' }: QuestionCardProps) => {
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

      {/* Question Image */}
      <div className="mb-3">
        <img 
          src={getQuestionImage()} 
          alt={`Question ${question.questionNumber}`}
          className="max-w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Options - Vertical Layout */}
      <div className="space-y-2">
        {question.options.map((option) => (
          <div 
            key={option.id}
            className={`flex items-center gap-3 py-1 px-2 rounded ${getOptionClass(option)}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getOptionLabelClass(option)}`}>
              {option.id}
            </span>
            <img 
              src={getOptionImage(option)}
              alt={`Option ${option.id}`}
              className="max-h-10 h-auto"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};