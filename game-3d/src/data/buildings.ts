import type { BuildingDef } from "../types";

export const BUILDINGS: BuildingDef[] = [
  {
    id: "house",
    name: "Settler's House",
    icon: "🏠",
    cost: 200,
    size: 1,
    color: "#8a6a4a",
    description: "A simple home. Citizens generate +1 gold/min.",
  },
  {
    id: "barracks",
    name: "Barracks",
    icon: "🏰",
    cost: 600,
    size: 2,
    color: "#5a626f",
    description: "Trains militia. Increases your max HP by +20.",
  },
  {
    id: "smithy",
    name: "Smithy",
    icon: "⚒️",
    cost: 800,
    size: 1,
    color: "#a06a3a",
    description: "Reduces crafting gold cost by 10%.",
  },
  {
    id: "temple",
    name: "Temple of Glyphs",
    icon: "⛩️",
    cost: 1200,
    size: 2,
    color: "#7a5ab6",
    description: "Heals on rest. +15 max MP.",
  },
  {
    id: "wall",
    name: "Stone Wall",
    icon: "🧱",
    cost: 80,
    size: 1,
    color: "#6f6c65",
    description: "Defensive segment. +1 city defence each.",
  },
  {
    id: "tower",
    name: "Watchtower",
    icon: "🗼",
    cost: 500,
    size: 1,
    color: "#4a566a",
    description: "Long-range defence. +5 city defence.",
  },
  {
    id: "farm",
    name: "Farmstead",
    icon: "🌾",
    cost: 350,
    size: 2,
    color: "#a08a3a",
    description: "Produces +2 gold/min.",
  },
  {
    id: "market",
    name: "Marketplace",
    icon: "🏪",
    cost: 1500,
    size: 2,
    color: "#3a8aa0",
    description: "Vendors pay 10% more for your items.",
  },
];

export const CITY_TILE_SIZE = 1.5; // world units per tile
export const CITY_HALF = 12; // grid is 24×24 tiles centred on origin
