"use client";

import PdfUploader from "@/components/PdfUploader";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Editor</h1>
        <p className="text-gray-500 mb-8">
          Upload a PDF, then assign background images per page. The PDF content
          layers on top of the backgrounds.
        </p>
        <PdfUploader />
      </div>
    </main>
  );
}
