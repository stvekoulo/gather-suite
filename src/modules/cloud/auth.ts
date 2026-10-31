// Public endpoints only. The database connection string must never ship in the app:
// accounts are separated by the JWT below and row-level security (cloud/schema.sql).
export const AUTH_URL = "https://ep-shiny-dew-zaqz31c1.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth";
export const DATA_URL = "https://ep-shiny-dew-zaqz31c1.apirest.c-2.eu-west-2.aws.neon.tech/neondb/rest/v1";

const SESSION_KEY = "gather:cloud-session";
export type CloudUser = { id: string; email: string; name?: string };
type Session = { token?: string; user: CloudUser };

// ponytail: session token in webview storage, protected by the CSP; move to the OS keychain when distributing widely.
export function storedSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null; } catch { return null; }
}
function store(session: Session | null) {
  jwt = null;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* the session then only lasts until the app closes */ }
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
  PASSWORD_TOO_SHORT: "Mot de passe trop court (8 caractères minimum).",
  INVALID_EMAIL: "Adresse e-mail invalide.",
  INVALID_OTP: "Code incorrect ou expiré.",
  INVALID_PASSWORD: "Mot de passe incorrect.",
};
async function call(path: string, init: RequestInit = {}) {
  const token = storedSession()?.token;
  const response = await fetch(AUTH_URL + path, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new Error(MESSAGES[body.code ?? ""] ?? body.message ?? `Service de compte indisponible (${response.status}).`);
  }
  return response;
}
async function authenticate(path: string, body: object) {
  const response = await call(path, { method: "POST", body: JSON.stringify(body) });
  const data = (await response.json()) as { token?: string; user: CloudUser };
  const session = { token: response.headers.get("set-auth-token") ?? data.token, user: data.user };
  store(session);
  return session.user;
}
export const signUp = (name: string, email: string, password: string) => authenticate("/sign-up/email", { name, email, password });
export const signIn = (email: string, password: string) => authenticate("/sign-in/email", { email, password });
export async function requestPasswordReset(email: string) {
  await call("/forget-password/email-otp", { method: "POST", body: JSON.stringify({ email }) });
}
export async function resetPassword(email: string, otp: string, password: string) {
  await call("/email-otp/reset-password", { method: "POST", body: JSON.stringify({ email, otp, password }) });
}
export async function deleteUser(password: string) {
  await call("/delete-user", { method: "POST", body: JSON.stringify({ password }) });
  store(null);
}
export async function signOut() {
  await call("/sign-out", { method: "POST", body: "{}" }).catch(() => undefined);
  store(null);
}

let jwt: { value: string; expires: number } | null = null;
const expiry = (token: string) => {
  try { return (JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp: number }).exp * 1000; } catch { return 0; }
};
/** Short-lived token for the Data API. */
export async function accessToken() {
  if (jwt && jwt.expires - Date.now() > 30_000) return jwt.value;
  const response = await call("/token");
  const value = response.headers.get("set-auth-jwt") ?? ((await response.json()) as { token?: string }).token;
  if (!value) throw new Error("Session expirée : reconnectez-vous.");
  jwt = { value, expires: expiry(value) };
  return value;
}
