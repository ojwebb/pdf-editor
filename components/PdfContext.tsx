"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ParsedPdf } from "@/types";
import { Template } from "@pdfme/common";

interface PdfContextValue {
  parsedPdf: ParsedPdf | null;
  setParsedPdf: (pdf: ParsedPdf) => void;
  template: Template | null;
  setTemplate: (template: Template) => void;
}

const PdfContext = createContext<PdfContextValue | null>(null);

export function PdfProvider({ children }: { children: React.ReactNode }) {
  const [parsedPdf, setParsedPdfState] = useState<ParsedPdf | null>(null);
  const [template, setTemplateState] = useState<Template | null>(null);

  const setParsedPdf = useCallback((pdf: ParsedPdf) => {
    setParsedPdfState(pdf);
  }, []);

  const setTemplate = useCallback((t: Template) => {
    setTemplateState(t);
  }, []);

  return (
    <PdfContext.Provider
      value={{ parsedPdf, setParsedPdf, template, setTemplate }}
    >
      {children}
    </PdfContext.Provider>
  );
}

export function usePdfContext() {
  const ctx = useContext(PdfContext);
  if (!ctx) throw new Error("usePdfContext must be used within PdfProvider");
  return ctx;
}
