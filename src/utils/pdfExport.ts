import { jsPDF } from "jspdf";
import { SavedContent } from "../types";

/**
 * Beautifully exports a saved note from the Offline Vault into a downloadable PDF document.
 * This is fully client-side and optimized for robust multi-page text formatting and clean layout typography.
 */
export function exportVaultItemToPDF(item: SavedContent) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // A4 dimensions: 210mm x 297mm
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2); // 170mm

  let currentPage = 1;
  let y = 30; // starting vertical position

  // Draw Page Header & Footer (called on every page)
  const drawHeaderFooter = (pageNum: number) => {
    // Header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("VIDYA AI • OFFLINE STUDY VAULT", margin, 12);
    
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineWidth(0.3);
    doc.line(margin, 15, pageWidth - margin, 15);

    // Footer
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(147, 51, 234); // purple-600
    doc.text("VIDYA AI", margin, pageHeight - 10);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Personal Study Guide", margin + 18, pageHeight - 10);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  // Helper to safely transition to a new page
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 22) {
      drawHeaderFooter(currentPage);
      doc.addPage();
      currentPage++;
      y = 30; // Reset to top margin
    }
  };

  // --- BEGIN CONTENT GENERATION ---

  // 1. MAIN TITLE HEADER CARD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(item.topic || "Untitled Study Note", contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  // Metadata block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : new Date().toLocaleString();
  doc.text(`Type: ${item.type.toUpperCase()}   |   Generated: ${dateStr}`, margin, y);
  y += 6;

  // Color Accent Divider
  doc.setDrawColor(147, 51, 234); // Purple-600
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 35, y);
  y += 10;

  // 2. CONCEPT SUMMARY (if available)
  if (item.summary) {
    const summaryLines = doc.splitTextToSize(item.summary, contentWidth - 10);
    const summaryHeight = summaryLines.length * 5 + 14;
    
    checkPageBreak(summaryHeight + 6);
    
    // Draw background panel tint for summary
    doc.setFillColor(250, 245, 255); // purple-50
    doc.rect(margin, y, contentWidth, summaryHeight, "F");
    
    // Border line left accent
    doc.setDrawColor(192, 132, 252); // purple-400
    doc.setLineWidth(1.0);
    doc.line(margin, y, margin, y + summaryHeight);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(126, 34, 206); // purple-700
    doc.text("CONCEPT SUMMARY PREVIEW", margin + 5, y + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(summaryLines, margin + 5, y + 12);
    
    y += summaryHeight + 8;
  }

  // 3. STUDENT REVIEW NOTEPAD (if available)
  if (item.notes && item.notes.trim()) {
    const notesLines = doc.splitTextToSize(item.notes, contentWidth - 10);
    const notesHeight = notesLines.length * 5 + 14;
    
    checkPageBreak(notesHeight + 6);
    
    // Draw background panel tint for notes (Amber)
    doc.setFillColor(255, 251, 235); // amber-50
    doc.rect(margin, y, contentWidth, notesHeight, "F");
    
    // Border line left accent
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.setLineWidth(1.0);
    doc.line(margin, y, margin, y + notesHeight);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text("✍️ STUDENT NOTEPAD ANNOTATIONS", margin + 5, y + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(notesLines, margin + 5, y + 12);
    
    y += notesHeight + 8;
  }

  // 4. CORE LESSON CHECKPOINTS (if available)
  if (item.keyPoints && item.keyPoints.length > 0) {
    checkPageBreak(25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Core Study Checkpoints", margin, y);
    y += 6;
    
    for (const pt of item.keyPoints) {
      const ptLines = doc.splitTextToSize(pt, contentWidth - 8);
      checkPageBreak(ptLines.length * 5 + 3);
      
      // Draw bullet mark
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(147, 51, 234); // purple-600
      doc.text("•", margin + 2, y + 0.5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(ptLines, margin + 7, y);
      
      y += ptLines.length * 5 + 3;
    }
    y += 4;
  }

  // 5. DETAILED EDUCATION LESSON (Rich markdown-like parsing)
  if (item.detailedExplanation && item.detailedExplanation.trim()) {
    checkPageBreak(25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Detailed Study Lesson Explanation", margin, y);
    y += 7;

    const lines = item.detailedExplanation.split("\n");
    
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        // Simple paragraph spacer
        checkPageBreak(5);
        y += 4;
        continue;
      }

      if (trimmed.startsWith("# ")) {
        // h1 heading
        const text = trimmed.substring(2);
        const split = doc.splitTextToSize(text, contentWidth);
        checkPageBreak(split.length * 6 + 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(split, margin, y + 2);
        y += split.length * 6 + 6;
      } else if (trimmed.startsWith("## ")) {
        // h2 heading
        const text = trimmed.substring(3);
        const split = doc.splitTextToSize(text, contentWidth);
        checkPageBreak(split.length * 5.5 + 5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(split, margin, y + 1.5);
        y += split.length * 5.5 + 5;
      } else if (trimmed.startsWith("### ")) {
        // h3 heading
        const text = trimmed.substring(4);
        const split = doc.splitTextToSize(text, contentWidth);
        checkPageBreak(split.length * 5 + 4);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        doc.text(split, margin, y + 1);
        y += split.length * 5 + 4;
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        // Bullet point item
        const text = trimmed.substring(2);
        const split = doc.splitTextToSize(text, contentWidth - 8);
        checkPageBreak(split.length * 4.8 + 2);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(147, 51, 234); // purple bullet
        doc.text("•", margin + 3, y + 0.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(split, margin + 8, y);
        y += split.length * 4.8 + 2;
      } else {
        // Standard body paragraph - clean up markdown bold tags
        const cleaned = trimmed.replace(/\*\*/g, "").replace(/\*/g, "").replace(/_/g, "");
        const split = doc.splitTextToSize(cleaned, contentWidth);
        checkPageBreak(split.length * 4.8 + 2.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(split, margin, y);
        y += split.length * 4.8 + 2.5;
      }
    }
  }

  // Draw header/footer for the final page
  drawHeaderFooter(currentPage);

  // Download the generated PDF file
  const sanitizedTopic = (item.topic || "study-notes")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  
  doc.save(`vidya-${sanitizedTopic}-study-notes.pdf`);
}
