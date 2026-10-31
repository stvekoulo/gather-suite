"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useRef, useState } from "react";
import { FileUpIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PDF_CATEGORIES, PDF_TOOLS, type PdfCategory, type PdfToolItem } from "./pdf-catalog-data";

interface PdfToolCatalogProps {
  onSelectTool: (tool: PdfToolItem, preloadedFiles?: File[]) => void;
}

// Visual catalog displaying Stirling-PDF style categorized tools with on-demand import
export function PdfToolCatalog({ onSelectTool }: PdfToolCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<PdfCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTools = PDF_TOOLS.filter((tool) => {
    if (activeCategory !== "all" && tool.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return tool.title.toLowerCase().includes(q) || tool.hint.toLowerCase().includes(q);
    }
    return true;
  });

  const handleFiles = (files: File[]) => {
    const valid = files.filter(
      (f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
    );
    if (valid.length > 0) {
      const defaultTool =
        valid.length > 1
          ? PDF_TOOLS.find((t) => t.id === "merge")!
          : PDF_TOOLS.find((t) => t.id === "compress")!;
      onSelectTool(defaultTool, valid);
      return;
    }
    const images = files.filter((f) => /\.(png|jpe?g)$/i.test(f.name));
    if (images.length > 0) onSelectTool(PDF_TOOLS.find((t) => t.id === "images")!, images);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
        }}
      />

      {/* On-demand Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-surface/90 backdrop-blur-sm p-8 text-center animate-in fade-in">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand shadow-sm">
            <FileUpIcon className="size-7" />
          </div>
          <p className="mt-3 text-base font-semibold text-fg">
            {translate("Déposez vos fichiers PDF ici")}
          </p>
          <p className="text-xs text-fg-2">
            {translate("Ils seront automatiquement dirigés vers l'outil adapté")}
          </p>
        </div>
      )}

      {/* Category Tabs, Search Bar & On-demand Import Button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-hairline pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {PDF_CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? PDF_TOOLS.length
                : PDF_TOOLS.filter((t) => t.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "text-fg-2 hover:bg-hover hover:text-fg"
                )}
              >
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-2 text-fg-2"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative min-w-52">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-icon" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate("Rechercher une opération...")}
              className="h-8.5 w-full rounded-lg border border-hairline bg-surface pl-8.5 pr-8 text-xs text-fg outline-none focus:border-brand"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-2 hover:text-fg"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick on-demand file pick */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs font-medium shrink-0"
          >
            <FileUpIcon className="size-3.5" />
            {translate("Importer un PDF")}
          </Button>
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool)}
              className="group relative flex flex-col items-start gap-3 rounded-2xl border border-hairline bg-surface p-4 text-left shadow-xs transition-all hover:border-brand/40 hover:shadow-md"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-fg group-hover:bg-brand-tint group-hover:text-brand transition-colors">
                  <IconComponent className="size-4.5" />
                </div>
                {tool.badge && (
                  <span className="rounded-md bg-brand-tint px-2 py-0.5 text-[10px] font-semibold text-brand">
                    {tool.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg group-hover:text-brand transition-colors">
                  {translate(tool.title)}
                </h3>
                <p className="mt-1 text-xs text-fg-2 line-clamp-2 leading-relaxed">
                  {translate(tool.hint)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
