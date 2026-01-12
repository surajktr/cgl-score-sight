import jsPDF from 'jspdf';
import type { AnalysisResult } from './mockData';

export async function generateAnalysisPDF(result: AnalysisResult): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  pdf.setFillColor(30, 64, 175); // Blue
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SSC CGL Response Sheet Analysis', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, 25, { align: 'center' });
  
  yPos = 45;

  // Candidate Information Box
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'F');
  
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Candidate Information', margin + 5, yPos + 8);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  
  const candidateInfo = [
    ['Name:', result.candidate.name || 'N/A'],
    ['Roll Number:', result.candidate.rollNumber || 'N/A'],
    ['Test Date:', result.candidate.testDate || 'N/A'],
    ['Shift:', result.candidate.shift || 'N/A'],
    ['Centre:', result.candidate.centreName || 'N/A'],
  ];
  
  let infoY = yPos + 16;
  const colWidth = (pageWidth - 2 * margin - 10) / 2;
  
  candidateInfo.forEach((info, idx) => {
    const xOffset = idx % 2 === 0 ? margin + 5 : margin + 5 + colWidth;
    const rowY = infoY + Math.floor(idx / 2) * 8;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(info[0], xOffset, rowY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(info[1], xOffset + 25, rowY);
  });
  
  yPos += 55;

  // Score Summary Box
  pdf.setFillColor(220, 252, 231); // Light green
  pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(22, 101, 52);
  pdf.text('Score Summary', margin + 5, yPos + 10);
  
  // Large score display
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(22, 163, 74);
  pdf.text(`${result.totalScore.toFixed(1)}`, margin + 5, yPos + 28);
  
  pdf.setFontSize(12);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`/ ${result.maxScore}`, margin + 35, yPos + 28);
  
  // Stats on the right
  const statsX = pageWidth / 2 + 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  pdf.setFillColor(34, 197, 94);
  pdf.circle(statsX, yPos + 14, 2, 'F');
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Correct: ${result.correctCount} (+${result.correctCount * 2})`, statsX + 5, yPos + 16);
  
  pdf.setFillColor(239, 68, 68);
  pdf.circle(statsX, yPos + 22, 2, 'F');
  pdf.text(`Wrong: ${result.wrongCount} (${(result.wrongCount * -0.5).toFixed(1)})`, statsX + 5, yPos + 24);
  
  pdf.setFillColor(156, 163, 175);
  pdf.circle(statsX, yPos + 30, 2, 'F');
  pdf.text(`Unattempted: ${result.unattemptedCount} (0)`, statsX + 5, yPos + 32);
  
  yPos += 45;

  // Section-wise Breakdown
  addNewPageIfNeeded(60);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Section-wise Breakdown', margin, yPos);
  yPos += 8;
  
  // Table header
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  
  const tableHeaders = ['Section', 'Correct', 'Wrong', 'Unattempted', 'Score'];
  const colWidths = [70, 25, 25, 30, 25];
  let tableX = margin + 3;
  
  tableHeaders.forEach((header, idx) => {
    pdf.text(header, tableX, yPos + 5);
    tableX += colWidths[idx];
  });
  
  yPos += 10;
  
  // Table rows
  result.sections.forEach((section, idx) => {
    if (idx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos - 2, pageWidth - 2 * margin, 8, 'F');
    }
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    
    tableX = margin + 3;
    const rowData = [
      `Part ${section.part} - ${section.subject}`,
      section.correct.toString(),
      section.wrong.toString(),
      section.unattempted.toString(),
      section.score.toFixed(1),
    ];
    
    rowData.forEach((cell, cellIdx) => {
      if (cellIdx === 0) {
        pdf.setFontSize(8);
      } else {
        pdf.setFontSize(9);
      }
      pdf.text(cell, tableX, yPos + 4);
      tableX += colWidths[cellIdx];
    });
    
    yPos += 8;
  });
  
  yPos += 10;

  // Questions List
  addNewPageIfNeeded(20);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Question-wise Analysis', margin, yPos);
  yPos += 10;
  
  const parts: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  
  for (const part of parts) {
    addNewPageIfNeeded(15);
    
    const partQuestions = result.questions.filter(q => q.part === part);
    const partSection = result.sections.find(s => s.part === part);
    
    // Part header
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Part ${part} - ${partSection?.subject || ''}`, margin + 5, yPos + 7);
    
    if (partSection) {
      pdf.setFontSize(9);
      pdf.text(
        `✓ ${partSection.correct}  ✗ ${partSection.wrong}  ○ ${partSection.unattempted}  |  Score: ${partSection.score.toFixed(1)}`,
        pageWidth - margin - 70,
        yPos + 7
      );
    }
    
    yPos += 15;
    
    // Questions grid (5 per row)
    const questionsPerRow = 10;
    const cellWidth = (pageWidth - 2 * margin) / questionsPerRow;
    
    for (let i = 0; i < partQuestions.length; i += questionsPerRow) {
      addNewPageIfNeeded(12);
      
      const rowQuestions = partQuestions.slice(i, i + questionsPerRow);
      
      rowQuestions.forEach((q, idx) => {
        const cellX = margin + idx * cellWidth;
        
        // Background based on status
        if (q.status === 'correct') {
          pdf.setFillColor(220, 252, 231);
        } else if (q.status === 'wrong') {
          pdf.setFillColor(254, 226, 226);
        } else {
          pdf.setFillColor(243, 244, 246);
        }
        
        pdf.roundedRect(cellX + 1, yPos, cellWidth - 2, 10, 1, 1, 'F');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        
        if (q.status === 'correct') {
          pdf.setTextColor(22, 101, 52);
        } else if (q.status === 'wrong') {
          pdf.setTextColor(153, 27, 27);
        } else {
          pdf.setTextColor(107, 114, 128);
        }
        
        pdf.text(`Q${q.questionNumber}`, cellX + 3, yPos + 6);
        
        // Show selected answer
        const selected = q.options.find(o => o.isSelected);
        const correct = q.options.find(o => o.isCorrect);
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        
        if (q.status === 'correct') {
          pdf.text(`✓${selected?.id || ''}`, cellX + cellWidth - 10, yPos + 6);
        } else if (q.status === 'wrong') {
          pdf.text(`${selected?.id || '?'}→${correct?.id || '?'}`, cellX + cellWidth - 15, yPos + 6);
        } else {
          pdf.text(`→${correct?.id || '?'}`, cellX + cellWidth - 10, yPos + 6);
        }
      });
      
      yPos += 12;
    }
    
    yPos += 5;
  }

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175);
  pdf.text(
    'Generated by SSC CGL Response Sheet Analyzer',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  const fileName = `SSC_CGL_Analysis_${result.candidate.rollNumber || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
