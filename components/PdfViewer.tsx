"use client";

import React, { useEffect, useRef } from "react";
import { Template } from "@pdfme/common";

interface PdfViewerProps {
  template: Template | null;
}

export default function PdfViewer({ template }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !template) return;

    const init = async () => {
      const { Viewer } = await import("@pdfme/ui");
      const { getPlugins } = await import("@/lib/plugins");

      if (viewerRef.current) {
        viewerRef.current.destroy();
      }

      const inputs = template.schemas.map((page: any[]) => {
        const pageInput: Record<string, string> = {};
        page.forEach((el: any) => {
          if (el.name) {
            pageInput[el.name] = el.content || el.data || "";
          }
        });
        return pageInput;
      });

      const viewer = new Viewer({
        domContainer: containerRef.current!,
        template,
        inputs: inputs.length > 0 ? [Object.assign({}, ...inputs)] : [{}],
        plugins: getPlugins(),
      });

      viewerRef.current = viewer;
    };

    init();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [template]);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No template to preview.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
}
