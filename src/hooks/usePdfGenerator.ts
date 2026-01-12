import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import type { AnalysisResult, QuestionData } from '@/lib/mockData';

export const usePdfGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generatePdf = useCallback(async (result: AnalysisResult) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Helper function to add new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // ============ HEADER SECTION ============
      pdf.setFillColor(59, 130, 246); // Primary blue
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SSC CGL Tier-I Response Sheet Analysis', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`, pageWidth / 2, 25, { align: 'center' });
      
      yPos = 45;

      // ============ CANDIDATE INFO ============
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Candidate Information', margin, yPos);
      yPos += 8;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      const infoY = yPos + 8;
      const col1X = margin + 5;
      const col2X = margin + contentWidth / 2;
      
      pdf.text('Name:', col1X, infoY);
      pdf.text('Roll Number:', col1X, infoY + 8);
      pdf.text('Test Date:', col1X, infoY + 16);
      
      pdf.text('Exam Level:', col2X, infoY);
      pdf.text('Shift:', col2X, infoY + 8);
      pdf.text('Centre:', col2X, infoY + 16);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(result.candidate.name || 'N/A', col1X + 25, infoY);
      pdf.text(result.candidate.rollNumber || 'N/A', col1X + 25, infoY + 8);
      pdf.text(result.candidate.testDate || 'N/A', col1X + 25, infoY + 16);
      
      pdf.text(result.candidate.examLevel || 'SSC CGL Tier 1', col2X + 28, infoY);
      pdf.text(result.candidate.shift || 'N/A', col2X + 28, infoY + 8);
      const centreName = result.candidate.centreName || 'N/A';
      pdf.text(centreName.length > 30 ? centreName.substring(0, 30) + '...' : centreName, col2X + 28, infoY + 16);
      
      yPos += 45;

      // ============ SCORE SUMMARY ============
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Score Summary', margin, yPos);
      yPos += 8;

      // Score box
      const scoreBoxWidth = contentWidth / 3 - 5;
      
      // Total Score
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(margin, yPos, scoreBoxWidth, 30, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.totalScore}/${result.maxScore}`, margin + scoreBoxWidth / 2, yPos + 15, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Score', margin + scoreBoxWidth / 2, yPos + 24, { align: 'center' });
      
      // Correct
      pdf.setFillColor(34, 197, 94);
      pdf.roundedRect(margin + scoreBoxWidth + 5, yPos, scoreBoxWidth, 30, 3, 3, 'F');
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.correctCount}`, margin + scoreBoxWidth + 5 + scoreBoxWidth / 2, yPos + 15, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Correct (+2.0)', margin + scoreBoxWidth + 5 + scoreBoxWidth / 2, yPos + 24, { align: 'center' });
      
      // Wrong
      pdf.setFillColor(239, 68, 68);
      pdf.roundedRect(margin + 2 * (scoreBoxWidth + 5), yPos, scoreBoxWidth, 30, 3, 3, 'F');
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.wrongCount}`, margin + 2 * (scoreBoxWidth + 5) + scoreBoxWidth / 2, yPos + 15, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Wrong (-0.5)', margin + 2 * (scoreBoxWidth + 5) + scoreBoxWidth / 2, yPos + 24, { align: 'center' });
      
      yPos += 40;

      // Unattempted info
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.text(`Unattempted: ${result.unattemptedCount} questions (0 marks)`, margin, yPos);
      yPos += 10;

      // ============ SECTION BREAKDOWN ============
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Section-wise Breakdown', margin, yPos);
      yPos += 8;

      // Table header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(margin, yPos, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      const colWidths = [80, 25, 25, 30, 30];
      let xPos = margin + 3;
      const headers = ['Section', 'Correct', 'Wrong', 'Unattempted', 'Score'];
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos + 5.5);
        xPos += colWidths[i];
      });
      yPos += 8;

      // Table rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      result.sections.forEach((section, index) => {
        pdf.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
        pdf.rect(margin, yPos, contentWidth, 7, 'F');
        
        xPos = margin + 3;
        pdf.setFontSize(8);
        pdf.text(`Part ${section.part}: ${section.subject}`, xPos, yPos + 5);
        xPos += colWidths[0];
        pdf.setTextColor(34, 197, 94);
        pdf.text(`${section.correct}`, xPos, yPos + 5);
        xPos += colWidths[1];
        pdf.setTextColor(239, 68, 68);
        pdf.text(`${section.wrong}`, xPos, yPos + 5);
        xPos += colWidths[2];
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${section.unattempted}`, xPos, yPos + 5);
        xPos += colWidths[3];
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${section.score}`, xPos, yPos + 5);
        pdf.setFont('helvetica', 'normal');
        
        yPos += 7;
      });
      
      yPos += 10;

      // ============ QUESTIONS SECTION ============
      pdf.addPage();
      yPos = margin;
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('All 100 Questions with Answers', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;

      // Legend
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      pdf.setFillColor(34, 197, 94);
      pdf.circle(margin + 3, yPos - 1.5, 2, 'F');
      pdf.setTextColor(34, 197, 94);
      pdf.text('Correct (+2.0)', margin + 8, yPos);
      
      pdf.setFillColor(239, 68, 68);
      pdf.circle(margin + 43, yPos - 1.5, 2, 'F');
      pdf.setTextColor(239, 68, 68);
      pdf.text('Wrong (-0.5)', margin + 48, yPos);
      
      pdf.setFillColor(245, 158, 11);
      pdf.circle(margin + 83, yPos - 1.5, 2, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.text('Correct Answer (when wrong)', margin + 88, yPos);
      
      pdf.setFillColor(156, 163, 175);
      pdf.circle(margin + 148, yPos - 1.5, 2, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.text('Unattempted (0)', margin + 153, yPos);
      
      yPos += 10;

      // Process questions by part
      const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const totalQuestions = result.questions.length;
      let processedCount = 0;

      for (const part of parts) {
        const partQuestions = result.questions.filter(q => q.part === part);
        if (partQuestions.length === 0) continue;

        checkNewPage(20);
        
        // Part header
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPos, contentWidth, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Part ${part}: ${SUBJECTS[part]}`, pageWidth / 2, yPos + 7, { align: 'center' });
        yPos += 15;

        for (const question of partQuestions) {
          // Check if we need a new page (question card needs ~70mm)
          checkNewPage(75);

          // Question card
          const cardHeight = 65;
          
          // Card background
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(229, 231, 235);
          pdf.roundedRect(margin, yPos, contentWidth, cardHeight, 2, 2, 'FD');

          // Question number and status badge
          pdf.setFillColor(59, 130, 246);
          pdf.roundedRect(margin + 3, yPos + 3, 12, 8, 1, 1, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${question.questionNumber}`, margin + 9, yPos + 8.5, { align: 'center' });

          // Status badge
          const statusColors = {
            correct: { bg: [220, 252, 231], text: [34, 197, 94] },
            wrong: { bg: [254, 226, 226], text: [239, 68, 68] },
            unattempted: { bg: [243, 244, 246], text: [156, 163, 175] },
          };
          const statusLabels = {
            correct: '+2.0',
            wrong: '-0.5',
            unattempted: '0.0',
          };
          
          const colors = statusColors[question.status];
          pdf.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
          pdf.roundedRect(margin + contentWidth - 18, yPos + 3, 15, 7, 1, 1, 'F');
          pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
          pdf.setFontSize(8);
          pdf.text(statusLabels[question.status], margin + contentWidth - 10.5, yPos + 7.5, { align: 'center' });

          // Question image placeholder or URL
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin + 3, yPos + 13, contentWidth - 6, 20, 'F');
          
          if (question.questionImageUrl) {
            // Try to load and embed the image
            try {
              const imgData = await loadImageAsBase64(question.questionImageUrl);
              if (imgData) {
                pdf.addImage(imgData, 'JPEG', margin + 3, yPos + 13, contentWidth - 6, 20);
              } else {
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(7);
                pdf.text(`Image: ${question.questionImageUrl}`, margin + 5, yPos + 23);
              }
            } catch {
              pdf.setTextColor(100, 100, 100);
              pdf.setFontSize(7);
              pdf.text(`Image: ${question.questionImageUrl}`, margin + 5, yPos + 23);
            }
          } else {
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            pdf.text('Question image not available', margin + contentWidth / 2, yPos + 23, { align: 'center' });
          }

          // Options
          const optionY = yPos + 36;
          const optionWidth = (contentWidth - 12) / 4;
          
          for (let idx = 0; idx < question.options.length; idx++) {
            const option = question.options[idx];
            const optX = margin + 3 + idx * (optionWidth + 2);
            
            // Option background based on status
            let optBgColor = [243, 244, 246]; // Default gray
            let borderColor = [229, 231, 235];
            
            if (option.isSelected && option.isCorrect) {
              optBgColor = [220, 252, 231];
              borderColor = [34, 197, 94];
            } else if (option.isSelected && !option.isCorrect) {
              optBgColor = [254, 226, 226];
              borderColor = [239, 68, 68];
            } else if (!option.isSelected && option.isCorrect && question.status !== 'correct') {
              optBgColor = [254, 243, 199];
              borderColor = [245, 158, 11];
            }
            
            pdf.setFillColor(optBgColor[0], optBgColor[1], optBgColor[2]);
            pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            pdf.roundedRect(optX, optionY, optionWidth, 22, 1, 1, 'FD');
            
            // Option letter
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(200, 200, 200);
            pdf.circle(optX + 5, optionY + 4, 3, 'FD');
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.text(option.id, optX + 5, optionY + 5.5, { align: 'center' });
            
            // Option image or placeholder
            if (option.imageUrl) {
              try {
                const optImgData = await loadImageAsBase64(option.imageUrl);
                if (optImgData) {
                  pdf.addImage(optImgData, 'JPEG', optX + 2, optionY + 8, optionWidth - 4, 12);
                } else {
                  pdf.setTextColor(100, 100, 100);
                  pdf.setFontSize(6);
                  pdf.text('Image', optX + optionWidth / 2, optionY + 14, { align: 'center' });
                }
              } catch {
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(6);
                pdf.text('Image', optX + optionWidth / 2, optionY + 14, { align: 'center' });
              }
            }
          }

          yPos += cardHeight + 5;
          processedCount++;
          setProgress(Math.round((processedCount / totalQuestions) * 100));
        }
      }

      // ============ FOOTER ON LAST PAGE ============
      checkNewPage(25);
      yPos = pageHeight - 30;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, yPos - 5, pageWidth, 35, 'F');
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.text('This is an unofficial analysis report generated for personal use only.', pageWidth / 2, yPos + 5, { align: 'center' });
      pdf.text('Not affiliated with Staff Selection Commission.', pageWidth / 2, yPos + 10, { align: 'center' });

      // Save the PDF
      const fileName = `SSC_CGL_Analysis_${result.candidate.rollNumber || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      setIsGenerating(false);
      setProgress(100);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      setIsGenerating(false);
      setProgress(0);
      throw error;
    }
  }, []);

  return {
    generatePdf,
    isGenerating,
    progress,
  };
};

const SUBJECTS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'General Intelligence & Reasoning',
  B: 'General Awareness',
  C: 'Quantitative Aptitude',
  D: 'English Comprehension',
};
