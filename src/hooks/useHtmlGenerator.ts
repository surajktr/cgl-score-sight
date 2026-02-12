import { useState, useCallback } from 'react';
import type { AnalysisResult } from '@/lib/mockData';
import type { DownloadLanguage } from '@/components/DownloadLanguageDialog';

export type HtmlMode = 'normal' | 'quiz';

export const useHtmlGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHtml = useCallback(async (
    result: AnalysisResult,
    mode: HtmlMode = 'normal',
    downloadLanguage: DownloadLanguage = 'hindi'
  ) => {
    setIsGenerating(true);

    try {
      const examName = result.examConfig?.name || 'SSC Exam';
      const sections = result.examConfig?.subjects || [];
      const languageLabel = downloadLanguage === 'bilingual' ? 'Bilingual' :
        downloadLanguage === 'hindi' ? 'Hindi' : 'English';

      // Helper function to get correct image URL based on language preference
      const getQuestionImageUrl = (question: typeof result.questions[0]) => {
        if (downloadLanguage === 'bilingual') {
          // Return both images if available
          const hindiImg = question.questionImageUrlHindi || question.questionImageUrl;
          const englishImg = question.questionImageUrlEnglish || question.questionImageUrl;
          return { hindi: hindiImg, english: englishImg, bilingual: true };
        } else if (downloadLanguage === 'hindi') {
          return { single: question.questionImageUrlHindi || question.questionImageUrl, bilingual: false };
        } else {
          return { single: question.questionImageUrlEnglish || question.questionImageUrl, bilingual: false };
        }
      };

      const getOptionImageUrl = (option: typeof result.questions[0]['options'][0]) => {
        if (downloadLanguage === 'bilingual') {
          const hindiImg = option.imageUrlHindi || option.imageUrl;
          const englishImg = option.imageUrlEnglish || option.imageUrl;
          return { hindi: hindiImg, english: englishImg, bilingual: true };
        } else if (downloadLanguage === 'hindi') {
          return { single: option.imageUrlHindi || option.imageUrl, bilingual: false };
        } else {
          return { single: option.imageUrlEnglish || option.imageUrl, bilingual: false };
        }
      };

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

          const questionImg = getQuestionImageUrl(question);

          let optionsHtml = '';
          for (const option of question.options) {
            const isCorrectAnswer = option.isCorrect;
            const optionImg = getOptionImageUrl(option);
            const hasOptionText = option.text && option.text.trim() !== '';

            // Build option content HTML based on text or image
            let optionContentHtml = '';
            if (hasOptionText) {
              optionContentHtml = `<span class="option-text-content">${option.text}</span>`;
            } else if (optionImg.bilingual && 'hindi' in optionImg && 'english' in optionImg) {
              optionContentHtml = `
                <div class="option-images bilingual">
                  ${optionImg.hindi ? `<img src="${optionImg.hindi}" alt="Option ${option.id} (Hindi)" class="option-image" loading="lazy" />` : ''}
                  ${optionImg.english ? `<img src="${optionImg.english}" alt="Option ${option.id} (English)" class="option-image" loading="lazy" />` : ''}
                </div>
              `;
            } else if ('single' in optionImg && optionImg.single) {
              optionContentHtml = `<img src="${optionImg.single}" alt="Option ${option.id}" class="option-image" loading="lazy" />`;
            } else {
              optionContentHtml = `<span class="option-text">Option ${option.id}</span>`;
            }

            // In normal mode: show correct answer highlighted
            // In quiz mode: hide answer, reveal on click
            if (mode === 'normal') {
              const optionClass = isCorrectAnswer ? 'option-correct' : '';
              const labelClass = isCorrectAnswer ? 'label-correct' : 'label-default';

              optionsHtml += `
                <div class="option ${optionClass}">
                  <span class="option-label ${labelClass}">${option.id}</span>
                  ${optionContentHtml}
                </div>
              `;
            } else {
              optionsHtml += `
                <div class="option quiz-option" data-correct="${isCorrectAnswer}" onclick="revealAnswer(this)">
                  <span class="option-label label-default">${option.id}</span>
                  ${optionContentHtml}
                </div>
              `;
            }
          }

          // Build question content HTML
          let questionContentHtml = '';
          const hasQuestionText = question.questionText && question.questionText.trim() !== '';

          if (hasQuestionText) {
            questionContentHtml += `<p class="question-text-content">${question.questionText}</p>`;
          }

          if (questionImg.bilingual && 'hindi' in questionImg && 'english' in questionImg) {
            questionContentHtml += `
              <div class="question-images bilingual">
                ${questionImg.hindi ? `<div class="lang-section"><span class="lang-label">हिंदी</span><img src="${questionImg.hindi}" alt="Question ${globalQuestionNumber} (Hindi)" class="question-image" loading="lazy" /></div>` : ''}
                ${questionImg.english ? `<div class="lang-section"><span class="lang-label">English</span><img src="${questionImg.english}" alt="Question ${globalQuestionNumber} (English)" class="question-image" loading="lazy" /></div>` : ''}
              </div>
            `;
          } else if ('single' in questionImg && questionImg.single) {
            questionContentHtml += `<img src="${questionImg.single}" alt="Question ${globalQuestionNumber}" class="question-image" loading="lazy" />`;
          }

          questionsHtml += `
            <div class="question">
              <div class="question-header">
                <span class="question-number">Q.${globalQuestionNumber}</span>
              </div>
              <div class="question-body">
                <div class="question-content-container">
                  ${questionContentHtml}
                </div>
                <div class="options">
                  ${optionsHtml}
                </div>
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
      line-height: 1.5;
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
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .part-badge {
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
    }
    
    .part-title {
      font-size: 14px;
      font-weight: 600;
      flex: 1;
    }
    
    .part-range {
      font-size: 11px;
      opacity: 0.9;
    }
    
    .questions-list {
      background: white;
    }
    
    .question {
      padding: 16px 0;
      border-bottom: 1px solid #e5e7eb;
      page-break-inside: avoid;
    }
    
    .question:last-child {
      border-bottom: none;
    }
    
    .question-header {
      margin-bottom: 8px;
    }
    
    .question-number {
      font-size: 14px;
      font-weight: 700;
      color: #3b82f6;
    }
    
    .question-image-container {
      margin-bottom: 12px;
    }
    
    .question-image {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      max-height: 800px; /* Increased from 300px for better readability of passages */
    }
    
    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .option {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid transparent;
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
      background: rgba(34, 197, 94, 0.1) !important;
      border-color: rgba(34, 197, 94, 0.3) !important;
    }
    
    .option-wrong {
      background: rgba(239, 68, 68, 0.1) !important;
      border-color: rgba(239, 68, 68, 0.3) !important;
    }
    
    .option-label {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
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
      max-height: 60px;
      height: auto;
    }
    
    .option-text-content {
      font-size: 13px;
      color: #334155;
      line-height: 1.4;
      margin-top: 2px;
    }
    
    .question-text-content {
      font-size: 14px;
      color: #1e293b;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    
    .question-content-container {
      margin-bottom: 12px;
    }
    
    .show-answer-btn {
      margin-top: 10px;
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #94a3b8;
      font-size: 11px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }
    
    /* Print Optimizations */
    @media print {
      @page {
        margin: 1cm;
        size: A4;
      }
      body { 
        background: white; 
        font-size: 10pt;
        color: #1e293b; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .container { 
        max-width: 100%; 
        width: 100%; 
        padding: 0; 
      }
      .header, .footer, .show-answer-btn { 
        display: none !important; 
      }
      
      .part-section { 
        margin-bottom: 12px; 
        /* Removed break-inside: avoid to allow continuous flow */
      }
      .part-header { 
        padding: 4px 8px; 
        margin-bottom: 6px; 
        background: #f3f4f6 !important; 
        color: #1e40af !important; 
        border: 1px solid #ddd;
        border-radius: 0 !important; 
        page-break-after: avoid; /* Keep header with next content */
        break-after: avoid;
      }
      .part-title { font-size: 11pt; }
      
      .question { 
        padding: 8px 0; 
        border-bottom: 1px solid #eee; 
        page-break-inside: avoid; 
        break-inside: avoid;
        display: flex; /* Flex layout for alignment */
        align-items: flex-start;
        gap: 8px;
      }
      
      /* Fixed width column for Q# */
      .question-header { 
        width: 35px; 
        flex-shrink: 0;
        margin-right: 0;
      }
      
      .question-number { 
        font-size: 10pt; 
        color: #3b82f6 !important; 
        font-weight: 700;
        display: block;
      }

      /* Wrapper for content + options */
      .question-body {
        flex-grow: 1;
        width: calc(100% - 43px);
      }

      .question-content-container { 
        display: block; 
        margin-bottom: 6px;
      }

      .question-text-content { 
        display: block; 
        font-size: 10pt; 
        margin: 0 0 4px 0;
        line-height: 1.4;
      }
      
      /* Images */
      .question-image-container, .question-images {
        display: block;
        margin-top: 8px;
        margin-bottom: 8px;
        page-break-inside: avoid;
        border-radius: 0 !important; /* Remove rounded corners */
      }
      .question-image { 
        max-height: 400px; 
        max-width: 90%; 
        height: auto;
        border-radius: 0 !important; /* Remove rounded corners */
      }

      /* Options Layout */
      .options { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 6px 12px;
        margin-top: 4px;
        padding-left: 10px;
      }
      
      .option {
        width: auto;
        padding: 2px 6px;
        background: white !important; /* White background */
        border: none !important; /* No border */
        border-radius: 0 !important; /* No rounded corners */
        display: inline-flex;
        align-items: flex-start;
        gap: 6px;
        min-width: unset;
      }
      
      .option-label {
        width: 20px;
        height: 20px;
        font-size: 9pt;
        line-height: 18px;
        border: 1px solid #cbd5e1;
        color: #475569;
        background: white;
        margin-top: 1px;
        border-radius: 0 !important; /* Square labels if preferred, or keep circle? User said "remove round corner" generally, but label circle is standard. I'll keep circle for label unless asked. */
      }
      
      /* Correct/Wrong Highlights - minimal */
      .label-correct {
        border-color: #22c55e !important;
        background: #22c55e !important;
        color: white !important;
      }
      
      .option-correct {
         /* Just highlight text or label, no box background to keep it "white" */
         /* But usually we need some indication. I'll make text green/bold */
         background: white !important;
      }

      .option-wrong {
         background: white !important;
      }
      
      .option-text-content {
        font-size: 10pt;
        color: #334155;
        margin-top: 0;
      }
      
      .option-correct .option-text-content {
        font-weight: 700;
        color: #15803d !important; /* Green text */
        text-decoration: underline;
      }
      
      .option-wrong .option-text-content {
        color: #b91c1c !important; /* Red text */
      }
      
      .option-image { 
          max-height: 80px; 
          border-radius: 0 !important;
      }
    }
    
    @media (max-width: 640px) {
      .container { padding: 12px; }
      .header { padding: 16px; }
      .question { padding: 14px 0; }
      .option { padding: 8px 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${examName}</h1>
      <div class="mode-badge">${mode === 'quiz' ? '🎯 Quiz Mode - Click options to check answers' : '📋 Answer Key'} • ${languageLabel}</div>
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
      const langSuffix = downloadLanguage === 'bilingual' ? 'Bilingual' :
        downloadLanguage === 'hindi' ? 'Hindi' : 'English';
      a.download = `${result.examConfig?.displayName || 'Exam'}_${modeLabel}_${langSuffix}_${new Date().toISOString().split('T')[0]}.html`;
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
