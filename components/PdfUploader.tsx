"use client";

import React, { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { parsePdf, buildCombinedPdf } from "@/lib/pdf-utils";
import { buildTemplate } from "@/lib/template";
import { usePdfContext } from "./PdfContext";
import { PageDimension } from "@/types";

export default function PdfUploader() {
  const router = useRouter();
  const { setParsedPdf, setTemplate } = usePdfContext();

  // Step 1: PDF upload
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pageDims, setPageDims] = useState<PageDimension[]>([]);

  // Step 2: Per-page background URLs
  const [bgUrls, setBgUrls] = useState<string[]>([]);
  const [bgPreviews, setBgPreviews] = useState<(string | null)[]>([]);
  const bgBlobsRef = useRef<(Blob | null)[]>([]);
  const [fetchingIdx, setFetchingIdx] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Handle PDF drop
  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parsePdf(buffer);
      setPdfBuffer(buffer);
      setPdfName(file.name);
      setPageDims(parsed.pageDimensions);
      setBgUrls(new Array(parsed.pageCount).fill(""));
      setBgPreviews(new Array(parsed.pageCount).fill(null));
      bgBlobsRef.current = new Array(parsed.pageCount).fill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse PDF.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: loading,
  });

  // Step 2: Fetch a background image URL for a specific page
  const fetchBg = async (pageIdx: number) => {
    const url = bgUrls[pageIdx]?.trim();
    if (!url) return;
    setError(null);
    setFetchingIdx(pageIdx);
    try {
      const res = await fetch(
        `/api/fetch-image?url=${encodeURIComponent(url)}`
      );
      if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
      const blob = await res.blob();
      const previewUrl = URL.createObjectURL(blob);

      bgBlobsRef.current[pageIdx] = blob;
      setBgPreviews((prev) => {
        const old = prev[pageIdx];
        if (old) URL.revokeObjectURL(old);
        const next = [...prev];
        next[pageIdx] = previewUrl;
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch image from URL."
      );
    } finally {
      setFetchingIdx(null);
    }
  };

  const removeBg = (pageIdx: number) => {
    bgBlobsRef.current[pageIdx] = null;
    setBgPreviews((prev) => {
      if (prev[pageIdx]) URL.revokeObjectURL(prev[pageIdx]!);
      const next = [...prev];
      next[pageIdx] = null;
      return next;
    });
    setBgUrls((prev) => {
      const next = [...prev];
      next[pageIdx] = "";
      return next;
    });
  };

  // Build combined PDF and navigate
  const handleSubmit = async () => {
    if (!pdfBuffer) return;

    const blobs = bgBlobsRef.current;
    const hasBg = blobs.some((b) => b !== null);
    if (!hasBg) {
      setError("Add at least one background image before continuing.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const parsed = await buildCombinedPdf(pdfBuffer, blobs);
      setParsedPdf(parsed);
      setTemplate(buildTemplate(parsed));
      bgPreviews.forEach((p) => p && URL.revokeObjectURL(p));
      router.push("/editor");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to build combined PDF."
      );
      setLoading(false);
    }
  };

  // Step 1: No PDF yet
  if (!pdfBuffer) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-xl">
        <div
          {...getRootProps()}
          className={`w-full border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }`}
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
              ? "Drop your PDF here..."
              : "Drag & drop a PDF, or click to browse"}
          </p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  // Step 2: PDF loaded, assign backgrounds
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
      <div className="w-full flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{pdfName}</h2>
          <p className="text-sm text-gray-400">
            {pageDims.length} page{pageDims.length !== 1 ? "s" : ""} — paste
            background image URLs per page
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPdfBuffer(null);
            setPdfName("");
            setPageDims([]);
            setError(null);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Change PDF
        </button>
      </div>

      <div className="w-full space-y-3">
        {pageDims.map((dim, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-3 bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Page {idx + 1}{" "}
                <span className="text-gray-400 font-normal">
                  ({dim.width.toFixed(0)} x {dim.height.toFixed(0)} pt)
                </span>
              </span>
              {bgPreviews[idx] && (
                <button
                  type="button"
                  onClick={() => removeBg(idx)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            {bgPreviews[idx] ? (
              <img
                src={bgPreviews[idx]!}
                alt={`Page ${idx + 1} background`}
                className="w-full max-h-40 object-contain rounded border border-gray-200"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={bgUrls[idx]}
                  onChange={(e) =>
                    setBgUrls((prev) => {
                      const next = [...prev];
                      next[idx] = e.target.value;
                      return next;
                    })
                  }
                  onKeyDown={(e) => e.key === "Enter" && fetchBg(idx)}
                  placeholder="Paste background image URL..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  disabled={fetchingIdx !== null || loading}
                />
                <button
                  type="button"
                  onClick={() => fetchBg(idx)}
                  disabled={
                    !bgUrls[idx]?.trim() || fetchingIdx !== null || loading
                  }
                  className="px-4 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {fetchingIdx === idx ? "Fetching..." : "Add"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full mt-2 bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
