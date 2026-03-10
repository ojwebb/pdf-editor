"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Template } from "@pdfme/common";
import { usePdfContext } from "./PdfContext";

interface PdfDesignerProps {
  onTemplateChange?: (template: Template) => void;
  designerRef?: React.MutableRefObject<any | null>;
}

export default function PdfDesigner({
  onTemplateChange,
  designerRef: externalRef,
}: PdfDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalDesignerRef = useRef<any>(null);
  const { template } = usePdfContext();

  const initDesigner = useCallback(async () => {
    if (!containerRef.current || !template) return;

    // Dynamic import — pdfme requires browser APIs
    const { Designer } = await import("@pdfme/ui");
    const { getPlugins } = await import("@/lib/plugins");

    // Destroy previous instance if exists
    if (internalDesignerRef.current) {
      internalDesignerRef.current.destroy();
    }

    const designer = new Designer({
      domContainer: containerRef.current,
      template,
      options: {
        theme: {
          token: { colorPrimary: "#4f46e5" },
        },
      },
      plugins: getPlugins(),
    });

    designer.onChangeTemplate((updated: Template) => {
      onTemplateChange?.(updated);
    });

    internalDesignerRef.current = designer;
    if (externalRef) {
      externalRef.current = designer;
    }
  }, [template, onTemplateChange, externalRef]);

  useEffect(() => {
    initDesigner();

    return () => {
      if (internalDesignerRef.current) {
        internalDesignerRef.current.destroy();
        internalDesignerRef.current = null;
      }
    };
  }, [initDesigner]);

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No PDF loaded. Please upload a PDF first.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[600px]"
    />
  );
}
