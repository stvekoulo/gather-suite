"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, resetPassword } from "./auth";
import { confirmMerge, deleteAccount, logIn, logOut, register, syncNow, useCloud } from "./cloud-sync";

type Mode = "signup" | "signin" | "forgot" | "reset";
const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Sign-in or sign-up form, used by the first-launch assistant and by the settings. */
export function AccountForm({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const go = (next: Mode) => { setMode(next); setError(""); setInfo(""); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setInfo("");
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email.trim());
        setInfo(translate("Si ce compte existe, un code a été envoyé."));
        setMode("reset");
      } else if (mode === "reset") {
        await resetPassword(email.trim(), code.trim(), password);
        setPassword(""); setCode("");
        setMode("signin");
        setInfo(translate("Mot de passe modifié. Connectez-vous."));
      } else {
        if (mode === "signup") await register(name.trim() || email.split("@")[0], email.trim(), password);
        else await logIn(email.trim(), password);
        setPassword("");
        onDone?.();
      }
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  };
  const submitLabel = { signup: "Créer mon compte", signin: "Me connecter", forgot: "Recevoir un code", reset: "Changer le mot de passe" }[mode];
  return (
    <form className="flex flex-col gap-2.5" onSubmit={(e) => void submit(e)}>
      {mode === "signup" && <Input aria-label={translate("Votre nom")} placeholder={translate("Votre nom")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
      <Input aria-label={translate("E-mail du compte")} type="email" required placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode === "reset" && <Input aria-label={translate("Code reçu par e-mail")} required inputMode="numeric" autoComplete="one-time-code" placeholder={translate("Code reçu par e-mail")} value={code} onChange={(e) => setCode(e.target.value)} />}
      {mode !== "forgot" && <Input aria-label={translate(mode === "reset" ? "Nouveau mot de passe" : "Mot de passe du compte")} type="password" required minLength={8} placeholder={translate(mode === "reset" ? "Nouveau mot de passe" : "Mot de passe (8 caractères minimum)")} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {info && <p role="status" className="text-xs text-fg-2">{info}</p>}
      <Button type="submit" variant="brand" disabled={busy}>{busy ? translate("Connexion…") : translate(submitLabel)}</Button>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-fg-2">
        <button type="button" className="underline" onClick={() => go(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin")}>
          {translate(mode === "signup" ? "J’ai déjà un compte" : mode === "signin" ? "Créer un nouveau compte" : "Retour à la connexion")}
        </button>
        {mode === "signin" && <button type="button" className="underline" onClick={() => go("forgot")}>{translate("Mot de passe oublié ?")}</button>}
      </div>
    </form>
  );
}

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return <button type="button" className="w-fit text-xs text-danger underline" onClick={() => setOpen(true)}>{translate("Supprimer mon compte")}</button>;
  return (
    <form className="flex flex-col gap-2 rounded-lg border border-hairline p-3" onSubmit={(e) => {
      e.preventDefault();
      setBusy(true); setError("");
      deleteAccount(password).then(() => toast.success(translate("Compte supprimé. Vos données restent sur cet ordinateur."))).catch((err: unknown) => setError(message(err))).finally(() => setBusy(false));
    }}>
      <p className="text-xs text-fg-2">{translate("Vos données cloud sont effacées. Celles de cet ordinateur sont conservées.")}</p>
      <Input aria-label={translate("Mot de passe actuel")} type="password" required autoComplete="current-password" placeholder={translate("Mot de passe actuel")} value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <Button type="submit" variant="destructive" disabled={busy}>{translate("Supprimer définitivement mon compte")}</Button>
    </form>
  );
}

export function AccountPanel() {
  const { user, syncing, lastSync, error, tooLarge, needsMergeConfirm } = useCloud();
  if (!user) {
    return (
      <div className="flex max-w-md flex-col gap-3 p-4">
        <p className="text-sm text-fg-2">{translate("Retrouvez vos notes, tâches, finances, factures, agenda et préférences sur tous vos ordinateurs. Gather reste utilisable sans compte et hors ligne.")}</p>
        <AccountForm onDone={() => toast.success(translate("Compte connecté : synchronisation en cours"))} />
      </div>
    );
  }
  return (
    <div className="flex max-w-md flex-col gap-3 p-4 text-sm">
      <p><strong>{user.email}</strong></p>
      {needsMergeConfirm ? (
        <div role="alert" className="flex flex-col gap-2 rounded-lg border border-hairline p-3">
          <p>{translate("Cet ordinateur contient les données d’un autre compte. La synchronisation est en pause.")}</p>
          <Button onClick={confirmMerge}>{translate("Ajouter ces données à ce compte")}</Button>
        </div>
      ) : (
        <p className="text-fg-2" role="status">{syncing ? translate("Synchronisation…") : lastSync ? `${translate("Synchronisé le")} ${new Date(lastSync).toLocaleString()}` : translate("En attente de connexion.")}</p>
      )}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {tooLarge > 0 && <p className="text-fg-2">{tooLarge} {translate("élément(s) trop volumineux restent sur cet ordinateur.")}</p>}
      <p className="text-xs text-fg-2">{translate("Les fichiers importés et pièces jointes restent sur l’ordinateur où ils ont été ajoutés : seules leurs fiches se synchronisent.")}</p>
      <div className="flex gap-2">
        <Button disabled={syncing} onClick={() => void syncNow()}>{translate("Synchroniser")}</Button>
        <Button variant="secondary" onClick={() => void logOut()}>{translate("Se déconnecter")}</Button>
      </div>
      <DeleteAccount />
    </div>
  );
}
