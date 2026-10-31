import { test, expect, type Page } from "@playwright/test";
import { createSeed, STATE_VERSION } from "../src/lib/seed";

test.beforeEach(async ({ page }) => {
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true;
  await page.addInitScript(({ seed, version }) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("seeded", "1"); localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })); } }, { seed, version: STATE_VERSION });
});

const capture = async (page: Page, kind: string, text: string) => {
  await page.keyboard.press("Control+Shift+N");
  await page.getByRole("tab", { name: kind, exact: true }).click();
  await page.getByLabel("Contenu à capturer").fill(text);
  await page.keyboard.press("Control+Enter");
};
const search = async (page: Page, text: string) => {
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder(/Nom de fichier/).fill(text);
};

test("quick capture from any page is immediately searchable, and opens where it belongs", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await capture(page, "Note", "Budget prévisionnel Zéphyr");
  await capture(page, "Tâche", "Relancer Zéphyr");
  await search(page, "zephyr");
  await expect(page.getByRole("option", { name: /Budget prévisionnel/ })).toBeVisible();
  await page.getByRole("option", { name: /Relancer Zéphyr/ }).click();
  await expect(page).toHaveURL(/tasks/);
  await expect(page.getByLabel("Titre de la tâche")).toHaveValue("Relancer Zéphyr");
});

test("search finds an imported file by name and by the words inside it", async ({ page }) => {
  await page.goto("/documents");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "contrat-orion.txt", mimeType: "text/plain", buffer: Buffer.from("Clause de confidentialité renforcée") });
  await expect(page.getByText("contrat-orion.txt").first()).toBeVisible();
  await search(page, "orion");
  await expect(page.getByRole("option", { name: /contrat-orion/ })).toBeVisible();
  await page.getByPlaceholder(/Nom de fichier/).fill("confidentialité");
  await expect(page.getByRole("option", { name: /contrat-orion/ })).toBeVisible();
});

test("a FCFA and a dollar subscription add up in the preferred currency", async ({ page }) => {
  await page.route("https://open.er-api.com/**", (route) => route.fulfill({ json: { result: "success", rates: { USD: 2, XOF: 655.957, EUR: 1 } } }));
  await page.goto("/withdrawal-methods");
  for (const [title, amount, currency] of [["Abo FCFA", "6559.57", "XOF"], ["Abo USD", "20", "USD"]]) {
    await page.getByRole("button", { name: /Dépense|Ajouter|Nouvelle/ }).first().click();
    await page.getByRole("dialog").getByRole("textbox").first().fill(title);
    await page.getByRole("spinbutton").fill(amount);
    await page.getByRole("button", { name: "Devise" }).click();
    await page.getByRole("option", { name: currency, exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /Enregistrer|Ajouter|Valider/ }).click();
  }
  await expect(page.getByText(/^20,00\s€$/).first()).toBeVisible();
});

test("a note becomes a task and a client sheet gathers its activity", async ({ page }) => {
  await page.goto("/clients");
  await page.getByLabel("Nouveau client").fill("Atlas");
  await page.getByRole("button", { name: "Ajouter le client" }).click();
  await expect(page.getByRole("button", { name: "Atlas" })).toBeVisible();
  await page.goto("/notes");
  await page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last().fill("Réunion Atlas à préparer");
  await page.getByRole("button", { name: /Enregistrer|Save Note/ }).click();
  await page.getByRole("button", { name: "Modifier", exact: true }).first().click();
  await page.getByRole("button", { name: "Créer une tâche" }).click();
  await expect(page.getByRole("button", { name: "Voir la tâche liée" })).toBeVisible();
  await page.getByRole("button", { name: "Voir la tâche liée" }).click();
  await expect(page).toHaveURL(/tasks/);
  await page.goto("/clients");
  await page.getByRole("button", { name: "Atlas" }).click();
  await expect(page.getByText(/Réunion Atlas à préparer/)).toBeVisible();
});

test("the account step refuses a wrong password with a clear message, without leaving the local app", async ({ page }) => {
  await page.route("**/sign-in/email", (route) => route.fulfill({ status: 401, json: { code: "INVALID_EMAIL_OR_PASSWORD", message: "x" } }));
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Données", exact: true }).click();
  await page.getByRole("button", { name: "J’ai déjà un compte" }).click();
  await page.getByLabel("E-mail du compte").fill("test@example.invalid");
  await page.getByLabel("Mot de passe du compte").fill("not-a-password");
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "E-mail ou mot de passe incorrect." })).toBeVisible();
});

