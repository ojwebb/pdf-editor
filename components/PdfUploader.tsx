"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { parsePdf } from "@/lib/pdf-utils";
import { buildTemplate } from "@/lib/template";
import { usePdfContext } from "./PdfContext";

export default function PdfUploader() {
  const router = useRouter();
  const { setParsedPdf, setTemplate } = usePdfContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const buffer = await file.arrayBuffer();
        const parsed = await parsePdf(buffer);
        setParsedPdf(parsed);
        setTemplate(buildTemplate(parsed));
        router.push("/editor");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse PDF."
        );
        setLoading(false);
      }
    },
    [setParsedPdf, setTemplate, router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        {...getRootProps()}
        className={`w-full max-w-xl border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-gray-500">Processing PDF...</p>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive
                ? "Drop your PDF here..."
                : "Drag & drop a PDF, or click to browse"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Supports multi-page PDFs
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
