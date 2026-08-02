// Bouchique — flower palettes + type definitions

export const PALETTES = {
  rose:   { a: "#ff5d8f", b: "#e6336f", center: "#c9184a", name: "Rose" },
  blush:  { a: "#ffc2d4", b: "#ff8fab", center: "#ff5d8f", name: "Blush" },
  coral:  { a: "#ffb199", b: "#ff7a5c", center: "#e63946", name: "Coral" },
  sunny:  { a: "#ffd166", b: "#ffb703", center: "#b45309", name: "Sunny" },
  grape:  { a: "#cdb4ff", b: "#a78bfa", center: "#7c3aed", name: "Grape" },
  berry:  { a: "#f8a5c2", b: "#f06292", center: "#ad1457", name: "Berry" },
  snow:   { a: "#ffffff", b: "#ffe5ec", center: "#ffd6e0", name: "Snow" },
  peach:  { a: "#ffd7ba", b: "#ffb98f", center: "#ff8fab", name: "Peach" },
  sky:    { a: "#a9d4ff", b: "#79b8f5", center: "#2f6fd0", name: "Sky" },
  mint:   { a: "#d5f5e3", b: "#a8e6cf", center: "#55a67e", name: "Mint" },
};

// which palettes suit each flower type
export const TYPE_PALETTES = {
  rose:       ["rose", "blush", "berry", "coral"],
  tulip:      ["rose", "sunny", "grape", "peach", "sky"],
  daisy:      ["snow", "sunny"],
  sunflower:  ["sunny"],
  peony:      ["blush", "berry", "coral", "grape", "rose"],
  poppy:      ["coral", "rose", "peach"],
  lavender:   ["grape", "berry"],
  calla:      ["snow", "sky", "rose", "peach"],
  babysbreath:["snow", "blush"],
};

export const FLOWER_NAMES = {
  rose: "Rose", tulip: "Tulip", daisy: "Daisy", sunflower: "Sunflower",
  peony: "Peony", poppy: "Poppy", lavender: "Lavender", calla: "Calla Lily",
  babysbreath: "Baby's Breath",
};