test("signing in syncs: the account's notes arrive and local ones are sent", async ({ page }) => {
  const header = btoa(JSON.stringify({ alg: "none" })), claims = btoa(JSON.stringify({ exp: Date.now() / 1000 + 900, sub: "u1" }));
  const pushed: { collection: string; item_id: string }[] = [];
  await page.route("**/sign-in/email", (route) => route.fulfill({ json: { token: "session", user: { id: "u1", email: "a@example.invalid" } } }));
  await page.route("**/auth/token", (route) => route.fulfill({ json: { token: `${header}.${claims}.x` } }));
  await page.route("**/rest/v1/gather_items**", async (route) => {
    if (route.request().method() === "POST") { pushed.push(...(route.request().postDataJSON() as typeof pushed)); return route.fulfill({ status: 201, body: "" }); }
    const workspaceId = "ws-main";
    return route.fulfill({ json: route.request().url().includes("updated_at=gt") ? [] : [{ space_id: workspaceId, collection: "notes", item_id: "cloud-1", deleted: false, updated_at: "2026-06-01T00:00:00.000Z", payload: { id: "cloud-1", type: "note", title: "Venue du cloud", content: "Note d’un autre PC", isTop: false, isArchived: false, isRecycle: false, tags: [], references: [], attachments: [], createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" } }] });
  });
  await page.goto("/notes");
  await page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last().fill("Note locale avant connexion");
  await page.getByRole("button", { name: /Enregistrer|Save Note/ }).click();
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Données", exact: true }).click();
  await page.getByRole("button", { name: "J’ai déjà un compte" }).click();
  await page.getByLabel("E-mail du compte").fill("a@example.invalid");
  await page.getByLabel("Mot de passe du compte").fill("not-a-password");
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page.getByText(/Synchronisé le/)).toBeVisible();
  expect(pushed.some((r) => r.collection === "notes")).toBe(true);
  await page.goto("/notes");
  await expect(page.getByText("Note d’un autre PC")).toBeVisible();
  await expect(page.getByText("Note locale avant connexion")).toBeVisible();
});

test("forgotten password resets with an e-mailed code", async ({ page }) => {
  const calls: string[] = [];
  await page.route("**/forget-password/email-otp", (route) => { calls.push("code"); return route.fulfill({ json: { success: true } }); });
  await page.route("**/email-otp/reset-password", (route) => { calls.push((route.request().postDataJSON() as { otp: string }).otp); return route.fulfill({ json: { success: true } }); });
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Données", exact: true }).click();
  await page.getByRole("button", { name: "J’ai déjà un compte" }).click();
  await page.getByRole("button", { name: "Mot de passe oublié ?" }).click();
  await page.getByLabel("E-mail du compte").fill("a@example.invalid");
  await page.getByRole("button", { name: "Recevoir un code" }).click();
  await page.getByLabel("Code reçu par e-mail").fill("123456");
  await page.getByLabel("Nouveau mot de passe").fill("new-password-1");
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText("Mot de passe modifié. Connectez-vous.")).toBeVisible();
  expect(calls).toEqual(["code", "123456"]);
});

test("deleting an account checks the password before erasing anything", async ({ page }) => {
  const header = btoa(JSON.stringify({ alg: "none" })), claims = btoa(JSON.stringify({ exp: Date.now() / 1000 + 900, sub: "u1" }));
  const log: string[] = [];
  let passwordOk = false;
  await page.route("**/sign-in/email", (route) => (passwordOk || !log.includes("signed-in")) ? (log.push("signed-in"), route.fulfill({ json: { token: "s", user: { id: "u1", email: "a@example.invalid" } } })) : route.fulfill({ status: 401, json: { code: "INVALID_EMAIL_OR_PASSWORD" } }));
  await page.route("**/auth/token", (route) => route.fulfill({ json: { token: `${header}.${claims}.x` } }));
  await page.route("**/rest/v1/gather_items**", (route) => { if (route.request().method() === "DELETE") { log.push("erased"); return route.fulfill({ status: 204, body: "" }); } return route.request().method() === "POST" ? route.fulfill({ status: 201, body: "" }) : route.fulfill({ json: [] }); });
  await page.route("**/delete-user", (route) => { log.push("deleted"); return route.fulfill({ json: { success: true } }); });
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Données", exact: true }).click();
  await page.getByRole("button", { name: "J’ai déjà un compte" }).click();
  await page.getByLabel("E-mail du compte").fill("a@example.invalid");
  await page.getByLabel("Mot de passe du compte").fill("not-a-password");
  await page.getByRole("button", { name: "Me connecter" }).click();
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await page.getByLabel("Mot de passe actuel").fill("wrong-password");
  await page.getByRole("button", { name: "Supprimer définitivement mon compte" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  expect(log).not.toContain("erased");
  passwordOk = true;
  await page.getByRole("button", { name: "Supprimer définitivement mon compte" }).click();
  await expect(page.getByRole("button", { name: "J’ai déjà un compte" })).toBeVisible();
  expect(log.slice(-2)).toEqual(["erased", "deleted"]);
});

test("the modules follow the English setting", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: /English/ }).click();
  await page.waitForTimeout(500);
  await page.goto("/tasks");
  await expect(page.getByRole("button", { name: "New task" })).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByLabel("New client")).toBeVisible();
  await page.goto("/pdf-tools");
  await expect(page.getByRole("button", { name: /^Merge/ })).toBeVisible();
  await page.goto("/withdrawal-methods");
  await expect(page.getByText("Net profit")).toBeVisible();
});

test("PDF steps only finish when they are really done, and block the next one", async ({ page }) => {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create(); doc.addPage([200, 200]);
  const file = { name: "a.pdf", mimeType: "application/pdf", buffer: Buffer.from(await doc.save()) };
  await page.goto("/pdf-tools");
  await page.getByRole("button", { name: /Signature numérique/ }).click();
  await expect(page.getByRole("button", { name: /^Lancer/ })).toBeDisabled();
  await expect(page.getByText("Terminé")).toHaveCount(0);
  await page.getByRole("button", { name: "Retour aux outils" }).click();
  await page.getByRole("button", { name: /^Fusionner/ }).click();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles(file);
  await expect(page.getByRole("button", { name: /^Lancer/ })).toBeDisabled();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles({ ...file, name: "b.pdf" });
  await expect(page.getByRole("button", { name: /^Lancer/ })).toBeEnabled();
  await page.getByRole("button", { name: "Retour aux outils" }).click();
  await page.getByRole("button", { name: /Annoter/ }).click();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles(file);
  await expect(page.getByRole("button", { name: /^Lancer/ })).toBeDisabled();
  await page.getByLabel("Texte à ajouter").fill("Bonjour");
  await expect(page.getByRole("button", { name: /^Lancer/ })).toBeEnabled();
});

test("documents create and save themselves; Ctrl+S works everywhere; spreadsheets undo", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: /^Page vierge/ }).click();
  await page.getByLabel("Titre du document").fill("Auto QA");
  const editor = page.getByLabel("Contenu du document");
  await editor.click();
  await editor.pressSequentially("Texte sans cliquer sur enregistrer");
  await page.waitForTimeout(1800);
  await page.reload();
  await page.getByRole("button", { name: "Accueil Docs" }).click().catch(() => undefined);
  await expect(page.getByText("Auto QA.docx").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Sans titre.docx");

  await page.goto("/sheets");
  const name = page.getByRole("textbox", { name: /Zone Nom/ }), formula = page.getByPlaceholder(/Saisissez une valeur/);
  await name.waitFor();
  await name.fill("A1"); await name.press("Enter");
  await formula.fill("111"); await formula.press("Enter");
  await expect(page.getByRole("main").getByText("111", { exact: true }).first()).toBeVisible();
  await page.keyboard.press("Control+s");
  await expect(page.getByText("Enregistré", { exact: true }).first()).toBeVisible();
  await page.mouse.click(5, 300);
  await page.locator("body").press("Control+z");
  await expect(page.getByRole("main").getByText("111", { exact: true })).toHaveCount(0);
});

