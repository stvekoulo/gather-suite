type Row = Record<string, unknown>;
const object = (value: unknown): value is Row => !!value && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const strings = (value: unknown) => Array.isArray(value) && value.every((v) => typeof v === "string");
function requireValid(valid: unknown) { if (!valid) throw new Error("Sauvegarde corrompue : types ou valeurs des données invalides."); }
const rows = (value: unknown) => value as Row[];

export function validateData(app: Row, workspace: Row, blinko: Row) {
  const profile = app.profile as Row, settings = app.settings as Row, timer = app.timer as Row;
  requireValid(["name", "email", "initials", "phone", "jobTitle", "department", "manager", "location", "startDate", "birthday", "address", "emergencyContact", "bio"].every((key) => typeof profile[key] === "string"));
  requireValid([0, 1].includes(Number(settings.weekStartsOn)) && ["24h", "12h"].includes(String(settings.timeFormat)) && finite(settings.dayStartHour) && settings.dayStartHour >= 0 && settings.dayStartHour <= 23 && finite(settings.contractDays) && finite(settings.carryoverDays));
  requireValid(["showWeekends", "emailNotifications", "pushNotifications", "weeklyDigest"].every((key) => typeof settings[key] === "boolean"));
  requireValid(typeof timer.running === "boolean" && (timer.startedAt === null || finite(timer.startedAt)) && typeof timer.project === "string" && typeof timer.task === "string");
  for (const event of rows(app.events)) requireValid(finite(event.start) && finite(event.end) && event.start >= 0 && event.end <= 1440 && (event.allDay || event.end >= event.start) && typeof event.allDay === "boolean" && typeof event.color === "string");
  for (const entry of rows(app.timeEntries)) requireValid(finite(entry.minutes) && entry.minutes >= 0 && typeof entry.billable === "boolean");
  for (const doc of rows(app.documents)) {
    requireValid(finite(doc.size) && doc.size >= 0 && (doc.dataUrl === undefined || typeof doc.dataUrl === "string"));
    if (doc.pageSetup !== undefined) {
      const layout = doc.pageSetup; requireValid(object(layout) && ["A4", "LETTER"].includes(String(layout.size)) && ["portrait", "landscape"].includes(String(layout.orientation)) && finite(layout.margin) && layout.margin >= 5 && layout.margin <= 50 && typeof layout.header === "string" && typeof layout.footer === "string" && typeof layout.pageNumbers === "boolean" && typeof layout.tableOfContents === "boolean");
    }
  }
  for (const invoice of rows(app.invoices)) for (const item of rows(invoice.items)) requireValid(object(item) && typeof item.id === "string" && typeof item.description === "string" && finite(item.quantity) && item.quantity >= 0 && finite(item.rate) && item.rate >= 0);
  for (const note of rows(blinko.notes)) {
    for (const key of ["remindAt", "reminderFiredAt", "reviewedAt"]) if (note[key] !== undefined) requireValid(typeof note[key] === "string" && Number.isFinite(Date.parse(note[key] as string)));
    requireValid(strings(note.tags) && strings(note.references) && ["memo", "note", "todo"].includes(String(note.type)) && ["isTop", "isArchived", "isRecycle"].every((key) => typeof note[key] === "boolean"));
    for (const attachment of rows(note.attachments)) requireValid(object(attachment) && typeof attachment.id === "string" && typeof attachment.name === "string" && typeof attachment.type === "string" && finite(attachment.size) && attachment.size >= 0 && (attachment.url === undefined || typeof attachment.url === "string"));
  }
  for (const deck of rows(workspace.decks)) for (const slide of rows(deck.slides)) {
    requireValid(["title", "split", "metrics", "quote", "bullets"].includes(String(slide.layout)));
    if (slide.bullets !== undefined) requireValid(strings(slide.bullets));
    if (slide.elements !== undefined) {
      requireValid(Array.isArray(slide.elements));
      for (const element of rows(slide.elements)) requireValid(object(element) && ["text", "rectangle", "ellipse", "image"].includes(String(element.type)) && ["x", "y", "width", "height", "fontSize"].every((key) => finite(element[key])) && typeof element.color === "string" && typeof element.fill === "string");
    }
  }
  if (workspace.sheets !== undefined) {
    requireValid(Array.isArray(workspace.sheets));
    for (const sheet of rows(workspace.sheets)) requireValid(object(sheet) && typeof sheet.id === "string" && typeof sheet.title === "string" && finite(sheet.rows) && Number.isInteger(sheet.rows) && sheet.rows >= 1 && sheet.rows <= 200 && finite(sheet.columns) && Number.isInteger(sheet.columns) && sheet.columns >= 1 && sheet.columns <= 100 && object(sheet.cells) && Object.entries(sheet.cells).every(([address, value]) => /^[A-Z]+[1-9]\d*$/.test(address) && typeof value === "string"));
  }
  if (workspace.tasks !== undefined) {
    requireValid(Array.isArray(workspace.tasks));
    for (const task of rows(workspace.tasks)) requireValid(object(task) && typeof task.id === "string" && typeof task.title === "string" && typeof task.project === "string" && ["todo", "progress", "review", "done"].includes(String(task.status)) && ["low", "normal", "high"].includes(String(task.priority)) && Array.isArray(task.subtasks) && rows(task.subtasks).every((s) => object(s) && typeof s.id === "string" && typeof s.title === "string" && typeof s.done === "boolean"));
  }
  if (workspace.drawingLibrary !== undefined) requireValid(typeof workspace.drawingLibrary === "string" && Array.isArray(JSON.parse(workspace.drawingLibrary)));
}
