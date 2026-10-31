export type TaskStatus = "todo" | "progress" | "review" | "done";
export interface Task {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  priority: "low" | "normal" | "high";
  dueDate?: string;
  eventId?: string;
  noteId?: string;
  subtasks: { id: string; title: string; done: boolean }[];
}
export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  format?: "general" | "currency" | "percent" | "number" | "date";
  textColor?: string;
  bgColor?: string;
}

export interface Spreadsheet {
  id: string;
  title: string;
  cells: Record<string, string>;
  styles?: Record<string, CellStyle>;
  rows: number;
  columns: number;
  sheets?: Array<{ id: string; name: string; cells: Record<string, string>; styles?: Record<string, CellStyle> }>;
  activeSheetId?: string;
}
export interface Snippet { id: string; title: string; content: string; }
