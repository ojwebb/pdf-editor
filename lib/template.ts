import { Template } from "@pdfme/common";
import { ParsedPdf } from "@/types";

export function buildTemplate(pdf: ParsedPdf): Template {
  const schemas: Template["schemas"] = [];
  for (let i = 0; i < pdf.pageCount; i++) {
    schemas.push([]);
  }

  return {
    basePdf: `data:application/pdf;base64,${pdf.base64}`,
    schemas,
  };
}
