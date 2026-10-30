import type {
  AppNotification,
  Benefit,
  DocumentFile,
  Invoice,
  Profile,
  Settings,
  TimeEntry,
  WithdrawalMethod,
} from "./types";

// Clean initial empty profile for new install
export const SEED_PROFILE: Profile = {
  name: "",
  email: "",
  initials: "AU",
  phone: "",
  jobTitle: "",
  department: "",
  manager: "",
  location: "",
  startDate: new Date().toISOString().slice(0, 10),
  birthday: "",
  address: "",
  emergencyContact: "",
  bio: "",
};

// Default clean settings
export const SEED_SETTINGS: Settings = {
  weekStartsOn: 1,
  timeFormat: "24h",
  dayStartHour: 8,
  contractDays: 25,
  carryoverDays: 0,
  showWeekends: true,
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: false,
  hasCompletedOnboarding: false,
  accentColor: "monochrome",
  language: "fr",
};

// Clean initial empty lists for standalone product
export const SEED_NOTIFICATIONS: AppNotification[] = [];
export const SEED_DOCUMENTS: DocumentFile[] = [];
export const SEED_TIME_ENTRIES: TimeEntry[] = [];
export const SEED_INVOICES: Invoice[] = [];
export const SEED_WITHDRAWAL_METHODS: WithdrawalMethod[] = [];
export const SEED_BENEFITS: Benefit[] = [];
