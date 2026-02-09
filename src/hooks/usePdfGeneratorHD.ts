import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import type { AnalysisResult, QuestionData } from '@/lib/mockData';
import type { DownloadLanguage } from '@/components/DownloadLanguageDialog';

export const usePdfGeneratorHD = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load image with better error handling and HD quality
  const loadImage = async (url: string): Promise<{ data: string; width: number; height: number } | null> => {
    if (!url) return null;
    
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

  const generatePdf = useCallback(async (
    result: AnalysisResult, 
    downloadLanguage: DownloadLanguage = 'hindi'
  ) => {
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
      const addNewPage = () => {
        pdf.addPage();
        yPos = margin;
      };

      // Check if new page needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          addNewPage();
          return true;
        }
        return false;
      };

      // Get correct image URL based on language
      const getQuestionImageUrl = (question: QuestionData) => {
        if (downloadLanguage === 'bilingual') {
          return {
            hindi: question.questionImageUrlHindi || question.questionImageUrl,
            english: question.questionImageUrlEnglish || question.questionImageUrl,
          };
        } else if (downloadLanguage === 'hindi') {
          return { single: question.questionImageUrlHindi || question.questionImageUrl };
        } else {
          return { single: question.questionImageUrlEnglish || question.questionImageUrl };
        }
      };

      const getOptionImageUrl = (option: QuestionData['options'][0]) => {
        if (downloadLanguage === 'bilingual') {
          return {
            hindi: option.imageUrlHindi || option.imageUrl,
            english: option.imageUrlEnglish || option.imageUrl,
          };
        } else if (downloadLanguage === 'hindi') {
          return { single: option.imageUrlHindi || option.imageUrl };
        } else {
          return { single: option.imageUrlEnglish || option.imageUrl };
        }
      };

      // ============ HEADER ============
      const examName = result.examConfig?.name || 'SSC Exam';
      const langLabel = downloadLanguage === 'bilingual' ? 'Bilingual' : 
                        downloadLanguage === 'hindi' ? 'Hindi' : 'English';

      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(examName, pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`📋 Answer Key • ${langLabel}`, pageWidth / 2, 25, { align: 'center' });
      
      yPos = 45;

      // ============ QUESTIONS BY SECTION ============
      const sections = result.examConfig?.subjects || [];
      const totalQuestions = result.questions.length;
      let processedCount = 0;
      let globalQuestionNumber = 0;

      for (const section of sections) {
        const partQuestions = result.questions.filter(q => q.part === section.part);
        if (partQuestions.length === 0) continue;

        // Section header
        checkNewPage(20);
        
        const startNum = globalQuestionNumber + 1;
        const endNum = globalQuestionNumber + partQuestions.length;

        pdf.setFillColor(30, 64, 175);
        pdf.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Part ${section.part}: ${section.name}`, margin + 6, yPos + 8);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Q.${startNum} - Q.${endNum}`, margin + contentWidth - 25, yPos + 8);
        yPos += 18;

        // Process questions
        for (const question of partQuestions) {
          globalQuestionNumber++;
          
          // Estimate space needed (minimum)
          checkNewPage(60);

          // Question number
          pdf.setFillColor(59, 130, 246);
          pdf.roundedRect(margin, yPos, 18, 8, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Q.${globalQuestionNumber}`, margin + 9, yPos + 5.5, { align: 'center' });
          yPos += 12;

          // Question image(s)
          const questionImgUrls = getQuestionImageUrl(question);
          
          if ('single' in questionImgUrls && questionImgUrls.single) {
            const imgData = await loadImage(questionImgUrls.single);
            if (imgData) {
              const maxWidth = contentWidth;
              const maxHeight = 50;
              let imgWidth = maxWidth;
              let imgHeight = (imgData.height / imgData.width) * imgWidth;
              
              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = (imgData.width / imgData.height) * imgHeight;
              }
              
              checkNewPage(imgHeight + 5);
              
              try {
                const imgX = margin + (contentWidth - imgWidth) / 2;
                pdf.addImage(imgData.data, 'JPEG', imgX, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 4;
              } catch {
                yPos += 4;
              }
            }
          } else if ('hindi' in questionImgUrls || 'english' in questionImgUrls) {
            // Bilingual - show both
            const hindiUrl = 'hindi' in questionImgUrls ? questionImgUrls.hindi : null;
            const englishUrl = 'english' in questionImgUrls ? questionImgUrls.english : null;
            
            for (const [lang, url] of [['हिंदी', hindiUrl], ['English', englishUrl]] as const) {
              if (!url) continue;
              
              checkNewPage(45);
              
              // Language label
              pdf.setFillColor(59, 130, 246);
              pdf.roundedRect(margin, yPos, 20, 6, 1, 1, 'F');
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'bold');
              pdf.text(lang, margin + 10, yPos + 4.2, { align: 'center' });
              yPos += 8;
              
              const imgData = await loadImage(url);
              if (imgData) {
                const maxWidth = contentWidth - 4;
                const maxHeight = 40;
                let imgWidth = maxWidth;
                let imgHeight = (imgData.height / imgData.width) * imgWidth;
                
                if (imgHeight > maxHeight) {
                  imgHeight = maxHeight;
                  imgWidth = (imgData.width / imgData.height) * imgHeight;
                }
                
                try {
                  const imgX = margin + 2;
                  pdf.addImage(imgData.data, 'JPEG', imgX, yPos, imgWidth, imgHeight);
                  yPos += imgHeight + 4;
                } catch {
                  yPos += 2;
                }
              }
            }
          }

          // Options
          yPos += 2;
          for (const option of question.options) {
            checkNewPage(14);
            
            const isCorrect = option.isCorrect;
            
            // Option background
            if (isCorrect) {
              pdf.setFillColor(220, 252, 231);
              pdf.setDrawColor(34, 197, 94);
            } else {
              pdf.setFillColor(248, 250, 252);
              pdf.setDrawColor(229, 231, 235);
            }
            pdf.roundedRect(margin, yPos, contentWidth, 11, 2, 2, 'FD');
            
            // Option label
            if (isCorrect) {
              pdf.setFillColor(34, 197, 94);
            } else {
              pdf.setFillColor(226, 232, 240);
            }
            pdf.roundedRect(margin + 3, yPos + 2, 7, 7, 3.5, 3.5, 'F');
            
            pdf.setTextColor(isCorrect ? 255 : 71, isCorrect ? 255 : 85, isCorrect ? 255 : 105);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(option.id, margin + 6.5, yPos + 7, { align: 'center' });

            // Option image
            const optionImgUrls = getOptionImageUrl(option);
            
            if ('single' in optionImgUrls && optionImgUrls.single) {
              const optImgData = await loadImage(optionImgUrls.single);
              if (optImgData) {
                try {
                  const optMaxHeight = 8;
                  let optImgWidth = (optImgData.width / optImgData.height) * optMaxHeight;
                  if (optImgWidth > contentWidth - 20) {
                    optImgWidth = contentWidth - 20;
                  }
                  pdf.addImage(optImgData.data, 'JPEG', margin + 13, yPos + 1.5, optImgWidth, optMaxHeight);
                } catch {
                  // Skip if image fails
                }
              }
            } else if ('hindi' in optionImgUrls || 'english' in optionImgUrls) {
              // Bilingual options
              let xOffset = margin + 13;
              for (const url of [optionImgUrls.hindi, optionImgUrls.english] as const) {
                if (!url) continue;
                const optImgData = await loadImage(url);
                if (optImgData) {
                  try {
                    const optMaxHeight = 8;
                    let optImgWidth = (optImgData.width / optImgData.height) * optMaxHeight;
                    if (optImgWidth > (contentWidth - 20) / 2) {
                      optImgWidth = (contentWidth - 20) / 2;
                    }
                    pdf.addImage(optImgData.data, 'JPEG', xOffset, yPos + 1.5, optImgWidth, optMaxHeight);
                    xOffset += optImgWidth + 5;
                  } catch {
                    // Skip if image fails
                  }
                }
              }
            }
            
            yPos += 13;
          }

          yPos += 8; // Space between questions
          
          processedCount++;
          setProgress(Math.round((processedCount / totalQuestions) * 100));
        }
      }

      // ============ FOOTER ============
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated for practice purposes only. Not affiliated with any official examination body.', 
        pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save
      const fileName = `${examName.replace(/\s+/g, '_')}_AnswerKey_HD_${downloadLanguage}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      setIsGenerating(false);
      setProgress(100);
      return true;
    } catch (error) {
      console.error('PDF HD generation error:', error);
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
