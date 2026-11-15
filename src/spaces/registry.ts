import type { LucideIcon } from "lucide-react";
import {
  Bitcoin,
  Car,
  LayoutDashboard,
  LineChart,
  PieChart,
  Receipt,
  Wallet,
} from "lucide-react";
import type { SpaceKind } from "@/integrations/supabase/types";

export type SpaceNavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: LucideIcon;
};

export type SpaceDefinition = {
  kind: Extract<SpaceKind, "getaround" | "pea" | "crypto">;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
  accentClass: string;
  barClass: string;
  icon: LucideIcon;
  nav: SpaceNavItem[];
};

export const SPACE_REGISTRY: SpaceDefinition[] = [
  {
    kind: "getaround",
    label: "Getaround",
    shortLabel: "Auto",
    path: "/getaround",
    description: "Locations, dépenses, bilan & impôts",
    accentClass: "bg-accent text-white",
    barClass: "bg-accent",
    icon: Car,
    nav: [
      {
        to: "/getaround",
        label: "Bilan",
        end: true,
        icon: LayoutDashboard,
      },
      { to: "/getaround/locations", label: "Locations", icon: Car },
      { to: "/getaround/depenses", label: "Dépenses", icon: Receipt },
    ],
  },
  {
    kind: "pea",
    label: "PEA",
    shortLabel: "PEA",
    path: "/pea",
    description: "ETF & actions — cours Yahoo",
    accentClass: "bg-ink-900 text-accent-bright",
    barClass: "bg-ink-700 dark:bg-accent-bright",
    icon: LineChart,
    nav: [
      { to: "/pea", label: "Vue", end: true, icon: PieChart },
      { to: "/pea/positions", label: "Positions", icon: Wallet },
    ],
  },
  {
    kind: "crypto",
    label: "Crypto",
    shortLabel: "Crypto",
    path: "/crypto",
    description: "BTC, ETH… — cours CoinGecko",
    accentClass: "bg-signal text-white",
    barClass: "bg-signal",
    icon: Bitcoin,
    nav: [
      { to: "/crypto", label: "Vue", end: true, icon: PieChart },
      { to: "/crypto/positions", label: "Positions", icon: Wallet },
    ],
  },
];

export function getSpaceByPath(pathname: string): SpaceDefinition | null {
  return (
    SPACE_REGISTRY.find(
      (space) =>
        pathname === space.path || pathname.startsWith(`${space.path}/`),
    ) ?? null
  );
}

export function getSpaceByKind(
  kind: SpaceKind,
): SpaceDefinition | undefined {
  return SPACE_REGISTRY.find((space) => space.kind === kind);
}
