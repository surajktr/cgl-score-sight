import { useState, useCallback } from 'react';
import type { AnalysisResult } from '@/lib/mockData';

export type HtmlMode = 'normal' | 'quiz';

export const useHtmlGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHtml = useCallback(async (result: AnalysisResult, mode: HtmlMode = 'normal') => {
    setIsGenerating(true);

    try {
      const examName = result.examConfig?.name || 'SSC Exam';
      const sections = result.examConfig?.subjects || [];
      
      // Group questions by part and calculate continuous numbering
      let questionsHtml = '';
      let globalQuestionNumber = 0;
      
      for (const section of sections) {
        const partQuestions = result.questions.filter(q => q.part === section.part);
        if (partQuestions.length === 0) continue;
        
        const startNumber = globalQuestionNumber + 1;
        const endNumber = globalQuestionNumber + partQuestions.length;
        
        questionsHtml += `
          <div class="part-section">
            <div class="part-header">
              <span class="part-badge">Part ${section.part}</span>
              <span class="part-title">${section.name}</span>
              <span class="part-range">Q.${startNumber} - Q.${endNumber}</span>
            </div>
            <div class="questions-list">
        `;
        
        for (const question of partQuestions) {
          globalQuestionNumber++;
          
          let optionsHtml = '';
          for (const option of question.options) {
            const isCorrectAnswer = option.isCorrect;
            
            // In normal mode: show correct answer highlighted
            // In quiz mode: hide answer, reveal on click
            if (mode === 'normal') {
              const optionClass = isCorrectAnswer ? 'option-correct' : '';
              const labelClass = isCorrectAnswer ? 'label-correct' : 'label-default';
              
              optionsHtml += `
                <div class="option ${optionClass}">
                  <span class="option-label ${labelClass}">${option.id}</span>
                  ${option.imageUrl ? `<img src="${option.imageUrl}" alt="Option ${option.id}" class="option-image" loading="lazy" />` : `<span class="option-text">Option ${option.id}</span>`}
                </div>
              `;
            } else {
              // Quiz mode - answer hidden initially
              optionsHtml += `
                <div class="option quiz-option" data-correct="${isCorrectAnswer}" onclick="revealAnswer(this)">
                  <span class="option-label label-default">${option.id}</span>
                  ${option.imageUrl ? `<img src="${option.imageUrl}" alt="Option ${option.id}" class="option-image" loading="lazy" />` : `<span class="option-text">Option ${option.id}</span>`}
                </div>
              `;
            }
          }
          
          questionsHtml += `
            <div class="question">
              <div class="question-header">
                <span class="question-number">Q.${globalQuestionNumber}</span>
              </div>
              <div class="question-image-container">
                ${question.questionImageUrl ? `<img src="${question.questionImageUrl}" alt="Question ${globalQuestionNumber}" class="question-image" loading="lazy" />` : ''}
              </div>
              <div class="options">
                ${optionsHtml}
              </div>
              ${mode === 'quiz' ? `<button class="show-answer-btn" onclick="showAnswer(this)">Show Answer</button>` : ''}
            </div>
          `;
        }
        
        questionsHtml += `
            </div>
          </div>
        `;
      }

      const quizModeScript = mode === 'quiz' ? `
        <script>
          function revealAnswer(element) {
            const isCorrect = element.dataset.correct === 'true';
            const questionDiv = element.closest('.question');
            const allOptions = questionDiv.querySelectorAll('.quiz-option');
            
            // Show feedback for clicked option
            if (isCorrect) {
              element.classList.add('option-correct');
              element.querySelector('.option-label').classList.remove('label-default');
              element.querySelector('.option-label').classList.add('label-correct');
            } else {
              element.classList.add('option-wrong');
              element.querySelector('.option-label').classList.remove('label-default');
              element.querySelector('.option-label').classList.add('label-wrong');
              
              // Also highlight the correct answer
              allOptions.forEach(opt => {
                if (opt.dataset.correct === 'true') {
                  opt.classList.add('option-correct');
                  opt.querySelector('.option-label').classList.remove('label-default');
                  opt.querySelector('.option-label').classList.add('label-correct');
                }
              });
            }
            
            // Disable further clicks
            allOptions.forEach(opt => {
              opt.style.pointerEvents = 'none';
            });
            
            // Hide show answer button
            const btn = questionDiv.querySelector('.show-answer-btn');
            if (btn) btn.style.display = 'none';
          }
          
          function showAnswer(button) {
            const questionDiv = button.closest('.question');
            const allOptions = questionDiv.querySelectorAll('.quiz-option');
            
            allOptions.forEach(opt => {
              if (opt.dataset.correct === 'true') {
                opt.classList.add('option-correct');
                opt.querySelector('.option-label').classList.remove('label-default');
                opt.querySelector('.option-label').classList.add('label-correct');
              }
              opt.style.pointerEvents = 'none';
            });
            
            button.style.display = 'none';
          }
        </script>
      ` : '';

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${examName} - ${mode === 'quiz' ? 'Quiz Mode' : 'Questions'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 24px 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 24px;
    }
    
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .header .mode-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      margin-top: 8px;
    }
    
    .part-section {
      margin-bottom: 32px;
    }
    
    .part-header {
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white;
      padding: 14px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    
    .part-badge {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
    }
    
    .part-title {
      font-size: 15px;
      font-weight: 600;
      flex: 1;
    }
    
    .part-range {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .questions-list {
      background: white;
    }
    
    .question {
      padding: 20px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .question:last-child {
      border-bottom: none;
    }
    
    .question-header {
      margin-bottom: 12px;
    }
    
    .question-number {
      font-size: 15px;
      font-weight: 700;
      color: #3b82f6;
    }
    
    .question-image-container {
      margin-bottom: 16px;
    }
    
    .question-image {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
    }
    
    .options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #f8fafc;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }
    
    .quiz-option {
      cursor: pointer;
    }
    
    .quiz-option:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .option-correct {
      background: rgba(34, 197, 94, 0.15) !important;
      border-color: #22c55e !important;
    }
    
    .option-wrong {
      background: rgba(239, 68, 68, 0.15) !important;
      border-color: #ef4444 !important;
    }
    
    .option-label {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .label-default {
      background: #e2e8f0;
      color: #475569;
    }
    
    .label-correct {
      background: #22c55e;
      color: white;
    }
    
    .label-wrong {
      background: #ef4444;
      color: white;
    }
    
    .option-image {
      max-height: 50px;
      height: auto;
    }
    
    .option-text {
      font-size: 14px;
      color: #64748b;
    }
    
    .show-answer-btn {
      margin-top: 12px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .show-answer-btn:hover {
      background: #2563eb;
    }
    
    .footer {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 11px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }
    
    @media print {
      body { background: white; }
      .container { max-width: 100%; padding: 10px; }
      .question { page-break-inside: avoid; }
      .show-answer-btn { display: none; }
    }
    
    @media (max-width: 640px) {
      .container { padding: 12px; }
      .header { padding: 16px; }
      .header h1 { font-size: 18px; }
      .part-header { padding: 12px 14px; }
      .part-title { font-size: 13px; }
      .question { padding: 14px 0; }
      .option { padding: 8px 10px; gap: 8px; }
      .option-image { max-height: 40px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${examName}</h1>
      <div class="mode-badge">${mode === 'quiz' ? '🎯 Quiz Mode - Click options to check answers' : '📋 Answer Key'}</div>
    </div>
    
    ${questionsHtml}
    
    <div class="footer">
      <p>Generated for practice purposes only. Not affiliated with any official examination body.</p>
    </div>
  </div>
  ${quizModeScript}
</body>
</html>
      `;

      // Create and download the HTML file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const modeLabel = mode === 'quiz' ? 'Quiz' : 'AnswerKey';
      a.download = `${result.examConfig?.displayName || 'Exam'}_${modeLabel}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      return true;
    } catch (error) {
      console.error('HTML generation error:', error);
      setIsGenerating(false);
      throw error;
    }
  }, []);

  return {
    generateHtml,
    isGenerating,
  };
};
