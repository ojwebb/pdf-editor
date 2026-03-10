"use client";

import React, { useRef } from "react";
import { Template } from "@pdfme/common";
import { exportPdf, exportTemplateJson } from "@/lib/export";

interface ExportBarProps {
  template: Template | null;
  designerRef?: React.MutableRefObject<any | null>;
  onImportTemplate?: (template: Template) => void;
}

export default function ExportBar({
  template,
  designerRef,
  onImportTemplate,
}: ExportBarProps) {
  const importRef = useRef<HTMLInputElement>(null);

  const getCurrentTemplate = (): Template | null => {
    if (designerRef?.current) {
      try {
        return designerRef.current.getTemplate();
      } catch {
        return template;
      }
    }
    return template;
  };

  const handleExportPdf = async () => {
    const t = getCurrentTemplate();
    if (!t) return;

    // Build inputs from schema names
    const inputs = t.schemas.map((page: any[]) => {
      const pageInput: Record<string, string> = {};
      page.forEach((el: any) => {
        if (el.name) {
          pageInput[el.name] = el.content || el.data || "";
        }
      });
      return pageInput;
    });

    // pdfme expects a flat inputs array matching pages
    // If no inputs, provide empty objects
    const finalInputs =
      inputs.length > 0 ? [Object.assign({}, ...inputs)] : [{}];

    await exportPdf(t, finalInputs);
  };

  const handleExportJson = () => {
    const t = getCurrentTemplate();
    if (!t) return;
    exportTemplateJson(t);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Template;
      onImportTemplate?.(parsed);

      if (designerRef?.current) {
        designerRef.current.updateTemplate(parsed);
      }
    } catch {
      alert("Invalid template JSON file.");
    }

    // Reset input
    if (importRef.current) importRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white">
      <button
        onClick={handleExportPdf}
        disabled={!template}
        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Export PDF
      </button>
      <button
        onClick={handleExportJson}
        disabled={!template}
        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Export JSON
      </button>
      <label className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 cursor-pointer transition-colors">
        Import Template
        <input
          ref={importRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
}
