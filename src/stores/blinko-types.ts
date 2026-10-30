export type NoteType = "memo" | "note" | "todo";

export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface BlinkoNote {
  id: string;
  type: NoteType;
  title?: string;
  content: string;
  isTop: boolean;
  isArchived: boolean;
  isRecycle: boolean;
  tags: string[];
  references: string[];
  attachments: NoteAttachment[];
  createdAt: string;
  updatedAt: string;
  history?: NoteRevision[];
  comments?: NoteComment[];
  reviewedAt?: string;
  linkedEventId?: string;
  remindAt?: string;
  reminderFiredAt?: string;
}

export interface NoteRevision {
  id: string;
  title?: string;
  content: string;
  type: NoteType;
  tags: string[];
  createdAt: string;
}
export interface NoteComment {
  id: string;
  content: string;
  parentId?: string;
  createdAt: string;
}

export type BlinkoFilter =
  | "all"
  | "memo"
  | "note"
  | "todo"
  | "top"
  | "archived"
  | "recycle";
