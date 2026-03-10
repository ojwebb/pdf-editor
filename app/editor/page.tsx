"use client";

import React, { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Template } from "@pdfme/common";
import { usePdfContext } from "@/components/PdfContext";
import PdfDesigner from "@/components/PdfDesigner";
import ElementPanel from "@/components/ElementPanel";
import ExportBar from "@/components/ExportBar";

export default function EditorPage() {
  const router = useRouter();
  const { parsedPdf, template, setTemplate } = usePdfContext();
  const designerRef = useRef<any>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  const handleTemplateChange = useCallback(
    (updated: Template) => {
      setCurrentTemplate(updated);
      setTemplate(updated);
    },
    [setTemplate]
  );

  const handleImportTemplate = useCallback(
    (imported: Template) => {
      setCurrentTemplate(imported);
      setTemplate(imported);
    },
    [setTemplate]
  );

  // Redirect if no PDF loaded
  if (!parsedPdf) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500">No PDF loaded.</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Upload a PDF
        </button>
      </div>
    );
  }

  const activeTemplate = currentTemplate || template;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Back to upload"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">PDF Editor</h1>
        </div>
        <div className="text-sm text-gray-400">
          {parsedPdf.pageCount} page{parsedPdf.pageCount !== 1 ? "s" : ""} |{" "}
          {parsedPdf.pageDimensions[0]?.width.toFixed(0)} x{" "}
          {parsedPdf.pageDimensions[0]?.height.toFixed(0)} pt
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Designer area */}
        <div className="flex-1 overflow-hidden">
          <PdfDesigner
            onTemplateChange={handleTemplateChange}
            designerRef={designerRef}
          />
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-gray-200 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ElementPanel
              template={activeTemplate}
              onUpdateTemplate={handleTemplateChange}
              designerRef={designerRef}
            />
          </div>
          <ExportBar
            template={activeTemplate}
            designerRef={designerRef}
            onImportTemplate={handleImportTemplate}
          />
        </div>
      </div>
    </div>
  );
}
