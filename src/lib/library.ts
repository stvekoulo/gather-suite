import { useAppStore } from "@/stores/app-store";

function toDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Files any generated output in the Documents library of the active space. */
export async function addToLibrary(name: string, bytes: Uint8Array, mime: string, category = "Autre") {
  const dataUrl = await toDataUrl(new Blob([bytes as BlobPart], { type: mime }));
  useAppStore.getState().addDocument({ name, category, size: bytes.length, dataUrl, starred: false });
}
