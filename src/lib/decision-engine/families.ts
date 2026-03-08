// src/lib/decision-engine/families.ts

import type { DecisionQuestion } from "@/types/decision";

export type IntentFamily =
  | "power_drill"
  | "power_cut"
  | "manual_cut_grip"
  | "manual_drive"
  | "measuring"
  | "fastening"
  | "paint_coating"
  | "paint_application"
  | "adhesive_sealant"
  | "cement_mortar"
  | "plumbing"
  | "electrical"
  | "unknown";

export function getFamilyQuestions(
  family: IntentFamily,
  answers: Record<string, any>
): DecisionQuestion[] {
  const take = (arr: DecisionQuestion[], n = 4) => arr.slice(0, n);

  // power_drill
  if (family === "power_drill") {
    const qs: DecisionQuestion[] = [];

    if (!answers.base_material) {
      qs.push({
        id: "base_material",
        title: "¿Qué material vas a perforar o trabajar?",
        description: "Define si necesitas rotación simple o percusión/impacto.",
        type: "single",
        required: true,
        options: [
          { label: "Concreto / Hormigón", value: "concrete" },
          { label: "Ladrillo / Block", value: "masonry" },
          { label: "Madera", value: "wood" },
          { label: "Metal", value: "metal" },
          { label: "Tablaroca", value: "drywall" },
        ],
      });
    }

    if (answers.hole_diameter_mm == null) {
      qs.push({
        id: "hole_diameter_mm",
        title: "¿Qué diámetro aproximado necesitas?",
        type: "single",
        required: true,
        options: [
          { label: "Hasta 6 mm", value: 6 },
          { label: "Hasta 8 mm", value: 8 },
          { label: "Hasta 10 mm", value: 10 },
          { label: 'Hasta 13 mm (1/2")', value: 13 },
          { label: "Más de 13 mm", value: 16 },
        ],
      });
    }

    if (!answers.power_source) {
      qs.push({
        id: "power_source",
        title: "¿Prefieres cable o batería?",
        type: "single",
        required: true,
        options: [
          { label: "Batería (portabilidad)", value: "cordless" },
          { label: "Cable (potencia constante)", value: "corded" },
          { label: "Me da igual", value: "either" },
        ],
      });
    }

    if (!answers.frequency) {
      qs.push({
        id: "frequency",
        title: "¿Con qué frecuencia lo usarás?",
        type: "single",
        required: true,
        options: [
          { label: "Ocasional (hogar)", value: "occasional" },
          { label: "Frecuente", value: "frequent" },
          { label: "Uso rudo / diario", value: "heavy" },
        ],
      });
    }

    return take(qs, 4);
  }

  // manual_cut_grip (pinzas/alicates/corte manual)
  if (family === "manual_cut_grip") {
    const qs: DecisionQuestion[] = [];

    if (!answers.tool_subtype) {
      qs.push({
        id: "tool_subtype",
        title: "¿Qué tipo de pinzas/herramienta necesitas?",
        type: "single",
        required: true,
        options: [
          { label: "Punta larga (precisión)", value: "needle_nose" },
          { label: "Universales", value: "linesman" },
          { label: "Corte diagonal", value: "diagonal" },
          { label: "Ajustables (perico)", value: "adjustable" },
          { label: "De presión (grip)", value: "locking" },
        ],
      });
    }

    if (!answers.use_case) {
      qs.push({
        id: "use_case",
        title: "¿Para qué las usarás principalmente?",
        type: "single",
        required: true,
        options: [
          { label: "Electricidad / cableado", value: "electrical" },
          { label: "Plomería / tuercas", value: "plumbing" },
          { label: "Mecánica general", value: "mechanic" },
          { label: "Precisión / manualidades", value: "precision" },
        ],
      });
    }

    if (!answers.size_pref) {
      qs.push({
        id: "size_pref",
        title: "¿Qué tamaño prefieres?",
        type: "single",
        required: true,
        options: [
          { label: 'Compactas (6")', value: "6in" },
          { label: 'Medianas (8")', value: "8in" },
          { label: 'Grandes (10"+)', value: "10in" },
        ],
      });
    }

    if (!answers.insulated) {
      qs.push({
        id: "insulated",
        title: "¿Necesitas aislamiento dieléctrico?",
        description: "Recomendado si trabajarás con electricidad.",
        type: "single",
        required: true,
        options: [
          { label: "Sí", value: "yes" },
          { label: "No", value: "no" },
        ],
      });
    }

    return take(qs, 4);
  }

  // paint_coating (pintura/recubrimientos - producto)
  if (family === "paint_coating") {
    const qs: DecisionQuestion[] = [];

    if (!answers.location) {
      qs.push({
        id: "location",
        title: "¿Dónde se aplicará?",
        type: "single",
        required: true,
        options: [
          { label: "Interior", value: "interior" },
          { label: "Exterior", value: "exterior" },
          { label: "Zona húmeda (baño/cocina)", value: "wet" },
        ],
      });
    }

    if (!answers.surface) {
      qs.push({
        id: "surface",
        title: "¿Qué superficie vas a pintar?",
        type: "single",
        required: true,
        options: [
          { label: "Pared (yeso/cemento)", value: "wall" },
          { label: "Madera", value: "wood" },
          { label: "Metal", value: "metal" },
          { label: "Azulejo", value: "tile" },
        ],
      });
    }

    if (!answers.finish) {
      qs.push({
        id: "finish",
        title: "¿Qué acabado prefieres?",
        type: "single",
        required: true,
        options: [
          { label: "Mate", value: "matte" },
          { label: "Satinado", value: "satin" },
          { label: "Semibrillante", value: "semi_gloss" },
          { label: "Brillante", value: "gloss" },
        ],
      });
    }

    if (!answers.area_size) {
      qs.push({
        id: "area_size",
        title: "¿Qué área aproximada pintarás?",
        type: "single",
        required: true,
        options: [
          { label: "Pequeña (1 habitación)", value: "small" },
          { label: "Media (2–3 habitaciones)", value: "medium" },
          { label: "Grande (casa completa)", value: "large" },
        ],
      });
    }

    return take(qs, 4);
  }

  // unknown (aclaración neutra)
  return [
    {
      id: "clarify",
      title: "No identifiqué la herramienta/material. ¿Qué necesitas hacer?",
      description: "Ej: perforar, cortar, sujetar, medir, pegar, pintar…",
      type: "text",
      required: true,
      placeholder: "Describe brevemente la tarea…",
    },
  ];
}
