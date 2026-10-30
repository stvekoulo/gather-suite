"use client";

import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CompassIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SPRING_SWAP } from "@/lib/ease";
import { useI18n } from "@/lib/i18n";
import { sendDesktopNotification } from "@/lib/notifications";
import type { PaletteId } from "@/lib/theme-palettes";
import { useAppStore } from "@/stores/app-store";
import { StepLanguage, StepNotifications, StepPalette, StepProfile } from "./onboarding-steps";

export function OnboardingWizard() {
  const { t, language, setLanguage } = useI18n();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const hasCompleted = settings.hasCompletedOnboarding ?? false;
  const [step, setStep] = useState(0);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [palette, setPalette] = useState<PaletteId>("monochrome");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (hasCompleted) return null;

  const handleFinish = async () => {
    // 1. Update Profile
    updateProfile({
      name: name.trim() || "Steve",
      email: email.trim() || "user@example.com",
      jobTitle: jobTitle.trim() || "Creator",
      initials: (name.trim() || "AU").slice(0, 2).toUpperCase(),
    });

    // 2. Update Settings
    updateSettings({
      hasCompletedOnboarding: true,
      accentColor: palette,
      language,
      pushNotifications: notificationsEnabled,
    });

    toast.success("Bienvenue dans votre nouvel espace Gather !");

    // 3. Send welcome native desktop notification if enabled
    if (notificationsEnabled) {
      await sendDesktopNotification({
        title: "Gather Prêt !",
        body: `Bienvenue ${name.trim() || "dans votre espace"}. Votre suite bureautique personnelle est prête.`,
      });
    }
  };

  const stepsCount = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING_SWAP}
        className="flex h-[560px] w-full max-w-lg flex-col justify-between rounded-3xl border border-hairline bg-surface p-8 shadow-2xl overflow-hidden"
      >
        {/* Header Branding */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Gather Logo"
                className="size-8 rounded-lg object-contain select-none"
              />
              <span className="text-sm font-semibold tracking-tight text-fg">Gather Suite</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: stepsCount }).map((_, i) => (
                <span
                  key={i}
                  className={`size-2 rounded-full transition-all ${
                    step === i ? "bg-brand w-5" : "bg-hairline"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="Gather Logo"
              className="size-12 rounded-xl object-contain drop-shadow-xs select-none shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-fg">{t.onboarding.welcomeTitle}</h2>
              <p className="mt-0.5 text-xs text-fg-2">{t.onboarding.welcomeSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="my-auto py-2">
          {step === 0 && <StepLanguage selected={language} onSelect={setLanguage} />}
          {step === 1 && (
            <StepProfile
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              jobTitle={jobTitle}
              setJobTitle={setJobTitle}
            />
          )}
          {step === 2 && <StepPalette selected={palette} onSelect={setPalette} />}
          {step === 3 && (
            <StepNotifications
              notificationsEnabled={notificationsEnabled}
              onToggle={setNotificationsEnabled}
            />
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeftIcon className="size-3.5 mr-1" />
              <span>{t.onboarding.back}</span>
            </Button>
          ) : (
            <div />
          )}

          {step < stepsCount - 1 ? (
            <Button variant="brand" size="sm" onClick={() => setStep((s) => s + 1)}>
              <span>{t.onboarding.next}</span>
              <ArrowRightIcon className="size-3.5 ml-1" />
            </Button>
          ) : (
            <Button variant="brand" size="sm" onClick={handleFinish}>
              <span>{t.onboarding.finish}</span>
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
