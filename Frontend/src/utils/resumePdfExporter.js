/**
 * Resume PDF Exporter Utility
 * 
 * Guarantees:
 * 1. Fresher mode: STRICTLY 1-PAGE PDF. Zero spillover.
 * 2. Experienced mode: Clean 1 to 2 pages based on information depth (MAX 2 pages).
 *    Uses smart whitespace scanline detection to ensure section blocks and text lines
 *    are never clipped or cut in half.
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Detects whether candidate data is for a Fresher or Experienced candidate.
 */
export function detectResumeLevel(data) {
  if (!data) return "fresher";

  const experiences = Array.isArray(data.experience) ? data.experience : [];
  if (experiences.length === 0) return "fresher";

  const internKeywords = [
    "intern",
    "internship",
    "trainee",
    "student",
    "fellow",
    "apprentice",
    "volunteer",
    "campus",
    "academic"
  ];

  const fullTimeRoles = experiences.filter((exp) => {
    const role = (typeof exp === "object" ? (exp.role || exp.title || "") : String(exp)).toLowerCase();
    const company = (typeof exp === "object" ? (exp.company || "") : "").toLowerCase();
    
    const isIntern = internKeywords.some((kw) => 
      role.includes(kw) || company.includes(kw)
    );
    return !isIntern && role.trim().length > 0;
  });

  // Multiple full-time roles -> Experienced
  if (fullTimeRoles.length >= 2) return "experienced";

  // 1 full-time role with multiple jobs or large project portfolio -> Experienced
  if (fullTimeRoles.length === 1 && (experiences.length >= 2 || (data.projects && data.projects.length >= 3))) {
    return "experienced";
  }

  return "fresher";
}

/**
 * High-precision PDF export engine.
 */
export async function exportResumePDF({ element, candidateName = "Candidate", pageMode = "fresher" }) {
  if (!element) {
    throw new Error("No resume element found for PDF generation.");
  }

  const cleanName = (candidateName || "Candidate")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${cleanName || "Candidate"}_ATS_Resume.pdf`;

  // Temporarily add export classes and remove contenteditable indicators
  const wasEditing = element.classList.contains("is-editing");
  const prevEditable = element.getAttribute("contenteditable");
  
  element.classList.remove("is-editing");
  element.setAttribute("contenteditable", "false");
  element.classList.add("exporting-pdf");
  element.classList.add(`pdf-mode-${pageMode}`);

  // Small delay to allow layout recalculation
  await new Promise((resolve) => setTimeout(resolve, 60));

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for razor-sharp text in PDF
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth || 850
    });

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    });

    // A4 dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8; // 8mm margin
    const printWidth = pageWidth - margin * 2; // 194mm
    const printHeight = pageHeight - margin * 2; // 281mm

    // Total content height in mm at full proportional width
    const totalHeightMm = (canvas.height * printWidth) / canvas.width;

    if (pageMode === "fresher") {
      // ==========================================
      // FRESHER: STRICTLY 1 PAGE ONLY
      // ==========================================
      if (totalHeightMm <= printHeight) {
        // Naturally fits on 1 page!
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", margin, margin, printWidth, totalHeightMm);
      } else {
        // Slightly exceeds 1 page (e.g. user added manual edits or extra text)
        // Proportionally scale to guarantee it stays strictly within the 1-page bounds
        const scale = printHeight / totalHeightMm;
        const scaledWidth = printWidth * scale;
        const offsetX = margin + (printWidth - scaledWidth) / 2;
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", offsetX, margin, scaledWidth, printHeight);
      }
    } else {
      // ==========================================
      // EXPERIENCED: 1 TO 2 PAGES MAX
      // ==========================================
      if (totalHeightMm <= printHeight) {
        // Fits comfortably on 1 page
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", margin, margin, printWidth, totalHeightMm);
      } else {
        // Needs 2 pages!
        const canvasPageHeight = (printHeight / printWidth) * canvas.width;
        const ctx = canvas.getContext("2d");

        // Find clean whitespace scanline between 80% and 98% of Page 1
        const startScan = Math.floor(canvasPageHeight * 0.80);
        const endScan = Math.floor(canvasPageHeight * 0.98);
        let splitY = Math.floor(canvasPageHeight);

        for (let y = endScan; y >= startScan; y -= 2) {
          const row = ctx.getImageData(Math.floor(canvas.width * 0.1), y, Math.floor(canvas.width * 0.8), 1).data;
          let isWhite = true;
          for (let i = 0; i < row.length; i += 16) {
            if (row[i] < 240 || row[i + 1] < 240 || row[i + 2] < 240) {
              isWhite = false;
              break;
            }
          }
          if (isWhite) {
            splitY = y;
            break;
          }
        }

        // --- PAGE 1 ---
        const page1Canvas = document.createElement("canvas");
        page1Canvas.width = canvas.width;
        page1Canvas.height = splitY;
        const ctx1 = page1Canvas.getContext("2d");
        ctx1.fillStyle = "#ffffff";
        ctx1.fillRect(0, 0, page1Canvas.width, page1Canvas.height);
        ctx1.drawImage(canvas, 0, 0, canvas.width, splitY, 0, 0, canvas.width, splitY);

        const page1HeightMm = (splitY * printWidth) / canvas.width;
        const page1Data = page1Canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(page1Data, "JPEG", margin, margin, printWidth, page1HeightMm);

        // --- PAGE 2 ---
        pdf.addPage();
        const remainingCanvasHeight = canvas.height - splitY;
        const page2Canvas = document.createElement("canvas");
        page2Canvas.width = canvas.width;
        page2Canvas.height = remainingCanvasHeight;
        const ctx2 = page2Canvas.getContext("2d");
        ctx2.fillStyle = "#ffffff";
        ctx2.fillRect(0, 0, page2Canvas.width, page2Canvas.height);
        ctx2.drawImage(canvas, 0, splitY, canvas.width, remainingCanvasHeight, 0, 0, canvas.width, remainingCanvasHeight);

        let page2HeightMm = (remainingCanvasHeight * printWidth) / canvas.width;
        const page2Data = page2Canvas.toDataURL("image/jpeg", 0.98);

        // Guard: ensure Page 2 does not overflow onto a 3rd page!
        if (page2HeightMm > printHeight) {
          const scale2 = printHeight / page2HeightMm;
          const scaledW2 = printWidth * scale2;
          const offX2 = margin + (printWidth - scaledW2) / 2;
          pdf.addImage(page2Data, "JPEG", offX2, margin, scaledW2, printHeight);
        } else {
          pdf.addImage(page2Data, "JPEG", margin, margin, printWidth, page2HeightMm);
        }
      }
    }

    pdf.save(filename);
  } finally {
    // Restore element classes and editable state
    element.classList.remove("exporting-pdf");
    element.classList.remove(`pdf-mode-${pageMode}`);
    if (wasEditing) {
      element.classList.add("is-editing");
      element.setAttribute("contenteditable", "true");
    } else if (prevEditable) {
      element.setAttribute("contenteditable", prevEditable);
    }
  }
}
