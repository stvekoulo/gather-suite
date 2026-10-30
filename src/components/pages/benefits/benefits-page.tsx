"use client";

import { translate } from "@/lib/i18n/ui-text";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { formatLong } from "@/lib/dates";
import type { Benefit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { BenefitCard, SummaryStat } from "./benefit-card";
import { ClaimDialog } from "./claim-dialog";
import { CATEGORIES, formatMoney, type BenefitCategory } from "./shared";

type Filter = "All" | BenefitCategory;

export function BenefitsPage() {
  const benefits = useAppStore((s) => s.benefits);
  const toggleBenefit = useAppStore((s) => s.toggleBenefit);
  const [filter, setFilter] = useState<Filter>("All");
  const [claim, setClaim] = useState<{ open: boolean; session: number; id?: string }>({ open: false, session: 0 });
  const [unenrollId, setUnenrollId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const enrolled = benefits.filter((b) => b.enrolled);
    const budget = enrolled.reduce((n, b) => n + b.budget, 0);
    const used = enrolled.reduce((n, b) => n + b.used, 0);
    return { budget, used, remaining: budget - used, enrolled: enrolled.length };
  }, [benefits]);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["All", benefits.length]]);
    for (const b of benefits) map.set(b.category, (map.get(b.category) ?? 0) + 1);
    return map;
  }, [benefits]);

  const visible = useMemo(
    () => (filter === "All" ? benefits : benefits.filter((b) => b.category === filter)),
    [benefits, filter],
  );

  const claimBenefit = benefits.find((b) => b.id === claim.id);
  const unenrollBenefit = benefits.find((b) => b.id === unenrollId);

  const enroll = (b: Benefit) => {
    toggleBenefit(b.id);
    toast.success(`Enrolled in ${b.name}`, { description: `Active until ${formatLong(b.renewsOn)}` });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin bg-app">
      <header className="sticky top-0 z-10 flex min-h-[68px] shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4 py-3 md:h-[68px] md:py-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="t-16 text-fg">{translate("Your benefits")}</h2>
          <p className="t-14 leading-[1.3] text-fg-2 md:truncate md:leading-none">
            {summary.enrolled} sur {benefits.length} inscrits · réinitialisation annuelle
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-hairline bg-surface md:grid-cols-4">
          <SummaryStat label={translate("Total budget")} value={formatMoney(summary.budget)} />
          <SummaryStat label={translate("Used")} value={formatMoney(summary.used)} />
          <SummaryStat
            label={translate("Remaining")}
            value={formatMoney(summary.remaining)}
            extra={
              summary.budget > 0 ? (
                <Progress
                  value={(summary.used / summary.budget) * 100}
                  className="mt-1 h-1 bg-app"
                  aria-label="Budget utilisé"
                />
              ) : null
            }
          />
          <SummaryStat label={translate("Enrolled")} value={`${summary.enrolled}`} suffix={`sur ${benefits.length}`} />
        </dl>

        <div
          role="toolbar"
          aria-label="Filter by category"
          className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden"
        >
          {(["All", ...CATEGORIES] as Filter[]).map((c) => {
            const active = filter === c;
            const n = counts.get(c) ?? 0;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(c)}
                className={cn(
                  "press t-14 salt inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40 max-md:h-10 max-md:px-3",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-control bg-surface text-fg-2 hover-fine:bg-hover hover-fine:text-fg",
                )}
              >
                <span>{c}</span>
                <span className={cn("t-12 tabular-nums", active ? "text-white/80" : "text-placeholder")}>{n}</span>
              </button>
            );
          })}
        </div>

        <section aria-label="Available benefits" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((b) => (
            <BenefitCard
              key={b.id}
              benefit={b}
              onEnroll={() => enroll(b)}
              onUnenroll={() => setUnenrollId(b.id)}
              onClaim={() => setClaim({ open: true, session: claim.session + 1, id: b.id })}
            />
          ))}
        </section>
      </div>

      <ClaimDialog
        open={claim.open}
        session={claim.session}
        benefit={claimBenefit}
        onClose={() => setClaim((c) => ({ ...c, open: false }))}
      />

      <AlertDialog open={!!unenrollId} onOpenChange={(v) => !v && setUnenrollId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="t-16">Se désinscrire de {unenrollBenefit?.name} ?</AlertDialogTitle>
            <AlertDialogDescription className="t-14 leading-[1.4]">
              Vous perdrez l’accès à cet avantage et votre budget restant ne sera pas reporté. Vous pourrez vous réinscrire à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conserver</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!unenrollBenefit) return;
                toggleBenefit(unenrollBenefit.id);
                toast(`Désinscrit de ${unenrollBenefit.name}`);
              }}
            >
              Se désinscrire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
