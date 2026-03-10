"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePdfContext } from "@/components/PdfContext";
import { downloadBlob } from "@/lib/export";

export default function EditorPage() {
  const router = useRouter();
  const { parsedPdf } = usePdfContext();

  const blobUrl = useMemo(() => {
    if (!parsedPdf) return null;
    const blob = new Blob([parsedPdf.buffer], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  }, [parsedPdf]);

  if (!parsedPdf || !blobUrl) {
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

  const handleExport = () => {
    const blob = new Blob([parsedPdf.buffer], { type: "application/pdf" });
    downloadBlob(blob, "combined.pdf");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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
          <h1 className="text-lg font-semibold text-gray-800">PDF Preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {parsedPdf.pageCount} page
            {parsedPdf.pageCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleExport}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </header>

      <iframe
        src={blobUrl}
        className="flex-1 w-full border-none"
        title="PDF Preview"
      />
    </div>
  );
}
