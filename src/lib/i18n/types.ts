export type Language = "en" | "fr";

export interface TranslationDict {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    loading: string;
    empty: string;
    new: string;
    upload: string;
    download: string;
  };
  nav: {
    dashboard: string;
    analytics: string;
    personalDetails: string;
    documents: string;
    timeOff: string;
    timeTracking: string;
    benefits: string;
    notes: string;
    presentations: string;
    canvas: string;
    pdfTools: string;
    invoice: string;
    withdrawalMethods: string;
    settings: string;
  };
  onboarding: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    stepLanguage: string;
    stepProfile: string;
    stepTheme: string;
    stepNotifications: string;
    yourName: string;
    yourEmail: string;
    yourRole: string;
    choosePalette: string;
    enableNotifications: string;
    notificationsDesc: string;
    finish: string;
    next: string;
    back: string;
  };
  notes: {
    title: string;
    all: string;
    memos: string;
    longNotes: string;
    todos: string;
    pinned: string;
    archive: string;
    trash: string;
    quickPlaceholder: string;
    send: string;
    tagPlaceholder: string;
    emptyNotes: string;
    emptyHint: string;
  };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    languageDesc: string;
    accentColor: string;
    accentColorDesc: string;
    notifications: string;
    testNotification: string;
    clearData: string;
    clearDataDesc: string;
  };
}
