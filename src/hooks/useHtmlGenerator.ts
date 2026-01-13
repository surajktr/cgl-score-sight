import { useState, useCallback } from 'react';
import type { AnalysisResult } from '@/lib/mockData';

const SUBJECTS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'General Intelligence & Reasoning',
  B: 'General Awareness',
  C: 'Quantitative Aptitude',
  D: 'English Comprehension',
};

export const useHtmlGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHtml = useCallback(async (result: AnalysisResult) => {
    setIsGenerating(true);

    try {
      const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      
      let questionsHtml = '';
      
      for (const part of parts) {
        const partQuestions = result.questions.filter(q => q.part === part);
        if (partQuestions.length === 0) continue;
        
        questionsHtml += `
          <div class="part-section">
            <h2 class="part-header">Part ${part}: ${SUBJECTS[part]}</h2>
            <div class="questions-list">
        `;
        
        for (const question of partQuestions) {
          const statusClass = question.status === 'correct' ? 'correct' : question.status === 'wrong' ? 'wrong' : 'unattempted';
          const statusLabel = question.status === 'correct' ? '+2.0' : question.status === 'wrong' ? '-0.5' : '0.0';
          
          let optionsHtml = '';
          for (const option of question.options) {
            let optionClass = '';
            let labelClass = 'label-default';
            
            if (option.isSelected && option.isCorrect) {
              optionClass = 'option-correct';
              labelClass = 'label-correct';
            } else if (option.isSelected && !option.isCorrect) {
              optionClass = 'option-wrong';
              labelClass = 'label-wrong';
            } else if (!option.isSelected && option.isCorrect && question.status !== 'correct') {
              optionClass = 'option-right-answer';
              labelClass = 'label-right-answer';
            }
            
            optionsHtml += `
              <div class="option ${optionClass}">
                <span class="option-label ${labelClass}">${option.id}</span>
                <img src="${option.imageUrl}" alt="Option ${option.id}" class="option-image" />
              </div>
            `;
          }
          
          questionsHtml += `
            <div class="question">
              <div class="question-header">
                <span class="question-number">Q.${question.questionNumber}</span>
                <span class="status-badge status-${statusClass}">${statusLabel}</span>
              </div>
              <div class="question-image-container">
                <img src="${question.questionImageUrl}" alt="Question ${question.questionNumber}" class="question-image" />
              </div>
              <div class="options">
                ${optionsHtml}
              </div>
            </div>
          `;
        }
        
        questionsHtml += `
            </div>
          </div>
        `;
      }

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSC CGL Response Sheet Analysis - ${result.candidate.name || 'Report'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 24px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .info-section {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .info-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #3b82f6;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .info-item {
      font-size: 13px;
    }
    
    .info-label {
      color: #64748b;
    }
    
    .info-value {
      font-weight: 600;
      color: #1e293b;
    }
    
    .score-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .score-box {
      padding: 16px;
      border-radius: 10px;
      text-align: center;
      color: white;
    }
    
    .score-box.total { background: #3b82f6; }
    .score-box.correct { background: #22c55e; }
    .score-box.wrong { background: #ef4444; }
    .score-box.skipped { background: #9ca3af; }
    
    .score-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .score-label {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .part-section {
      margin-bottom: 32px;
    }
    
    .part-header {
      background: #3b82f6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .questions-list {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .question {
      padding: 16px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .question:last-child {
      border-bottom: none;
    }
    
    .question-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .question-number {
      font-size: 14px;
      font-weight: 700;
      color: #3b82f6;
    }
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .status-correct {
      background: #dcfce7;
      color: #22c55e;
    }
    
    .status-wrong {
      background: #fee2e2;
      color: #ef4444;
    }
    
    .status-unattempted {
      background: #f3f4f6;
      color: #9ca3af;
    }
    
    .question-image-container {
      margin-bottom: 12px;
    }
    
    .question-image {
      max-width: 100%;
      height: auto;
    }
    
    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 6px;
    }
    
    .option-correct {
      background: rgba(34, 197, 94, 0.15);
    }
    
    .option-wrong {
      background: rgba(239, 68, 68, 0.15);
    }
    
    .option-right-answer {
      background: rgba(245, 158, 11, 0.15);
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
    
    .label-right-answer {
      background: #f59e0b;
      color: white;
    }
    
    .option-image {
      max-height: 40px;
      height: auto;
    }
    
    .footer {
      text-align: center;
      padding: 24px;
      color: #64748b;
      font-size: 12px;
    }
    
    .legend {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }
    
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .legend-dot.correct { background: #22c55e; }
    .legend-dot.wrong { background: #ef4444; }
    .legend-dot.right-answer { background: #f59e0b; }
    .legend-dot.unattempted { background: #9ca3af; }
    
    @media print {
      body { background: white; }
      .container { max-width: 100%; padding: 10px; }
      .question { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SSC CGL Tier-I Response Sheet Analysis</h1>
      <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>
    
    <div class="info-section">
      <h3>Candidate Information</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Name: </span>
          <span class="info-value">${result.candidate.name || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Roll Number: </span>
          <span class="info-value">${result.candidate.rollNumber || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Test Date: </span>
          <span class="info-value">${result.candidate.testDate || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Shift: </span>
          <span class="info-value">${result.candidate.shift || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <div class="score-summary">
      <div class="score-box total">
        <div class="score-value">${result.totalScore}</div>
        <div class="score-label">/ ${result.maxScore}</div>
      </div>
      <div class="score-box correct">
        <div class="score-value">${result.correctCount}</div>
        <div class="score-label">Correct</div>
      </div>
      <div class="score-box wrong">
        <div class="score-value">${result.wrongCount}</div>
        <div class="score-label">Wrong</div>
      </div>
      <div class="score-box skipped">
        <div class="score-value">${result.unattemptedCount}</div>
        <div class="score-label">Skipped</div>
      </div>
    </div>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot correct"></div>
        <span>Correct (+2.0)</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot wrong"></div>
        <span>Wrong (-0.5)</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot right-answer"></div>
        <span>Correct Answer</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot unattempted"></div>
        <span>Unattempted</span>
      </div>
    </div>
    
    ${questionsHtml}
    
    <div class="footer">
      <p>This is an unofficial analysis report generated for personal use only.</p>
      <p>Not affiliated with Staff Selection Commission.</p>
    </div>
  </div>
</body>
</html>
      `;

      // Create and download the HTML file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SSC_CGL_Analysis_${result.candidate.rollNumber || 'Report'}_${new Date().toISOString().split('T')[0]}.html`;
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