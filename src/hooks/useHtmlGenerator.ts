import { useState, useCallback } from 'react';
import type { AnalysisResult } from '@/lib/mockData';
import type { DownloadLanguage } from '@/components/DownloadLanguageDialog';

export type HtmlMode = 'normal' | 'quiz' | 'response-sheet';

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
      const isResponseSheetMode = mode === 'response-sheet';

      const formatQuestionText = (text: string) => {
        const normalized = text.replace(/\r\n?/g, '\n');
        if (/\n\s*[A-D][\)\.\:]/.test(normalized)) return normalized;

        if (!normalized.includes('\n') && normalized.length > 180) {
          const withStemBreak = normalized.replace(/\s+(?=Which\s+of\s+the\s+(?:above|following)\b)/i, '\n\n');
          const sentenceSplitCount = (withStemBreak.match(/\./g) || []).length;
          if (sentenceSplitCount >= 3) {
            return withStemBreak.replace(/\.\s+(?=[A-Z])/g, '.\n').replace(/^\n+/, '');
          }
          return withStemBreak.replace(/^\n+/, '');
        }

        const withBreaks = normalized.replace(/\s+(?=[A-D][\)\.\:])/g, '\n');
        return withBreaks.replace(/^\n+/, '');
      };

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

      const candidateInfoHtml = isResponseSheetMode ? `
        <section class="candidate-card">
          <h2>Candidate Information</h2>
          <div class="candidate-grid">
            <div><span>Name</span><strong>${result.candidate.name || 'N/A'}</strong></div>
            <div><span>Roll Number</span><strong>${result.candidate.rollNumber || 'N/A'}</strong></div>
            <div><span>Exam</span><strong>${result.candidate.examLevel || examName}</strong></div>
            <div><span>Date</span><strong>${result.candidate.testDate || 'N/A'}</strong></div>
            <div><span>Shift/Time</span><strong>${result.candidate.shift || 'N/A'}</strong></div>
            <div><span>Centre</span><strong>${result.candidate.centreName || 'N/A'}</strong></div>
          </div>
        </section>
      ` : '';

      const scoreSummaryHtml = isResponseSheetMode ? `
        <section class="summary-bar">
          <div class="summary-item"><span>Total Score</span><strong>${result.totalScore} / ${result.maxScore}</strong></div>
          <div class="summary-item"><span>Correct</span><strong>${result.correctCount}</strong></div>
          <div class="summary-item"><span>Wrong</span><strong>${result.wrongCount}</strong></div>
          <div class="summary-item"><span>Skipped</span><strong>${result.unattemptedCount}</strong></div>
          <div class="summary-item"><span>Bonus</span><strong>${result.bonusCount || 0}</strong></div>
        </section>
      ` : '';

      const sectionTableRows = result.sections.map((section) => `
        <tr>
          <td>${section.part}</td>
          <td>${section.subject}</td>
          <td>+${section.correctMarks} / -${section.negativeMarks}</td>
          <td>${section.correct}/${section.wrong}/${section.unattempted}${section.bonus ? ` (+${section.bonus} bonus)` : ''}</td>
          <td>${section.score.toFixed(1)} / ${section.maxMarks}</td>
        </tr>
      `).join('');

      const sectionTableHtml = isResponseSheetMode ? `
        <section class="section-table-wrap">
          <h2>Section-wise Score</h2>
          <table class="section-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Subject</th>
                <th>Marking</th>
                <th>Breakdown (C/W/S)</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              ${sectionTableRows}
            </tbody>
          </table>
        </section>
      ` : '';

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

            // Build option content HTML - show both image and text when both are present
            let optionContentHtml = '';
            let hasOptionImage = false;

            if (optionImg.bilingual && 'hindi' in optionImg && 'english' in optionImg && (optionImg.hindi || optionImg.english)) {
              hasOptionImage = true;
              optionContentHtml += `
                <div class="option-images bilingual">
                  ${optionImg.hindi ? `<img src="${optionImg.hindi}" alt="Option ${option.id} (Hindi)" class="option-image" loading="lazy" />` : ''}
                  ${optionImg.english ? `<img src="${optionImg.english}" alt="Option ${option.id} (English)" class="option-image" loading="lazy" />` : ''}
                </div>
              `;
            } else if ('single' in optionImg && optionImg.single) {
              hasOptionImage = true;
              optionContentHtml += `<img src="${optionImg.single}" alt="Option ${option.id}" class="option-image" loading="lazy" />`;
            }

            if (hasOptionText) {
              optionContentHtml += `<span class="option-text-content">${option.text}</span>`;
            }

            if (!hasOptionImage && !hasOptionText) {
              optionContentHtml = `<span class="option-text">Option ${option.id}</span>`;
            }

            // In normal/response-sheet mode: show answer and response state
            // In quiz mode: hide answer, reveal on click
            if (mode !== 'quiz') {
              const optionClass = mode === 'response-sheet'
                ? `${isCorrectAnswer ? 'option-correct-answer' : ''} ${option.isSelected && !option.isCorrect ? 'option-selected-wrong' : ''} ${option.isSelected && option.isCorrect ? 'option-selected-correct' : ''}`.trim()
                : (isCorrectAnswer ? 'option-correct' : '');
              const labelClass = mode === 'response-sheet'
                ? (option.isSelected && option.isCorrect ? 'label-correct' : option.isSelected && !option.isCorrect ? 'label-wrong' : isCorrectAnswer ? 'label-correct' : 'label-default')
                : (isCorrectAnswer ? 'label-correct' : 'label-default');

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
            questionContentHtml += `<p class="question-text-content">${formatQuestionText(question.questionText!)}</p>`;
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

          const chosenOption = question.options.find(opt => opt.isSelected)?.id || 'Not Attempted';
          const correctOption = question.options.find(opt => opt.isCorrect)?.id || 'N/A';
          const responseIcon = question.status === 'correct' ? '✓' : question.status === 'wrong' ? '✗' : '–';
          const marksText = question.marksAwarded > 0 ? `+${question.marksAwarded}` : `${question.marksAwarded}`;

          questionsHtml += `
            <div class="question">
              <div class="question-header">
                <span class="question-number">Q.${globalQuestionNumber}</span>
                ${isResponseSheetMode ? `
                  <div class="question-meta">
                    <span class="response-state ${question.status}">${responseIcon} Your: ${chosenOption}</span>
                    <span class="correct-state">Correct: ${correctOption}</span>
                    <span class="marks-state ${question.marksAwarded >= 0 ? 'positive' : 'negative'}">${marksText}</span>
                  </div>
                ` : ''}
              </div>
              <div class="question-content-container">
                ${questionContentHtml}
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
  <title>${examName} - ${mode === 'quiz' ? 'Quiz Mode' : mode === 'response-sheet' ? 'Response Sheet Analysis' : 'Questions'}</title>
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
      padding: 10px;
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 8px 15px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    
    .header h1 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .header h2 {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.95;
      margin-bottom: 2px;
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

    .candidate-card,
    .section-table-wrap {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .candidate-card h2,
    .section-table-wrap h2 {
      font-size: 15px;
      margin-bottom: 8px;
      color: #0f172a;
    }

    .candidate-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }

    .candidate-grid div {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .candidate-grid span {
      font-size: 11px;
      color: #64748b;
    }

    .candidate-grid strong {
      font-size: 13px;
      color: #0f172a;
      word-break: break-word;
    }

    .summary-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }

    .summary-item {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
    }

    .summary-item span {
      display: block;
      font-size: 11px;
      color: #1d4ed8;
    }

    .summary-item strong {
      display: block;
      font-size: 16px;
      color: #1e3a8a;
      margin-top: 2px;
    }

    .section-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .section-table th,
    .section-table td {
      border: 1px solid #e2e8f0;
      padding: 6px;
      text-align: left;
    }

    .section-table th {
      background: #e2e8f0;
      color: #0f172a;
    }
    
    .part-section {
      margin-bottom: 12px;
    }
    
    .part-header {
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white;
      padding: 5px 12px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
      page-break-after: avoid;
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
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
      page-break-inside: avoid;
    }
    
    .question:last-child {
      border-bottom: none;
    }
    
    .question-header {
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .question-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .question-meta span {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
    }

    .response-state.correct { background: #dcfce7; border-color: #86efac; color: #166534; }
    .response-state.wrong { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
    .response-state.unattempted { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }
    .marks-state.positive { background: #dcfce7; border-color: #86efac; color: #166534; }
    .marks-state.negative { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
    
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
      gap: 5px;
      margin-top: 5px;
    }
    
    .option {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 5px;
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
    
    .option-text-content {
      font-size: 14px;
      color: #1e293b;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .response-sheet .question-text-content {
      font-weight: 700;
    }

    .option-selected-correct {
      background: rgba(34, 197, 94, 0.15) !important;
      border-color: #22c55e !important;
    }

    .option-selected-wrong {
      background: rgba(239, 68, 68, 0.15) !important;
      border-color: #ef4444 !important;
    }

    .option-correct-answer {
      background: rgba(245, 158, 11, 0.15);
      border-color: #f59e0b;
    }
    
    .question-text-content {
      font-size: 15px;
      color: #1e293b;
      line-height: 1.6;
      margin-bottom: 12px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    
    .question-content-container {
      margin-bottom: 5px;
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
    
    /* Bilingual styles */
    .question-images.bilingual {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .lang-section {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      background: #fafafa;
    }
    
    .lang-label {
      display: inline-block;
      background: #3b82f6;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .option-images.bilingual {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .option-images.bilingual .option-image {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 2px;
    }
    
    @media print {
      body { 
        background: white; 
        margin: 0;
        padding: 0;
      }
      .container { 
        max-width: 100%; 
        padding: 8px 12px; 
        margin: 0;
      }
      .header {
        padding: 5px 10px;
        margin-bottom: 5px;
      }
      .header h1 {
        font-size: 14px;
      }
      .part-section {
        margin-bottom: 6px;
      }
      .part-header {
        padding: 4px 10px;
        margin-bottom: 4px;
        page-break-after: avoid;
      }
      .question { 
        page-break-inside: avoid;
        padding: 5px 0;
      }
      .question-header {
        margin-bottom: 3px;
      }
      .question-content-container {
        margin-bottom: 4px;
      }
      .options {
        gap: 4px;
        margin-top: 4px;
      }
      .option {
        padding: 3px 6px;
      }
      .show-answer-btn { display: none; }
      .footer {
        padding: 8px;
        margin-top: 8px;
      }
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
      .option-images.bilingual { flex-direction: column; }
    }
  </style>
</head>
<body class="${isResponseSheetMode ? 'response-sheet' : ''}">
  <div class="container">
    <div class="header">
      <h1>${examName}</h1>
      ${isResponseSheetMode ? '<h2>Response Sheet Analysis</h2>' : ''}
      <div class="mode-badge">${mode === 'quiz' ? '🎯 Quiz Mode - Click options to check answers' : mode === 'response-sheet' ? '📋 Response Sheet Analysis' : '📋 Answer Key'} • ${languageLabel}</div>
    </div>

    ${candidateInfoHtml}
    ${scoreSummaryHtml}
    ${sectionTableHtml}
    
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
      const modeLabel = mode === 'quiz' ? 'Quiz' : mode === 'response-sheet' ? 'ResponseSheet' : 'AnswerKey';
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
