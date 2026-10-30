"use client";

import { useState } from "react";
import { DownloadIcon, FileIcon, ImageIcon, MusicIcon, PaperclipIcon, Trash2Icon, VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/beui/file-upload";
import { saveFile } from "@/lib/files";
import { readAsDataUrl } from "@/components/pages/documents/doc-utils";
import type { NoteAttachment } from "@/stores/blinko-types";

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="size-3.5 text-blue-500" />;
  if (type.startsWith("video/")) return <VideoIcon className="size-3.5 text-purple-500" />;
  if (type.startsWith("audio/")) return <MusicIcon className="size-3.5 text-amber-500" />;
  return <FileIcon className="size-3.5 text-emerald-500" />;
}

// Composant de gestion des pièces jointes des notes avec affichage beUI à la demande
export function NoteAttachments({
  attachments,
  onChange,
}: {
  attachments: NoteAttachment[];
  onChange?: (attachments: NoteAttachment[]) => void;
}) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleDownload = async (file: NoteAttachment) => {
    try {
      if (!file.url) throw new Error("Pièce jointe indisponible");
      const blob = await (await fetch(file.url)).blob();
      await saveFile(file.name, blob);
    } catch (error) {
      toast.error(String(error));
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-1">
      {/* Bouton d'ouverture du composant beUI à la demande */}
      {onChange && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="gap-1.5 text-xs font-medium h-8"
          >
            <PaperclipIcon className="size-3.5 text-brand" />
            Joindre des fichiers
          </Button>

          {/* Modal affichant le composant beUI FileUpload animé à la demande */}
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogContent className="sm:max-w-md gap-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <PaperclipIcon className="size-4 text-brand" />
                  Joindre des fichiers à la note
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Glissez-déposez vos fichiers ou parcourez votre ordinateur.
                </DialogDescription>
              </DialogHeader>

              <div className="pt-2">
                <FileUpload
                  inputLabel="Fichiers à joindre"
                  title="Glissez vos fichiers ici"
                  description="Images, PDF, documents, audios ou vidéos"
                  browseLabel="Parcourir"
                  multiple
                  onFilesAdded={async (_items, files) => {
                    try {
                      const added = await Promise.all(
                        files.map(async (file) => ({
                          id: crypto.randomUUID(),
                          name: file.name,
                          type: file.type || "application/octet-stream",
                          size: file.size,
                          url: await readAsDataUrl(file),
                        }))
                      );
                      onChange([...attachments, ...added]);
                      toast.success(
                        added.length === 1
                          ? `« ${added[0].name} » joint à la note`
                          : `${added.length} fichiers joints à la note`
                      );
                      setUploadModalOpen(false);
                    } catch (err) {
                      toast.error(String(err));
                    }
                  }}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                  className="text-xs"
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Liste des pièces jointes actuelles */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-2/30 px-3 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file.type)}
                <span className="truncate font-medium text-fg">{file.name}</span>
                <span className="text-[11px] text-fg-2 font-mono">
                  ({Math.max(1, Math.round(file.size / 1024))} Ko)
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDownload(file)}
                  className="size-7 p-0 text-fg-2 hover:text-fg"
                  title="Télécharger"
                >
                  <DownloadIcon className="size-3.5" />
                </Button>
                {onChange && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(attachments.filter((a) => a.id !== file.id))}
                    className="size-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                    title="Supprimer"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
