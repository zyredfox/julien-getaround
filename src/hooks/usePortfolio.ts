import { useMemo } from "react";
import { useBilan } from "@/hooks/useBilan";
import { useCryptoPositions } from "@/hooks/useCryptoPositions";
import { useExpenses } from "@/hooks/useExpenses";
import { usePeaPositions } from "@/hooks/usePeaPositions";
import { useRentals } from "@/hooks/useRentals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatMoney, formatUsd } from "@/lib/money";
import { defaultPeriodSelection } from "@/lib/period";
import { SPACE_REGISTRY } from "@/spaces/registry";
import type { SpaceKind } from "@/integrations/supabase/types";

export type PortfolioSlice = {
  kind: Extract<SpaceKind, "getaround" | "pea" | "crypto">;
  label: string;
  path: string;
  value: number;
  hint: string;
  percent: number;
  barClass: string;
};

/** Agrège Getaround + PEA + Crypto. */
export function usePortfolio() {
  const {
    vehicle,
    taxSettings,
    peaSpace,
    cryptoSpace,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const { data: rentals, isLoading: rentalsLoading } = useRentals(vehicle?.id);
  const { data: expenses, isLoading: expensesLoading } = useExpenses(
    vehicle?.id,
  );
  const yearPeriod = useMemo(() => defaultPeriodSelection("year"), []);
  const bilan = useBilan(rentals, expenses, taxSettings, yearPeriod, vehicle);
  const {
    marketValue: peaValue,
    latent: peaLatent,
    positions: peaPositions,
    isLoading: peaLoading,
  } = usePeaPositions(peaSpace?.id);
  const {
    marketValue: cryptoValue,
    marketValueUsd: cryptoValueUsd,
    latent: cryptoLatent,
    positions: cryptoPositions,
    isLoading: cryptoLoading,
  } = useCryptoPositions(cryptoSpace?.id);

  const getaroundValue = bilan.cashNet;
  const slices = useMemo(() => {
    const raw: Omit<PortfolioSlice, "percent">[] = SPACE_REGISTRY.map(
      (space) => {
        if (space.kind === "getaround") {
          return {
            kind: "getaround",
            label: space.label,
            path: space.path,
            value: getaroundValue,
            hint: "Cash net année en cours",
            barClass: space.barClass,
          };
        }
        if (space.kind === "pea") {
          return {
            kind: "pea",
            label: space.label,
            path: space.path,
            value: peaValue,
            hint:
              peaPositions.length === 0
                ? "Aucune position"
                : `Latent ${peaLatent >= 0 ? "+" : ""}${peaLatent.toFixed(0)} €`,
            barClass: space.barClass,
          };
        }
        return {
          kind: "crypto",
          label: space.label,
          path: space.path,
          value: cryptoValue,
          hint:
            cryptoPositions.length === 0
              ? "Aucune position"
              : `${formatMoney(cryptoValue)} · ${formatUsd(cryptoValueUsd)}`,
          barClass: space.barClass,
        };
      },
    );

    const absoluteTotal = raw.reduce((sum, row) => sum + Math.abs(row.value), 0);

    return raw.map((row) => ({
      ...row,
      percent:
        absoluteTotal > 0
          ? Math.round((Math.abs(row.value) / absoluteTotal) * 1000) / 10
          : 0,
    }));
  }, [
    getaroundValue,
    peaValue,
    peaLatent,
    peaPositions.length,
    cryptoValue,
    cryptoValueUsd,
    cryptoLatent,
    cryptoPositions.length,
  ]);

  const total = slices.reduce((sum, row) => sum + row.value, 0);

  return {
    isLoading:
      workspaceLoading ||
      rentalsLoading ||
      expensesLoading ||
      peaLoading ||
      cryptoLoading,
    total,
    slices,
    getaroundCashNet: getaroundValue,
    peaValue,
    cryptoValue,
  };
}
