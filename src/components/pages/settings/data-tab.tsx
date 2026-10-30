"use client";
import { FilePicker } from "@/components/file-picker";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { createBackup, restoreBackup, validateBackup } from "@/modules/backup/backup";
import { saveFile } from "@/lib/files";
import { isDesktop } from "@/lib/storage/database";
import { useTranslate } from "@/lib/i18n/ui-text";
import { Panel, Row } from "./settings-shared";

export function DataTab() {
  const tr = useTranslate();
  const [busy, setBusy] = useState(false);
  return (
    <Panel
      title={tr("Données locales")}
      description={isDesktop() ? tr("Stockage SQLite sur cet ordinateur.") : tr("Stockage IndexedDB dans ce navigateur.")}
    >
      <Row
        title={tr("Sauvegarde complète")}
        description={tr("Calendrier, documents, pièces jointes, notes et leur historique, présentations et tableau blanc.")}
        stack
      >
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await saveFile("gather-backup.json", new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" }));
            } catch (error) {
              toast.error(String(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          {tr("Exporter la sauvegarde")}
        </Button>
      </Row>
      <Row
        title={tr("Restaurer une sauvegarde")}
        description={tr("Vérification du fichier avant remplacement des données. Conservez une sauvegarde actuelle avant de restaurer.")}
        stack
      >
        <FilePicker
          type="file"
          accept=".json,application/json"
          aria-label={tr("Restaurer une sauvegarde")}
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              const data: unknown = JSON.parse(await file.text());
              validateBackup(data);
              if (!window.confirm(tr("Remplacer les données locales par cette sauvegarde complète ?"))) return;
              await restoreBackup(data);
              toast.success(tr("Sauvegarde restaurée"));
            } catch (error) {
              toast.error(tr("Restauration impossible"), { description: String(error) });
            } finally {
              setBusy(false);
            }
          }}
        />
      </Row>
      <Row
        title={tr("Réinitialiser le calendrier et le profil")}
        description={tr("Remplace uniquement les données du module historique. Les notes, présentations et dessins sont conservés.")}
        stack
      >
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() => {
            if (window.confirm(tr("Réinitialiser le calendrier, les documents, les factures et le profil ?"))) {
              useAppStore.getState().resetDemoData();
            }
          }}
        >
          {tr("Réinitialiser")}
        </Button>
      </Row>
    </Panel>
  );
}
