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

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
