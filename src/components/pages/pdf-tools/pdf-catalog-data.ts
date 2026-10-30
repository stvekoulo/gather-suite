import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  ArrowDownUpIcon,
  BookOpenIcon,
  CropIcon,
  FileCheckIcon,
  FileCodeIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FilesIcon,
  FlipHorizontalIcon,
  HighlighterIcon,
  ImageIcon,
  LayersIcon,
  Minimize2Icon,
  MoveIcon,
  RotateCwIcon,
  ScanTextIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";

export type PdfCategory = "all" | "organize" | "security" | "optimize" | "convert" | "layout";

export interface PdfToolItem {
  id: string;
  title: string;
  category: "organize" | "security" | "optimize" | "convert" | "layout";
  hint: string;
  icon: LucideIcon;
  badge?: string;
  multipleFiles?: boolean;
  acceptTypes?: string;
}

export const PDF_CATEGORIES: { id: PdfCategory; label: string }[] = [
  { id: "all", label: "Tous les outils" },
  { id: "organize", label: "Organiser" },
  { id: "security", label: "Sécurité & Signature" },
  { id: "optimize", label: "Optimisation & OCR" },
  { id: "convert", label: "Conversion & Export" },
  { id: "layout", label: "Mise en page" },
];

export const PDF_TOOLS: PdfToolItem[] = [
  // Organiser
  { id: "merge", category: "organize", title: "Fusionner", hint: "Assembler plusieurs PDF dans l'ordre de votre choix", icon: FilesIcon, multipleFiles: true },
  { id: "split", category: "organize", title: "Extraire / Réorganiser", hint: "Extraire ou réordonner des pages spécifiques", icon: LayersIcon },
  { id: "remove", category: "organize", title: "Supprimer des pages", hint: "Retirer des pages précises du document", icon: ArchiveIcon },
  { id: "reverse", category: "organize", title: "Inverser les pages", hint: "Placer la dernière page en premier", icon: ArrowDownUpIcon },
  { id: "rotate", category: "organize", title: "Rotation", hint: "Pivoter toutes les pages de 90° vers la droite", icon: RotateCwIcon },
  { id: "splitzip", category: "organize", title: "Séparer en fichiers", hint: "Découper en un PDF par page dans une archive ZIP", icon: ArchiveIcon },

  // Sécurité & Signature
  { id: "signature", category: "security", title: "Signature numérique", hint: "Signer ou vérifier un PDF avec certificat PKCS#12 (.p12/.pfx)", icon: ShieldCheckIcon, badge: "Certificat" },
  { id: "redact", category: "security", title: "Caviardage sécurisé", hint: "Masquer irréversiblement une zone et figer en images", icon: ShieldAlertIcon, badge: "Rasterisé" },
  { id: "watermark", category: "security", title: "Filigrane", hint: "Superposer un texte personnalisé sur chaque page", icon: HighlighterIcon },
  { id: "flatten", category: "security", title: "Aplatir les formulaires", hint: "Figer définitivement les champs remplis dans le PDF", icon: FileCheckIcon },

  // Optimisation & OCR
  { id: "compress", category: "optimize", title: "Optimiser le PDF", hint: "Réécriture compacte locale préservant la qualité", icon: Minimize2Icon },
  { id: "compressimages", category: "optimize", title: "Compresser les images", hint: "Réduction JPEG configurable du document rasterisé", icon: ImageIcon },
  { id: "ocr", category: "optimize", title: "Reconnaissance OCR", hint: "Transformer un scan en PDF interrogeable (FR/EN hors ligne)", icon: ScanTextIcon, badge: "Hors ligne" },

  // Conversion & Export
  { id: "images", category: "convert", title: "Images vers PDF", hint: "Convertir et assembler des images PNG/JPEG en PDF", icon: FileImageIcon, multipleFiles: true, acceptTypes: "image/png,image/jpeg" },
  { id: "render", category: "convert", title: "PDF vers images", hint: "Exporter chaque page du PDF en image PNG haute fidélité", icon: ImageIcon },
  { id: "extract", category: "convert", title: "Extraire le texte", hint: "Récupérer tout le texte brut sans couche OCR", icon: FileTextIcon },

  // Mise en page & Métadonnées
  { id: "number", category: "layout", title: "Numéroter les pages", hint: "Ajouter automatiquement les numéros en pied de page", icon: BookOpenIcon },
  { id: "resize", category: "layout", title: "Format & Dimensions", hint: "Ajuster le format de page (A4, Lettre ou dimensions custom)", icon: MoveIcon },
  { id: "crop", category: "layout", title: "Recadrer les marges", hint: "Masquer les bordures extérieures des pages", icon: CropIcon },
  { id: "metadata", category: "layout", title: "Modifier les métadonnées", hint: "Changer le titre et l'auteur du document", icon: FileCodeIcon },
  { id: "annotate", category: "layout", title: "Annoter & Surligner", hint: "Apposer du texte ou un surlignage à un emplacement précis", icon: HighlighterIcon },
];
