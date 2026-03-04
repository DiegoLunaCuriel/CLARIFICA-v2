// src/lib/decision-engine/categories.ts

export const UNKNOWN_CATEGORY = "unknown";

export const DECISION_CATEGORIES: Array<{
  id: string;
  label: string;
  keywords: string[];
}> = [
  // --- Perforación / Atornillado (eléctrico) ---
  {
    id: "drill_concrete",
    label: "Taladro/Rotomartillo para concreto/mampostería",
    keywords: [
      "taladro",
      "rotomartillo",
      "perforar",
      "perforacion",
      "concreto",
      "hormigon",
      "mamposteria",
      "ladrillo",
      "block",
      "taquete",
      "broca",
      "percusion",
      "impacto",
      "martillo",
      "sds",
    ],
  },
  {
    id: "drill_wood_metal",
    label: "Taladro/atornillador para madera/metal",
    keywords: ["atornillador", "taladro", "madera", "metal", "lamina", "broca metal", "broca madera"],
  },

  // --- Corte eléctrico ---
  {
    id: "power_cut",
    label: "Corte eléctrico (sierras/esmeril)",
    keywords: [
      "cortar",
      "sierra",
      "sierra circular",
      "caladora",
      "inglete",
      "tronzadora",
      "esmeril",
      "amoladora",
      "disco de corte",
      "radial",
    ],
  },

  // --- Herramienta manual: sujeción/corte ---
  {
    id: "pliers_grip_cut",
    label: "Pinzas/alicates/corte manual/sujeción",
    keywords: [
      "pinzas",
      "alicate",
      "alicates",
      "perico",
      "ajustable",
      "corte diagonal",
      "punta larga",
      "grip",
      "presion",
      "cortacables",
      "pelacables",
      "cizalla",
    ],
  },

  // --- Herramienta manual: atornillado/llaves ---
  {
    id: "manual_drive",
    label: "Destornilladores/llaves/matraca",
    keywords: [
      "destornillador",
      "desarmador",
      "phillips",
      "plano",
      "torx",
      "allen",
      "llave",
      "matraca",
      "dado",
      "trinquete",
      "torque",
    ],
  },

  // --- Medición ---
  {
    id: "measuring",
    label: "Medición (cinta/nivel/escuadra)",
    keywords: ["cinta", "flexometro", "metro", "nivel", "escuadra", "plomada", "calibrador", "vernier", "medir"],
  },

  // --- Fijación ---
  {
    id: "fasteners",
    label: "Tornillos/taquetes/anclajes/clavos",
    keywords: [
      "tornillo",
      "tornillos",
      "taquete",
      "taquetes",
      "anclaje",
      "anclajes",
      "pija",
      "pijas",
      "clavo",
      "clavos",
      "tirafondo",
      "arandela",
      "tuerca",
      "pija tablaroca",
    ],
  },

  // --- Pintura (producto) ---
  {
    id: "paint_coating",
    label: "Pintura/recubrimientos/selladores",
    keywords: [
      "pintura",
      "pintar",
      "vinilica",
      "esmalte",
      "impermeabilizante",
      "sellador",
      "primer",
      "base",
      "barniz",
      "acabado",
      "mate",
      "satinado",
      "brillante",
    ],
  },

  // --- Pintura (herramientas) ---
  {
    id: "paint_tools",
    label: "Herramientas de pintura (brocha/rodillo/pistola)",
    keywords: ["brocha", "rodillo", "charola", "pistola de pintura", "aspersor", "airless", "pincel"],
  },

  // --- Adhesivos y selladores ---
  {
    id: "adhesive_sealant",
    label: "Adhesivos y selladores (silicón/epóxico/pegamentos)",
    keywords: [
      "silicon",
      "silicón",
      "sellador",
      "epoxico",
      "epóxico",
      "resina",
      "pegamento",
      "adhesivo",
      "pvc cement",
      "cemento pvc",
      "pegazulejo",
    ],
  },

  // --- Cemento / morteros ---
  {
    id: "cement_mortar",
    label: "Cemento/mortero/grout/mezclas",
    keywords: ["cemento", "mortero", "mezcla", "grout", "boquilla", "adhesivo cementoso", "pegazulejo", "arena", "cal"],
  },

  // --- Tablaroca / yeso ---
  {
    id: "drywall",
    label: "Tablaroca/yeso y accesorios",
    keywords: ["tablaroca", "durock", "panel de yeso", "yeso", "cinta", "pasta", "resanador", "plafon"],
  },

  // --- Plomería ---
  {
    id: "plumbing",
    label: "Plomería (PVC/conexiones/llaves)",
    keywords: [
      "plomeria",
      "plomería",
      "tubo pvc",
      "cpvc",
      "pex",
      "conector",
      "codo",
      "tee",
      "valvula",
      "llave",
      "fuga",
      "teflon",
      "cinta teflon",
    ],
  },

  // --- Eléctrico ---
  {
    id: "electrical",
    label: "Eléctrico (cable/contactos/pastillas)",
    keywords: [
      "cable",
      "cables",
      "contacto",
      "apagador",
      "interruptor",
      "pastilla",
      "breaker",
      "centro de carga",
      "tierra",
      "canaleta",
      "conduit",
      "tubo conduit",
      "terminal",
    ],
  },

  // --- Seguridad ---
  {
    id: "safety_ppe",
    label: "Seguridad (EPP)",
    keywords: ["guantes", "lentes", "casco", "mascarilla", "respirador", "orejeras", "arnes", "seguridad"],
  },

  // --- Escaleras ---
  {
    id: "ladders",
    label: "Escaleras",
    keywords: ["escalera", "tijera", "andamio", "plataforma"],
  },

  // --- Limpieza / químicos comunes ---
  {
    id: "cleaning",
    label: "Limpieza (químicos y herramientas)",
    keywords: ["limpiar", "desengrasante", "thinner", "solvente", "removedor", "cepillo", "escoba", "trapo", "desengrasante", "desengrasar", "grasa", "aceite", "limpiador", "limpieza",],
  },

  // --- Unknown ---
  {
    id: UNKNOWN_CATEGORY,
    label: "Desconocido",
    keywords: [],
  },
];
