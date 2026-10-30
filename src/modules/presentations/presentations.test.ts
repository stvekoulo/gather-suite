import { describe, expect, it } from "vitest";
import { createPptx } from "./export-pptx";
import type { PresentationDeck } from "@/stores/workspace-types";

describe("Gather Presentations (Deckcraft) features", () => {
  it("exports a valid PPTX presentation in 16:9 ratio with diverse slide layouts", async () => {
    const deck: PresentationDeck = {
      id: "deck-16-9",
      title: "Test Deck 16:9",
      description: "Deck de test 16:9 avec dispositions variées",
      theme: "ocean",
      ratio: "16:9",
      transition: "fade",
      updatedAt: new Date().toISOString(),
      slides: [
        {
          id: "slide-1",
          layout: "title",
          title: "Titre principal",
          subtitle: "Sous-titre explicatif",
          notes: "Notes pour la diapositive 1",
        },
        {
          id: "slide-2",
          layout: "metrics",
          title: "Performance Q3",
          metricNumber: "+340%",
          metricLabel: "Croissance annuelle",
          bullets: ["Conversion en hausse", "Rétention améliorée"],
        },
        {
          id: "slide-3",
          layout: "blank",
          title: "Diapositive vierge",
          elements: [
            {
              id: "el-rect",
              type: "rectangle",
              x: 100,
              y: 100,
              width: 300,
              height: 200,
              fill: "#f97316",
              color: "#ffffff",
              fontSize: 18,
            },
            {
              id: "el-arrow",
              type: "arrow",
              x: 450,
              y: 150,
              width: 150,
              height: 80,
              fill: "#0ea5e9",
              color: "#0369a1",
              fontSize: 18,
            },
          ],
        },
      ],
    };

    const bytes = await createPptx(deck);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(1000);
    // Vérifie la signature ZIP OOXML PK (0x50, 0x4B, 0x03, 0x04)
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it("exports a valid PPTX presentation in 4:3 legacy ratio", async () => {
    const deck: PresentationDeck = {
      id: "deck-4-3",
      title: "Test Deck 4:3",
      description: "Deck au format traditionnel 4:3",
      theme: "emerald",
      ratio: "4:3",
      transition: "slide",
      updatedAt: new Date().toISOString(),
      slides: [
        {
          id: "s1",
          layout: "split",
          title: "Comparatif",
          body: "Texte explicatif à gauche",
          bullets: ["Point A", "Point B"],
        },
        {
          id: "s2",
          layout: "quote",
          title: "Citation clé",
          subtitle: "La simplicité est la sophistication suprême",
          body: "Léonard de Vinci",
        },
      ],
    };

    const bytes = await createPptx(deck);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("throws an error when attempting to export a presentation without slides", async () => {
    const emptyDeck: PresentationDeck = {
      id: "deck-empty",
      title: "Vide",
      description: "Sans diapo",
      theme: "light",
      updatedAt: new Date().toISOString(),
      slides: [],
    };

    await expect(createPptx(emptyDeck)).rejects.toThrow("La présentation ne contient aucune diapositive.");
  });
});
