export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: "work" | "meeting" | "personal" | "ideas";
  createdAt: string;
  updatedAt: string;
  linkedEventId?: string;
  linkedDocId?: string;
  pinned?: boolean;
}

export interface SlideItem {
  id: string;
  layout: "title" | "split" | "metrics" | "quote" | "bullets" | "blank";
  title: string;
  subtitle?: string;
  body?: string;
  metricNumber?: string;
  metricLabel?: string;
  bullets?: string[];
  notes?: string;
  background?: string;
  backgroundImage?: string;
  elements?: SlideElement[];
}

export interface SlideElement {
  id: string;
  type: "text" | "rectangle" | "ellipse" | "image" | "arrow" | "star" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  dataUrl?: string;
  color: string;
  fill: string;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  fontFamily?: string;
  anchor?: "top" | "middle" | "bottom";
  borderColor?: string;
  rotation?: number;
}

export interface PresentationDeck {
  id: string;
  title: string;
  description: string;
  slides: SlideItem[];
  theme: "dark" | "light" | "gradient" | "minimal" | "ocean" | "emerald" | "sunset";
  ratio?: "16:9" | "4:3";
  transition?: "fade" | "slide" | "pop" | "wipe" | "none";
  updatedAt: string;
}

export interface CanvasElement {
  id: string;
  type: "rectangle" | "ellipse" | "sticky" | "text" | "arrow";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  textColor?: string;
  linkedNoteId?: string;
}

export interface CanvasBoard {
  id: string;
  title: string;
  elements: CanvasElement[];
  zoom: number;
  panX: number;
  panY: number;
  updatedAt: string;
}

export interface PdfOperationJob {
  id: string;
  type: import("@/modules/pdf/pdf-engine").PdfTool | import("@/modules/pdf/raster-pdf").RasterTool | "convert" | "extract" | "images" | "splitzip" | "ocr";
  title: string;
  status: "idle" | "processing" | "completed" | "error";
  fileName: string;
  outputName?: string;
  createdAt: string;
}