test("the Dynamic Island starts and stops the timer and logs the time", async ({ page }) => {
  await page.goto("/time-tracking");
  await page.getByText("Démarrer un chrono").first().click();
  await page.getByPlaceholder("Projet ou client...").fill("Atlas");
  await page.getByPlaceholder("Tâche / description...").fill("Revue");
  await page.getByRole("button", { name: "Lancer" }).click();
  await expect(page.getByText("Enregistrement en direct")).toBeVisible();
  await page.getByRole("button", { name: "Arrêter" }).first().click();
  await expect(page.locator("main").getByText("Revue", { exact: true }).locator("visible=true").first()).toBeVisible();
});

test("the floating island stays usable above an open dialog, in the light theme", async ({ page }) => {
  await page.goto("/time-tracking");
  await page.getByText("Démarrer un chrono").first().click();
  await page.getByRole("button", { name: "Lancer" }).click();
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Nouvel événement" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const island = page.locator("div.pointer-events-auto.fixed").first();
  const { top, background } = await island.evaluate((el) => { const box = el.getBoundingClientRect(); const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2); return { top: el.contains(hit), background: getComputedStyle(el.firstElementChild!).backgroundColor }; });
  expect(top).toBe(true);
  expect(background).not.toBe("rgb(24, 24, 27)");
});
