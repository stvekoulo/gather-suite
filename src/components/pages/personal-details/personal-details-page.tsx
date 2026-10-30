"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseIcon, CakeIcon, MailIcon, MapPinIcon, PhoneIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/dialogs/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fromKey, MONTHS } from "@/lib/dates";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { Card, PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { BIO_MAX, initialsFrom, Section, SummaryRow, tenure, TOUCH_FIELD, validate } from "./profile-utils";

export function PersonalDetailsPage() {
  const today = useToday();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [edits, setEdits] = useState<Partial<Profile>>({});
  const [showErrors, setShowErrors] = useState(false);

  const draft = useMemo(() => ({ ...profile, ...edits }), [profile, edits]);
  const changed = useMemo(
    () => (Object.keys(edits) as (keyof Profile)[]).filter((k) => edits[k] !== profile[k]),
    [edits, profile],
  );
  const dirty = changed.length > 0;
  const errors = useMemo(() => validate(draft), [draft]);
  const hasErrors = Object.keys(errors).length > 0;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setEdits((e) => {
      const next = { ...e, [key]: value };
      if (value === profile[key]) delete next[key];
      return next;
    });

  const reset = () => {
    setEdits({});
    setShowErrors(false);
  };

  const save = () => {
    if (!dirty) return;
    if (hasErrors) {
      setShowErrors(true);
      toast.error(translate("Check the highlighted fields"), { description: "Certaines informations doivent être corrigées." });
      return;
    }
    const patch: Partial<Profile> = {};
    for (const k of changed) (patch as Record<string, string>)[k] = (draft[k] as string).trim();
    if (patch.initials) patch.initials = patch.initials.toUpperCase();
    updateProfile(patch);
    setEdits({});
    setShowErrors(false);
    toast.success(translate("Profile saved"), {
      description: `${changed.length} ${changed.length === 1 ? "champ mis à jour" : "champs mis à jour"}`,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        document.getElementById("profile-save")?.click();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty]);

  const err = (k: keyof Profile) => ((showErrors || k in edits) && errors[k]) || null;
  const input = (k: keyof Profile, { className, ...props }: React.ComponentProps<typeof Input> = {}) => (
    <Input
      id={`pd-${k}`}
      value={draft[k]}
      onChange={(e) => set(k, e.target.value)}
      aria-invalid={err(k) ? true : undefined}
      className={cn(TOUCH_FIELD, className)}
      {...props}
    />
  );

  const t = tenure(draft.startDate, today);
  const birthday = draft.birthday ? fromKey(draft.birthday) : null;

  return (
    <PageRoot>
      <PageHeader
        title={translate("Your profile")}
        description={
          dirty ? (
            <>
              {changed.length} modification{changed.length > 1 ? "s" : ""} non enregistrée{changed.length > 1 ? "s" : ""}
              <span className="max-md:hidden"> · ⌘S pour enregistrer</span>
            </>
          ) : (
            "Accessible uniquement par vous et l'administration"
          )
        }
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <Button onClick={reset} disabled={!dirty}>
              <RotateCcwIcon className="text-icon" /> {translate("Reset")}
            </Button>
            <Button id="profile-save" type="submit" form="profile-form" variant="brand" disabled={!dirty}>
              {translate("Save changes")}
            </Button>
          </div>
        }
      />
      <form
        id="profile-form"
        className="mx-auto grid w-full max-w-[1040px] grid-cols-1 items-start gap-3 p-4 md:gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        <Card className="lg:sticky lg:top-[84px]">
          <div className="flex items-center gap-3.5 p-4 lg:flex-col lg:gap-3 lg:px-4 lg:pt-6 lg:pb-5 lg:text-center">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[16px] bg-brand-tint lg:size-16 lg:rounded-[18px]">
              <span className="font-inter text-[20px] leading-none font-semibold tracking-[-0.3px] text-brand lg:text-[22px] lg:tracking-[-0.33px]">
                {draft.initials.toUpperCase() || "?"}
              </span>
            </span>
            <div className="grid min-w-0 gap-2">
              <p className="t-16 text-fg">{draft.name || "Votre nom"}</p>
              <p className="t-14 text-fg-2">
                {[draft.jobTitle, draft.department].filter(Boolean).join(" · ") || "Ajoutez un poste"}
              </p>
            </div>
          </div>
          <ul className="grid gap-x-4 gap-y-3 border-t border-subtle px-4 py-4 sm:grid-cols-2 lg:grid-cols-1">
            <SummaryRow icon={<MailIcon />}>{draft.email || "—"}</SummaryRow>
            <SummaryRow icon={<PhoneIcon />}>{draft.phone || "—"}</SummaryRow>
            <SummaryRow icon={<MapPinIcon />}>{draft.location || "—"}</SummaryRow>
            <SummaryRow icon={<BriefcaseIcon />}>
              {draft.startDate ? `Arrivé(e) en ${MONTHS[fromKey(draft.startDate).getMonth()]} ${draft.startDate.slice(0, 4)}` : "—"}
              {t ? <span className="text-placeholder"> · {t}</span> : null}
            </SummaryRow>
            <SummaryRow icon={<CakeIcon />}>
              {birthday ? `${MONTHS[birthday.getMonth()]} ${birthday.getDate()}` : "—"}
            </SummaryRow>
          </ul>
        </Card>

        <div className="grid min-w-0 gap-4">
          <Section title={translate("Basic information")} description={translate("How you appear across the workspace")}>
            <div className="grid grid-cols-[minmax(0,1fr)_88px] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_120px] sm:gap-4">
              <Field label={translate("Full name")} htmlFor="pd-name" error={err("name")}>
                {input("name", { autoComplete: "name", required: true })}
              </Field>
              <Field label={translate("Initials")} htmlFor="pd-initials" error={err("initials")}>
                {input("initials", {
                  maxLength: 3,
                  className: "uppercase",
                  onChange: (e) => set("initials", e.target.value.toUpperCase().replace(/[^A-Z]/g, "")),
                })}
              </Field>
            </div>
            {initialsFrom(draft.name) && initialsFrom(draft.name) !== draft.initials ? (
              <button
                type="button"
                onClick={() => set("initials", initialsFrom(draft.name))}
                className="t-12 -mt-2 w-fit text-brand outline-none hover-fine:text-brand-strong focus-visible:underline max-md:-my-1 max-md:py-1.5"
              >
                Utiliser « {initialsFrom(draft.name)} » selon votre nom
              </button>
            ) : null}
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <Field label={translate("Email")} htmlFor="pd-email" error={err("email")}>
                {input("email", { type: "email", autoComplete: "email", required: true })}
              </Field>
              <Field label={translate("Phone")} htmlFor="pd-phone">
                {input("phone", { type: "tel", autoComplete: "tel", placeholder: "+33 6 00 00 00 00" })}
              </Field>
            </div>
          </Section>

          <Section title={translate("Work")} description={translate("Your role and reporting line")}>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <Field label={translate("Job title")} htmlFor="pd-jobTitle">
                {input("jobTitle", { autoComplete: "organization-title" })}
              </Field>
              <Field label={translate("Department")} htmlFor="pd-department">
                {input("department")}
              </Field>
              <Field label={translate("Manager")} htmlFor="pd-manager">
                {input("manager")}
              </Field>
              <Field label={translate("Location")} htmlFor="pd-location">
                {input("location", { placeholder: "Ville, Pays" })}
              </Field>
              <Field label={translate("Start date")} htmlFor="pd-startDate" hint={t ? `${t} dans l'entreprise` : undefined}>
                {input("startDate", { type: "date", max: today })}
              </Field>
            </div>
          </Section>

          <Section title={translate("Personal")} description={translate("Only visible to People Ops")}>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <Field label={translate("Birthday")} htmlFor="pd-birthday" error={err("birthday")}>
                {input("birthday", { type: "date", max: today })}
              </Field>
              <Field label={translate("Emergency contact")} htmlFor="pd-emergencyContact" hint="Nom et numéro de téléphone">
                {input("emergencyContact", { placeholder: "Nom · téléphone" })}
              </Field>
              <Field label={translate("Home address")} htmlFor="pd-address" className="sm:col-span-2">
                {input("address", { autoComplete: "street-address" })}
              </Field>
            </div>
          </Section>

          <Section title={translate("About")} description={translate("A short intro for your teammates")}>
            <Field
              label={translate("Bio")}
              htmlFor="pd-bio"
              error={err("bio")}
              hint={
                <span className={cn("tabular-nums", draft.bio.length > BIO_MAX * 0.9 && "text-warning")}>
                  {draft.bio.length}/{BIO_MAX}
                </span>
              }
            >
              <Textarea
                id="pd-bio"
                className="max-md:text-[16px]"
                rows={3}
                value={draft.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Vos projets, vos compétences, vos centres d'intérêt…"
                aria-invalid={err("bio") ? true : undefined}
              />
            </Field>
          </Section>
        </div>
      </form>

      {dirty ? (
        <div className="sticky bottom-0 z-10 mt-auto flex gap-2 border-t border-hairline bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] duration-200 ease-(--ease-out) animate-in fade-in-0 slide-in-from-bottom-4 md:hidden">
          <Button className="h-10 px-3.5" onClick={reset}>
            <RotateCcwIcon className="text-icon" /> {translate("Reset")}
          </Button>
          <Button type="submit" form="profile-form" variant="brand" className="h-10 flex-1">
            {translate("Save")} ({changed.length})
          </Button>
        </div>
      ) : null}
    </PageRoot>
  );
}
