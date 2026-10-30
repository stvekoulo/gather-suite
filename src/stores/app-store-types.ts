import type {
  AppNotification,
  AppState,
  Benefit,
  CalEvent,
  DocumentFile,
  FinanceTransaction,
  Invoice,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Profile,
  Settings,
  TimeEntry,
  WithdrawalMethod,
} from "@/lib/types";

export type RequestInput = {
  type: LeaveType;
  from: string;
  to: string;
  allDay: boolean;
  start: number;
  end: number;
  notes: string;
};

export type Actions = {
  switchWorkspace: (id: string) => void;
  addWorkspace: (name: string) => void;
  saveEvent: (event: Omit<CalEvent, "id"> & { id?: string }) => CalEvent;
  moveEvent: (id: string, patch: Pick<CalEvent, "date" | "start" | "end">) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => void;
  measureRequest: (input: RequestInput) => { days: number; label: string };
  submitRequest: (input: RequestInput, existingId?: string) => LeaveRequest;
  setRequestStatus: (id: string, status: LeaveStatus) => void;
  deleteRequest: (id: string) => void;
  addHoliday: (date: string, name: string) => void;
  removeHoliday: (id: string) => void;
  notify: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addDocument: (doc: Omit<DocumentFile, "id" | "uploadedAt">) => void;
  updateDocument: (id: string, patch: Partial<DocumentFile>) => void;
  deleteDocument: (id: string) => void;
  startTimer: (project: string, task: string) => void;
  stopTimer: () => void;
  updateTimer: (patch: { project?: string; task?: string }) => void;
  saveTimeEntry: (entry: Omit<TimeEntry, "id"> & { id?: string }) => void;
  deleteTimeEntry: (id: string) => void;
  saveInvoice: (invoice: Omit<Invoice, "id"> & { id?: string }) => Invoice;
  setInvoiceStatus: (id: string, status: Invoice["status"]) => void;
  deleteInvoice: (id: string) => void;
  saveFinanceTransaction: (tx: Omit<FinanceTransaction, "id"> & { id?: string }) => FinanceTransaction;
  deleteFinanceTransaction: (id: string) => void;
  addWithdrawalMethod: (m: Omit<WithdrawalMethod, "id" | "addedAt" | "isDefault">) => void;
  setDefaultWithdrawalMethod: (id: string) => void;
  removeWithdrawalMethod: (id: string) => void;
  toggleBenefit: (id: string) => void;
  claimBenefit: (id: string, amount: number) => void;
  updateBenefit: (id: string, patch: Partial<Benefit>) => void;
  resetDemoData: () => void;
};

export type AppStore = AppState & Actions;

export type SliceSet = (partial: Partial<AppStore> | ((s: AppStore) => Partial<AppStore>)) => void;
export type SliceGet = () => AppStore;
