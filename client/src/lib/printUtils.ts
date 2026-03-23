import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function buildPrintHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; background: white; color: #111; font-size: 14px; }
    @media print {
      body { padding: 0; }
      @page { margin: 0.5in; }
    }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
    th, td { text-align: left; padding: 8px 12px; font-size: 13px; }
    thead tr { border-bottom: 2px solid #333; }
    tbody tr { border-bottom: 1px solid #ddd; }
    h1, h2, h3, h4, h5, h6 { margin-bottom: 8px; color: #111; }
    h1 { font-size: 22px; } h2 { font-size: 18px; } h3 { font-size: 16px; }
    p { margin-bottom: 6px; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .gap-2 { gap: 8px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }
    .flex { display: flex; } .flex-col { flex-direction: column; }
    .items-center { align-items: center; } .justify-between { justify-content: space-between; }
    .space-y-2 > * + * { margin-top: 8px; }
    .space-y-4 > * + * { margin-top: 16px; }
    .space-y-6 > * + * { margin-top: 24px; }
    .text-sm { font-size: 12px; } .text-xs { font-size: 11px; } .text-lg { font-size: 16px; } .text-xl { font-size: 18px; } .text-2xl { font-size: 22px; }
    .font-bold { font-weight: bold; } .font-semibold { font-weight: 600; } .font-medium { font-weight: 500; }
    .text-gray-500 { color: #6b7280; } .text-gray-600 { color: #4b5563; } .text-gray-700 { color: #374151; } .text-gray-900 { color: #111827; }
    .text-right { text-align: right; }
    .bg-gray-50 { background: #f9fafb; } .bg-gray-100 { background: #f3f4f6; }
    .border { border: 1px solid #e5e7eb; } .border-b { border-bottom: 1px solid #e5e7eb; } .border-t { border-top: 1px solid #e5e7eb; }
    .border-b-2 { border-bottom: 2px solid #333; } .border-t-2 { border-top: 2px solid #333; }
    .rounded { border-radius: 4px; } .rounded-lg { border-radius: 8px; } .rounded-md { border-radius: 6px; }
    .p-2 { padding: 8px; } .p-3 { padding: 12px; } .p-4 { padding: 16px; } .p-6 { padding: 24px; }
    .px-2 { padding-left: 8px; padding-right: 8px; } .px-4 { padding-left: 16px; padding-right: 16px; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; } .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .mb-2 { margin-bottom: 8px; } .mb-4 { margin-bottom: 16px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; }
    .w-full { width: 100%; }
    .hidden, .print\\:hidden, button, [role="button"], svg.lucide { display: none !important; }
    img { max-width: 120px; height: auto; }
    .badge, [class*="badge"] { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

export function printElement(elementId: string, title: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    return false;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return false;
  }

  const html = buildPrintHtml(element.innerHTML, title);
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);

  return true;
}

export async function exportElementToPDF(
  elementId: string,
  fileName: string
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const offscreen = document.createElement("div");
  offscreen.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    "width:794px",
    "height:auto",
    "overflow:visible",
    "background:#ffffff",
    "z-index:-1",
    "font-family:inherit",
  ].join(";");

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText =
    "width:794px;height:auto;overflow:visible;background:#ffffff;padding:24px;box-sizing:border-box;";

  clone.querySelectorAll("button,[role='button'],svg.lucide").forEach(
    (el) => ((el as HTMLElement).style.display = "none")
  );

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(offscreen, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      height: offscreen.scrollHeight,
      windowWidth: 794,
    });

    document.body.removeChild(offscreen);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 10;
    const contentWidth = 210 - margin * 2;
    const pageHeight = 297 - margin * 2;
    const ratio = contentWidth / canvas.width;
    const scaledHeight = canvas.height * ratio;

    if (scaledHeight <= pageHeight) {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, contentWidth, scaledHeight);
    } else {
      let yPos = 0;
      let pageCount = 0;
      const sliceH = pageHeight / ratio;
      while (yPos < canvas.height) {
        if (pageCount > 0) pdf.addPage();
        const curSlice = Math.min(sliceH, canvas.height - yPos);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = curSlice;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, yPos, canvas.width, curSlice, 0, 0, canvas.width, curSlice);
          pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", margin, margin, contentWidth, curSlice * ratio);
        }
        yPos += sliceH;
        pageCount++;
      }
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    if (document.body.contains(offscreen)) document.body.removeChild(offscreen);
    console.error("PDF export error:", error);
    return false;
  }
}

/**
 * Appends a canvas to the PDF, slicing it into A4 pages as needed.
 */
function appendCanvasToPDF(
  pdf: InstanceType<typeof jsPDF>,
  canvas: HTMLCanvasElement,
  isFirstPage: boolean
): void {
  const pageW = 210;
  const pageH = 297;
  const ratio = pageW / canvas.width;
  const pageSliceH = pageH / ratio;

  let yPos = 0;
  let firstSlice = true;

  while (yPos < canvas.height) {
    if (!isFirstPage || !firstSlice) pdf.addPage();
    firstSlice = false;

    const sliceH = Math.min(pageSliceH, canvas.height - yPos);
    if (sliceH <= 0) break;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;
    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, yPos, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, pageW, sliceH * ratio);
    }

    yPos += pageSliceH;
  }
}

