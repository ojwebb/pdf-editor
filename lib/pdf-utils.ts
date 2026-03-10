import { PDFDocument } from "pdf-lib";
import { ParsedPdf } from "@/types";

export async function parsePdf(buffer: ArrayBuffer): Promise<ParsedPdf> {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();

  const pageDimensions = pages.map((p) => ({
    width: p.getWidth(),
    height: p.getHeight(),
  }));

  const base64 = Buffer.from(buffer).toString("base64");

  return {
    base64,
    pageCount: pages.length,
    pageDimensions,
    buffer,
  };
}

/**
 * Build a combined PDF where each page has a JPG background (if provided)
 * with the original PDF page layered on top.
 *
 * @param pdfBuffer - The uploaded PDF (top layer)
 * @param backgrounds - Array of image blobs, one per page (null = no background)
 */
export async function buildCombinedPdf(
  pdfBuffer: ArrayBuffer,
  backgrounds: (Blob | null)[]
): Promise<ParsedPdf> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const mergedDoc = await PDFDocument.create();
  const srcPages = srcDoc.getPages();

  for (let i = 0; i < srcPages.length; i++) {
    const srcPage = srcPages[i];
    const width = srcPage.getWidth();
    const height = srcPage.getHeight();

    const page = mergedDoc.addPage([width, height]);

    // Draw background image if provided
    const bg = backgrounds[i];
    if (bg) {
      const bgBytes = new Uint8Array(await bg.arrayBuffer());
      const isPng = bg.type === "image/png";
      const image = isPng
        ? await mergedDoc.embedPng(bgBytes)
        : await mergedDoc.embedJpg(bgBytes);

      // Scale to fill the entire page
      page.drawImage(image, { x: 0, y: 0, width, height });
    }

    // Embed the original PDF page on top
    const [embeddedPage] = await mergedDoc.embedPages([srcPage]);
    page.drawPage(embeddedPage, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await mergedDoc.save();
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;

  const pages = mergedDoc.getPages();
  const pageDimensions = pages.map((p) => ({
    width: p.getWidth(),
    height: p.getHeight(),
  }));

  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    base64,
    pageCount: pages.length,
    pageDimensions,
    buffer: arrayBuffer,
  };
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
