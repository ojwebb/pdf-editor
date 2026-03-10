export interface PageDimension {
  width: number;
  height: number;
}

export interface ParsedPdf {
  base64: string;
  pageCount: number;
  pageDimensions: PageDimension[];
  buffer: ArrayBuffer;
}

export interface EditorElement {
  id: string;
  name: string;
  type: string;
  pageIndex: number;
}

export interface UploadedFile {
  id: string;
  file: File;
  type: "pdf" | "image";
  name: string;
  preview?: string;
}
