import { text, image, barcodes, line, table, rectangle, ellipse } from "@pdfme/schemas";

export function getPlugins() {
  return {
    Text: text,
    Image: image,
    Line: line,
    Rectangle: rectangle,
    Ellipse: ellipse,
    Table: table,
    ...barcodes,
  };
}
