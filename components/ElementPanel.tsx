"use client";

import React from "react";
import { Template } from "@pdfme/common";

interface ElementPanelProps {
  template: Template | null;
  onUpdateTemplate?: (template: Template) => void;
  designerRef?: React.MutableRefObject<any | null>;
}

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700",
  image: "bg-green-100 text-green-700",
  rectangle: "bg-purple-100 text-purple-700",
  ellipse: "bg-pink-100 text-pink-700",
  line: "bg-orange-100 text-orange-700",
  table: "bg-yellow-100 text-yellow-700",
};

function getTypeBadgeClass(type: string): string {
  return TYPE_COLORS[type] || "bg-gray-100 text-gray-700";
}

export default function ElementPanel({
  template,
  onUpdateTemplate,
  designerRef,
}: ElementPanelProps) {
  if (!template || !template.schemas) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        No elements yet. Add elements in the designer.
      </div>
    );
  }

  const handleRename = (
    pageIndex: number,
    elementIndex: number,
    newName: string
  ) => {
    if (!template) return;

    const updatedSchemas = template.schemas.map((page, pi) => {
      if (pi !== pageIndex) return page;
      return page.map((el: any, ei: number) => {
        if (ei !== elementIndex) return el;
        return { ...el, name: newName };
      });
    });

    const updatedTemplate = { ...template, schemas: updatedSchemas };
    onUpdateTemplate?.(updatedTemplate);

    if (designerRef?.current) {
      designerRef.current.updateTemplate(updatedTemplate);
    }
  };

  const handleDelete = (pageIndex: number, elementIndex: number) => {
    if (!template) return;

    const updatedSchemas = template.schemas.map((page, pi) => {
      if (pi !== pageIndex) return page;
      return page.filter((_: any, ei: number) => ei !== elementIndex);
    });

    const updatedTemplate = { ...template, schemas: updatedSchemas };
    onUpdateTemplate?.(updatedTemplate);

    if (designerRef?.current) {
      designerRef.current.updateTemplate(updatedTemplate);
    }
  };

  const hasElements = template.schemas.some(
    (page) => page.length > 0
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-700">Elements</h3>
      </div>

      {!hasElements && (
        <div className="p-4 text-gray-400 text-sm">
          No elements yet. Use the designer toolbar to add text, images, or
          shapes.
        </div>
      )}

      {template.schemas.map((page, pageIndex) => {
        if (page.length === 0) return null;
        return (
          <div key={pageIndex} className="border-b border-gray-100">
            <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Page {pageIndex + 1}
            </div>
            <div className="divide-y divide-gray-100">
              {page.map((element: any, elementIndex: number) => (
                <div
                  key={`${pageIndex}-${elementIndex}`}
                  className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50 group"
                >
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTypeBadgeClass(
                      element.type
                    )}`}
                  >
                    {element.type}
                  </span>
                  <input
                    type="text"
                    value={element.name || ""}
                    onChange={(e) =>
                      handleRename(pageIndex, elementIndex, e.target.value)
                    }
                    placeholder="element name"
                    className="flex-1 text-sm border border-transparent hover:border-gray-300 focus:border-indigo-400 focus:outline-none rounded px-1.5 py-0.5"
                  />
                  <button
                    onClick={() => handleDelete(pageIndex, elementIndex)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                    title="Delete element"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
