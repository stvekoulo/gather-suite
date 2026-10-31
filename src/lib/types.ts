export type EventColor = "green" | "purple" | "cyan" | "orange" | "pink" | "blue";

/** Dates are local calendar days stored as "YYYY-MM-DD"; times are minutes from midnight. */
export type CalEvent = {
  noteId?: string;
  id: string;
  title: string;
  date: string;
  start: number;
  end: number;
  allDay: boolean;
  color: EventColor;
  note?: string;
  location?: string;
  category?: string;
  requestId?: string;
};

export type LeaveStatus = "approved" | "pending" | "declined" | "cancelled";

export type LeaveType = "Time off" | "Sick" | "Extra leave" | "Half-day leave" | "Personal";

export type LeaveRequest = {
  id: string;
  status: LeaveStatus;
  type: LeaveType;
  /** Human label shown in the table, e.g. "2 days 4 hours" */
  duration: string;
  /** Days counted against the allowance */
  days: number;
  from: string;
  to: string;
  allDay: boolean;
  start?: number;
  end?: number;
  notes: string;
  submittedAt: string;
};

export type Holiday = { id: string; date: string; name: string };

export type Profile = {
  name: string;
  email: string;
  initials: string;
  phone: string;
  jobTitle: string;
  department: string;
  manager: string;
  location: string;
  startDate: string;
  birthday: string;
  address: string;
  emergencyContact: string;
  bio: string;
  company?: string;
  siret?: string;
  vatNumber?: string;
  legalMentions?: string;
};

export type Settings = {
  weekStartsOn: 0 | 1;
  timeFormat: "24h" | "12h";
  dayStartHour: number;
  contractDays: number;
  carryoverDays: number;
  showWeekends: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  hasCompletedOnboarding?: boolean;
  accentColor?: string;
  language?: string;
  currency?: string;
  closeToTray?: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
};

export type DocCategory = "Contract" | "Payslip" | "Policy" | "Medical" | "Tax" | "Other" | string;

export type DocumentFile = {
  id: string;
  name: string;
  category: DocCategory;
  size: number;
  uploadedAt: string;
  /** data: URL for files uploaded in this browser (small files only) */
  dataUrl?: string;
  editorContent?: import("@tiptap/react").JSONContent;
  pageSetup?: import("@/modules/documents/document-layout").DocumentLayout;
  starred?: boolean;
};

export type TimeEntry = {
  id: string;
  date: string;
  project: string;
  task: string;
  minutes: number;
  billable: boolean;
  invoiceId?: string;
};

export type Timer = { running: boolean; startedAt: number | null; project: string; task: string };

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type InvoiceItem = { id: string; description: string; quantity: number; rate: number };

export type Invoice = {
  id: string;
  number: string;
  client: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes: string;
  currency: string;
  /** VAT in percent; absent or 0 means no tax line. */
  taxRate?: number;
};

export type WithdrawalKind = "bank" | "paypal" | "wise" | "card";

export type WithdrawalMethod = {
  id: string;
  kind: WithdrawalKind;
  label: string;
  holder: string;
  /** Masked tail only, never a full number */
  last4: string;
  currency: string;
  isDefault: boolean;
  addedAt: string;
};

export type Benefit = {
  id: string;
  name: string;
  provider: string;
  category: "Health" | "Wellness" | "Learning" | "Financial" | "Lifestyle";
  description: string;
  budget: number;
  used: number;
  enrolled: boolean;
  renewsOn: string;
};

export type TransactionRecurrence = "none" | "monthly" | "quarterly" | "yearly";

export type FinanceTransaction = {
  id: string;
  type: "income" | "expense";
  title: string;
  amount: number;
  category: string;
  date: string;
  methodLabel?: string;
  invoiceNumber?: string;
  notes?: string;
  status: "completed" | "pending";
  recurrence?: TransactionRecurrence;
  isSubscription?: boolean;
  syncCalendar?: boolean;
  /** Absent on older entries, which were always in euros. */
  currency?: string;
};

export type Client = { id: string; name: string; email?: string; phone?: string; address?: string; siret?: string; notes?: string };

export type Workspace = { id: string; name: string };

export type AppState = {
  version: number;
  workspaceId: string;
  workspaces: Workspace[];
  events: CalEvent[];
  requests: LeaveRequest[];
  holidays: Holiday[];
  profile: Profile;
  settings: Settings;
  notifications: AppNotification[];
  documents: DocumentFile[];
  timeEntries: TimeEntry[];
  timer: Timer;
  invoices: Invoice[];
  withdrawalMethods: WithdrawalMethod[];
  benefits: Benefit[];
  financeTransactions: FinanceTransaction[];
  clients: Client[];
};
