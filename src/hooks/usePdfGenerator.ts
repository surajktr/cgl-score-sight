import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import type { AnalysisResult, QuestionData } from '@/lib/mockData';

const SUBJECTS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'General Intelligence & Reasoning',
  B: 'General Awareness',
  C: 'Quantitative Aptitude',
  D: 'English Comprehension',
};

export const usePdfGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load image and get dimensions
  const loadImage = async (url: string): Promise<{ data: string; width: number; height: number } | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            resolve({
              data: reader.result as string,
              width: img.width,
              height: img.height,
            });
          };
          img.onerror = () => resolve(null);
          img.src = reader.result as string;
        };
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
      const margin = 12;
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
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SSC CGL Tier-I Response Sheet Analysis', pageWidth / 2, 12, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`, pageWidth / 2, 22, { align: 'center' });
      
      yPos = 38;

      // ============ CANDIDATE INFO ============
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Candidate Information', margin, yPos);
      yPos += 6;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      const infoY = yPos + 6;
      const col1X = margin + 4;
      const col2X = margin + contentWidth / 2;
      
      pdf.text('Name:', col1X, infoY);
      pdf.text('Roll Number:', col1X, infoY + 7);
      pdf.text('Test Date:', col1X, infoY + 14);
      
      pdf.text('Exam Level:', col2X, infoY);
      pdf.text('Shift:', col2X, infoY + 7);
      pdf.text('Centre:', col2X, infoY + 14);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(result.candidate.name || 'N/A', col1X + 22, infoY);
      pdf.text(result.candidate.rollNumber || 'N/A', col1X + 22, infoY + 7);
      pdf.text(result.candidate.testDate || 'N/A', col1X + 22, infoY + 14);
      
      pdf.text(result.candidate.examLevel || 'SSC CGL', col2X + 24, infoY);
      pdf.text(result.candidate.shift || 'N/A', col2X + 24, infoY + 7);
      const centreName = result.candidate.centreName || 'N/A';
      pdf.text(centreName.length > 25 ? centreName.substring(0, 25) + '...' : centreName, col2X + 24, infoY + 14);
      
      yPos += 36;

      // ============ SCORE SUMMARY ============
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Score Summary', margin, yPos);
      yPos += 6;

      const scoreBoxWidth = contentWidth / 4 - 4;
      
      // Total Score
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(margin, yPos, scoreBoxWidth, 24, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.totalScore}`, margin + scoreBoxWidth / 2, yPos + 11, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`/ ${result.maxScore}`, margin + scoreBoxWidth / 2, yPos + 18, { align: 'center' });
      
      // Correct
      pdf.setFillColor(34, 197, 94);
      pdf.roundedRect(margin + scoreBoxWidth + 4, yPos, scoreBoxWidth, 24, 2, 2, 'F');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.correctCount}`, margin + scoreBoxWidth + 4 + scoreBoxWidth / 2, yPos + 11, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Correct', margin + scoreBoxWidth + 4 + scoreBoxWidth / 2, yPos + 18, { align: 'center' });
      
      // Wrong
      pdf.setFillColor(239, 68, 68);
      pdf.roundedRect(margin + 2 * (scoreBoxWidth + 4), yPos, scoreBoxWidth, 24, 2, 2, 'F');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.wrongCount}`, margin + 2 * (scoreBoxWidth + 4) + scoreBoxWidth / 2, yPos + 11, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Wrong', margin + 2 * (scoreBoxWidth + 4) + scoreBoxWidth / 2, yPos + 18, { align: 'center' });
      
      // Unattempted
      pdf.setFillColor(156, 163, 175);
      pdf.roundedRect(margin + 3 * (scoreBoxWidth + 4), yPos, scoreBoxWidth, 24, 2, 2, 'F');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.unattemptedCount}`, margin + 3 * (scoreBoxWidth + 4) + scoreBoxWidth / 2, yPos + 11, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Skipped', margin + 3 * (scoreBoxWidth + 4) + scoreBoxWidth / 2, yPos + 18, { align: 'center' });
      
      yPos += 32;

      // ============ SECTION BREAKDOWN ============
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Section-wise Breakdown', margin, yPos);
      yPos += 6;

      // Table header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      const colWidths = [75, 22, 22, 28, 25];
      let xPos = margin + 2;
      const headers = ['Section', 'Correct', 'Wrong', 'Unattempted', 'Score'];
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos + 5);
        xPos += colWidths[i];
      });
      yPos += 7;

      // Table rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      result.sections.forEach((section, index) => {
        pdf.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
        pdf.rect(margin, yPos, contentWidth, 6, 'F');
        
        xPos = margin + 2;
        pdf.setFontSize(7);
        pdf.text(`Part ${section.part}: ${section.subject}`, xPos, yPos + 4);
        xPos += colWidths[0];
        pdf.setTextColor(34, 197, 94);
        pdf.text(`${section.correct}`, xPos, yPos + 4);
        xPos += colWidths[1];
        pdf.setTextColor(239, 68, 68);
        pdf.text(`${section.wrong}`, xPos, yPos + 4);
        xPos += colWidths[2];
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${section.unattempted}`, xPos, yPos + 4);
        xPos += colWidths[3];
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${section.score}`, xPos, yPos + 4);
        pdf.setFont('helvetica', 'normal');
        
        yPos += 6;
      });
      
      yPos += 8;

      // ============ QUESTIONS SECTION ============
      pdf.addPage();
      yPos = margin;
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('All 100 Questions with Answers', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Legend
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      
      pdf.setFillColor(34, 197, 94);
      pdf.circle(margin + 2, yPos - 1, 1.5, 'F');
      pdf.setTextColor(34, 197, 94);
      pdf.text('Correct (+2.0)', margin + 5, yPos);
      
      pdf.setFillColor(239, 68, 68);
      pdf.circle(margin + 35, yPos - 1, 1.5, 'F');
      pdf.setTextColor(239, 68, 68);
      pdf.text('Wrong (-0.5)', margin + 38, yPos);
      
      pdf.setFillColor(245, 158, 11);
      pdf.circle(margin + 65, yPos - 1, 1.5, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.text('Correct Answer', margin + 68, yPos);
      
      pdf.setFillColor(156, 163, 175);
      pdf.circle(margin + 100, yPos - 1, 1.5, 'F');
      pdf.setTextColor(156, 163, 175);
      pdf.text('Unattempted', margin + 103, yPos);
      
      yPos += 8;

      // Process questions by part
      const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const totalQuestions = result.questions.length;
      let processedCount = 0;

      for (const part of parts) {
        const partQuestions = result.questions.filter(q => q.part === part);
        if (partQuestions.length === 0) continue;

        checkNewPage(15);
        
        // Part header
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Part ${part}: ${SUBJECTS[part]}`, pageWidth / 2, yPos + 5.5, { align: 'center' });
        yPos += 12;

        for (const question of partQuestions) {
          // Estimate required space for this question
          const estimatedHeight = 55; // Base height for question with options
          checkNewPage(estimatedHeight);

          // Question number with status
          const qNumY = yPos;
          
          // Status colors
          const statusColors = {
            correct: { bg: [220, 252, 231], text: [34, 197, 94], label: '+2.0' },
            wrong: { bg: [254, 226, 226], text: [239, 68, 68], label: '-0.5' },
            unattempted: { bg: [243, 244, 246], text: [156, 163, 175], label: '0.0' },
          };
          const status = statusColors[question.status];
          
          // Question number badge
          pdf.setFillColor(59, 130, 246);
          pdf.roundedRect(margin, qNumY, 14, 7, 1, 1, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Q.${question.questionNumber}`, margin + 7, qNumY + 5, { align: 'center' });
          
          // Status badge
          pdf.setFillColor(status.bg[0], status.bg[1], status.bg[2]);
          pdf.roundedRect(margin + contentWidth - 14, qNumY, 14, 7, 1, 1, 'F');
          pdf.setTextColor(status.text[0], status.text[1], status.text[2]);
          pdf.setFontSize(8);
          pdf.text(status.label, margin + contentWidth - 7, qNumY + 5, { align: 'center' });
          
          yPos = qNumY + 10;

          // Question image - try to load and embed
          let questionImgHeight = 18;
          if (question.questionImageUrl) {
            const imgData = await loadImage(question.questionImageUrl);
            if (imgData) {
              // Calculate proportional dimensions
              const maxWidth = contentWidth - 4;
              const maxHeight = 35;
              let imgWidth = maxWidth;
              let imgHeight = (imgData.height / imgData.width) * imgWidth;
              
              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = (imgData.width / imgData.height) * imgHeight;
              }
              
              // Center the image
              const imgX = margin + (contentWidth - imgWidth) / 2;
              
              try {
                pdf.addImage(imgData.data, 'JPEG', imgX, yPos, imgWidth, imgHeight);
                questionImgHeight = imgHeight + 2;
              } catch {
                // Fallback - show placeholder
                pdf.setFillColor(248, 250, 252);
                pdf.rect(margin + 2, yPos, contentWidth - 4, 15, 'F');
                pdf.setTextColor(150, 150, 150);
                pdf.setFontSize(7);
                pdf.text('Question image could not be loaded', margin + contentWidth / 2, yPos + 8, { align: 'center' });
                questionImgHeight = 17;
              }
            } else {
              // Placeholder for failed image
              pdf.setFillColor(248, 250, 252);
              pdf.rect(margin + 2, yPos, contentWidth - 4, 15, 'F');
              pdf.setTextColor(150, 150, 150);
              pdf.setFontSize(7);
              pdf.text('Question image could not be loaded', margin + contentWidth / 2, yPos + 8, { align: 'center' });
              questionImgHeight = 17;
            }
          } else {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin + 2, yPos, contentWidth - 4, 15, 'F');
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(7);
            pdf.text('No question image available', margin + contentWidth / 2, yPos + 8, { align: 'center' });
            questionImgHeight = 17;
          }
          
          yPos += questionImgHeight + 2;

          // Options - displayed vertically (A, B, C, D)
          for (let idx = 0; idx < question.options.length; idx++) {
            const option = question.options[idx];
            const optY = yPos;
            const optHeight = 10;
            
            // Determine option background and border colors
            let optBgColor = [255, 255, 255];
            let borderColor = [229, 231, 235];
            let labelBg = [243, 244, 246];
            let labelText = [0, 0, 0];
            
            if (option.isSelected && option.isCorrect) {
              // Correct answer selected
              optBgColor = [220, 252, 231];
              borderColor = [34, 197, 94];
              labelBg = [34, 197, 94];
              labelText = [255, 255, 255];
            } else if (option.isSelected && !option.isCorrect) {
              // Wrong answer selected
              optBgColor = [254, 226, 226];
              borderColor = [239, 68, 68];
              labelBg = [239, 68, 68];
              labelText = [255, 255, 255];
            } else if (!option.isSelected && option.isCorrect && question.status !== 'correct') {
              // Correct answer when user got it wrong
              optBgColor = [254, 243, 199];
              borderColor = [245, 158, 11];
              labelBg = [245, 158, 11];
              labelText = [255, 255, 255];
            }
            
            // Option background
            pdf.setFillColor(optBgColor[0], optBgColor[1], optBgColor[2]);
            pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            pdf.roundedRect(margin + 2, optY, contentWidth - 4, optHeight, 1, 1, 'FD');
            
            // Option letter (A, B, C, D)
            pdf.setFillColor(labelBg[0], labelBg[1], labelBg[2]);
            pdf.roundedRect(margin + 4, optY + 1.5, 7, 7, 1, 1, 'F');
            pdf.setTextColor(labelText[0], labelText[1], labelText[2]);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(option.id, margin + 7.5, optY + 6.5, { align: 'center' });
            
            // Option image
            if (option.imageUrl) {
              const optImgData = await loadImage(option.imageUrl);
              if (optImgData) {
                try {
                  // Calculate proportional dimensions for option image
                  const optMaxWidth = contentWidth - 18;
                  const optMaxHeight = 8;
                  let optImgWidth = optMaxWidth;
                  let optImgHeight = (optImgData.height / optImgData.width) * optImgWidth;
                  
                  if (optImgHeight > optMaxHeight) {
                    optImgHeight = optMaxHeight;
                    optImgWidth = (optImgData.width / optImgData.height) * optImgHeight;
                  }
                  
                  pdf.addImage(optImgData.data, 'JPEG', margin + 13, optY + 1, optImgWidth, optImgHeight);
                } catch {
                  pdf.setTextColor(100, 100, 100);
                  pdf.setFontSize(7);
                  pdf.setFont('helvetica', 'normal');
                  pdf.text('Option image', margin + 14, optY + 6);
                }
              } else {
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Option image', margin + 14, optY + 6);
              }
            }
            
            yPos += optHeight + 1;
          }
          
          yPos += 5; // Space between questions
          
          processedCount++;
          setProgress(Math.round((processedCount / totalQuestions) * 100));
        }
      }

      // ============ FOOTER ON LAST PAGE ============
      checkNewPage(20);
      yPos = pageHeight - 20;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, yPos - 3, pageWidth, 23, 'F');
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(7);
      pdf.text('This is an unofficial analysis report generated for personal use only.', pageWidth / 2, yPos + 3, { align: 'center' });
      pdf.text('Not affiliated with Staff Selection Commission.', pageWidth / 2, yPos + 8, { align: 'center' });

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