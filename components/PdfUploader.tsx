"use client";

import React, { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { buildCombinedPdf } from "@/lib/pdf-utils";
import { buildTemplate } from "@/lib/template";
import { usePdfContext } from "./PdfContext";
import { UploadedFile } from "@/types";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export default function PdfUploader() {
  const router = useRouter();
  const { setParsedPdf, setTemplate } = usePdfContext();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const dragIdx = useRef<number | null>(null);

  const addFromUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setError(null);
    setFetchingUrl(true);
    try {
      const res = await fetch(
        `/api/fetch-image?url=${encodeURIComponent(url)}`
      );
      if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
      const blob = await res.blob();
      const filename = url.split("/").pop() || "image.jpg";
      const file = new File([blob], filename, { type: blob.type });
      const isImage = blob.type.startsWith("image/");
      setFiles((prev) => [
        ...prev,
        {
          id: uuid(),
          file,
          type: isImage ? "image" : "pdf",
          name: filename,
          preview: isImage ? URL.createObjectURL(blob) : undefined,
        },
      ]);
      setUrlInput("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch image from URL."
      );
    } finally {
      setFetchingUrl(false);
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    const newFiles: UploadedFile[] = accepted.map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: uuid(),
        file,
        type: isImage ? "image" : "pdf",
        name: file.name,
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Drag-to-reorder handlers
  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const parsed = await buildCombinedPdf(files);
      setParsedPdf(parsed);
      setTemplate(buildTemplate(parsed));
      // Clean up object URLs
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      router.push("/editor");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to build combined PDF."
      );
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
    disabled: loading,
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        } ${loading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-10 w-10 text-gray-400 mb-3"
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
        <p className="text-base font-medium text-gray-700">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop PDFs or images, or click to browse"}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          JPG, PNG, and PDF — each file becomes page background(s)
        </p>
      </div>

      {/* URL input */}
      <div className="w-full flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFromUrl()}
          placeholder="Paste image URL..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          disabled={fetchingUrl || loading}
        />
        <button
          type="button"
          onClick={addFromUrl}
          disabled={!urlInput.trim() || fetchingUrl || loading}
          className="px-4 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {fetchingUrl ? "Fetching..." : "Add"}
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-sm text-gray-500 font-medium">
            {files.length} file{files.length !== 1 ? "s" : ""} — drag to
            reorder
          </p>
          <ul className="space-y-1">
            {files.map((f, idx) => (
              <li
                key={f.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
              >
                <span className="text-xs text-gray-400 font-mono w-5 text-right shrink-0">
                  {idx + 1}
                </span>
                {/* Thumbnail */}
                {f.preview ? (
                  <img
                    src={f.preview}
                    alt={f.name}
                    className="h-10 w-10 object-cover rounded border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded border border-gray-200 bg-red-50 flex items-center justify-center text-xs font-bold text-red-400 shrink-0">
                    PDF
                  </div>
                )}
                <span className="text-sm text-gray-700 truncate flex-1">
                  {f.name}
                </span>
                <span className="text-xs text-gray-400 uppercase shrink-0">
                  {f.type}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label={`Remove ${f.name}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-3 bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Building PDF...
              </>
            ) : (
              "Continue to Editor"
            )}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