/**
 * Two-render approach: captures #page1-content and #inspection-section separately
 * so the inspection section ALWAYS starts at the top of a new page, with no slicing.
 *
 * Works by cloning the off-screen template into a visible position on document.body
 * so html2canvas can reliably measure and capture it.
 */
export async function exportContractTemplateToPDF(fileName: string): Promise<boolean> {
  const template = document.getElementById("contract-pdf-template");
  if (!template) {
    console.error("exportContractTemplateToPDF: #contract-pdf-template not found in DOM");
    return false;
  }

  // Wait for car-view data-URL images to be loaded (set by React useEffect after mount).
  await new Promise<void>((resolve) => {
    const deadline = Date.now() + 5000;
    const check = () => {
      const imgs = Array.from(template.querySelectorAll('img[src^="data:"]')) as HTMLImageElement[];
      if (imgs.length >= 4 && imgs.every((img) => img.complete && img.naturalWidth > 0)) {
        return resolve();
      }
      if (Date.now() >= deadline) return resolve(); // give up after 5s
      setTimeout(check, 60);
    };
    check();
  });

  // Clone the template and position it visibly but behind all content.
  // html2canvas cannot reliably capture elements at left:-9999px; a low z-index clone works better.
  const clone = template.cloneNode(true) as HTMLElement;
  clone.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "z-index:-9999",
    "pointer-events:none",
    `width:${template.offsetWidth || 794}px`,
    "min-height:0",
    "background:#ffffff",
  ].join(";");
  document.body.appendChild(clone);

  const page1El = clone.querySelector("#page1-content") as HTMLElement | null;
  const page2El = clone.querySelector("#inspection-section") as HTMLElement | null;

  const captureOpts = (w: number, h: number) => ({
    scale: 2 as const,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: w,
    height: h,
    windowWidth: w,
  });

  try {
    let canvas1: HTMLCanvasElement;
    let canvas2: HTMLCanvasElement | null = null;

    if (!page1El || !page2El) {
      // Fallback: single-canvas capture of the whole template
      await new Promise((r) => setTimeout(r, 120));
      const w = clone.scrollWidth;
      const h = clone.scrollHeight;
      canvas1 = await html2canvas(clone, captureOpts(w, h));
    } else {
      // --- Capture Page 1: hide inspection section ---
      page2El.style.display = "none";
      await new Promise((r) => setTimeout(r, 120));
      const w = clone.scrollWidth;
      const h1 = clone.scrollHeight;
      canvas1 = await html2canvas(clone, captureOpts(w, h1));

      // --- Capture Page 2: show inspection, hide page1 ---
      page2El.style.display = "";
      page1El.style.display = "none";
      await new Promise((r) => setTimeout(r, 120));
      const h2 = clone.scrollHeight;
      canvas2 = await html2canvas(clone, captureOpts(w, h2));
    }

    document.body.removeChild(clone);

    // --- Build PDF ---
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    appendCanvasToPDF(pdf, canvas1, true);
    if (canvas2) appendCanvasToPDF(pdf, canvas2, false);

    pdf.save(fileName);
    return true;
  } catch (error) {
    if (document.body.contains(clone)) document.body.removeChild(clone);
    console.error("Contract PDF export error:", error);
    return false;
  }
}
