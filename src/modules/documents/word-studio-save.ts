import type { JSONContent } from "@tiptap/react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import type { DocumentFile } from "@/lib/types";
import { safeFilename } from "@/lib/files";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { createDocx } from "./document-format";
import type { DocumentLayout } from "./document-layout";

interface SaveParams {
  title: string;
  content: JSONContent;
  layout: DocumentLayout;
  currentDoc?: DocumentFile;
}

// Enregistre le document dans le store Gather et génère le fichier DOCX
export async function saveWordStudioDoc({
  title,
  content,
  layout,
  currentDoc,
}: SaveParams): Promise<DocumentFile | undefined> {
  const finishOperation = beginSpaceOperation();
  try {
    const blob = new Blob([new Uint8Array(await createDocx(title, content, layout))], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const docName = `${safeFilename(title)}.docx`;
    const docId = currentDoc?.id;
    if (docId) {
      useAppStore.getState().updateDocument(docId, {
        name: docName,
        size: blob.size,
        dataUrl,
        editorContent: content,
        pageSetup: layout,
      });
      toast.success("Document enregistré avec succès");
      return { ...currentDoc, name: docName, size: blob.size, dataUrl, editorContent: content, pageSetup: layout };
    }
    useAppStore.getState().addDocument({
      name: docName,
      category: "Contrat",
      size: blob.size,
      dataUrl,
      starred: false,
      editorContent: content,
      pageSetup: layout,
    });
    toast.success("Document créé et enregistré avec succès");
    return useAppStore.getState().documents[0];
  } catch (error) {
    toast.error(String(error));
    return undefined;
  } finally {
    finishOperation();
  }
}
