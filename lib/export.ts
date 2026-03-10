import { generate } from "@pdfme/generator";
import { Template } from "@pdfme/common";
import { getPlugins } from "./plugins";

export async function exportPdf(
  template: Template,
  inputs: Record<string, string>[]
) {
  const pdf = await generate({
    template,
    inputs,
    plugins: getPlugins(),
  });
  const blob = new Blob([pdf.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edited.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTemplateJson(template: Template) {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
