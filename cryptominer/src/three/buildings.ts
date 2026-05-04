// Single source of truth for the city buildings.
// Mirrors the legacy `BUILDINGS` array in App.tsx so the 3D scene and the
// React UI stay in lockstep.

export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  baseCost: number;
  color: string;
  effectStr: string;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: "bank",
    name: "Crypto Bank",
    icon: "🏦",
    desc: "Generates passive USDT every second",
    baseCost: 1000,
    color: "#eab308",
    effectStr: "+$1/sec",
  },
  {
    id: "farm",
    name: "Mining HQ",
    icon: "🏭",
    desc: "Boosts total Hash Power globally",
    baseCost: 2000,
    color: "#3b82f6",
    effectStr: "+5% Hash Power",
  },
  {
    id: "hospital",
    name: "Bitcoin Hospital",
    icon: "🏥",
    desc: "Optimizes supply, making miners cheaper",
    baseCost: 1500,
    color: "#ef4444",
    effectStr: "-5% Miner Cost",
  },
  {
    id: "academy",
    name: "Web3 Academy",
    icon: "🎓",
    desc: "Researches cooling, making racks cheaper",
    baseCost: 1200,
    color: "#10b981",
    effectStr: "-10% Rack Cost",
  },
  {
    id: "hub",
    name: "Trading Hub",
    icon: "🛒",
    desc: "Boosts your Exchange trading volume",
    baseCost: 3000,
    color: "#8b5cf6",
    effectStr: "+10% Exchange Vol",
  },
  {
    id: "park",
    name: "Satoshi Park",
    icon: "⛲",
    desc: "Attracts crypto enthusiasts. Passive BTC",
    baseCost: 5000,
    color: "#22c55e",
    effectStr: "+0.00000001 BTC/s",
  },
];

export function buildingCost(def: BuildingDef, level: number): number {
  return Math.floor(def.baseCost * Math.pow(1.5, level));
}
