import { PDFDocument } from "pdf-lib";
import { ParsedPdf, UploadedFile } from "@/types";

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

export async function buildCombinedPdf(
  files: UploadedFile[]
): Promise<ParsedPdf> {
  const mergedDoc = await PDFDocument.create();

  for (const entry of files) {
    const buffer = await entry.file.arrayBuffer();

    if (entry.type === "pdf") {
      const srcDoc = await PDFDocument.load(buffer);
      const indices = srcDoc.getPageIndices();
      const copiedPages = await mergedDoc.copyPages(srcDoc, indices);
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    } else {
      // Image file — embed as full-page background
      const bytes = new Uint8Array(buffer);
      const isPng = entry.file.type === "image/png";
      const image = isPng
        ? await mergedDoc.embedPng(bytes)
        : await mergedDoc.embedJpg(bytes);

      const { width, height } = image.scale(1);
      const page = mergedDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    }
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
