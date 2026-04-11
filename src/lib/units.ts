export const UNIT_GROUPS = [
  {
    label: "🌡️ Temperatura",
    units: ["°C", "°F"],
  },
  {
    label: "⚡ Tensão",
    units: ["V"],
  },
  {
    label: "🔌 Corrente",
    units: ["A"],
  },
  {
    label: "🧊 Pressão",
    units: ["PSI", "bar", "kPa", "atm"],
  },
  {
    label: "🌬️ Fluxo de ar",
    units: ["m³/h"],
  },
  {
    label: "💧 Umidade",
    units: ["%"],
  },
  {
    label: "⚙️ Frequência",
    units: ["Hz"],
  },
];

export const ALL_UNITS = UNIT_GROUPS.flatMap((g) => g.units);
