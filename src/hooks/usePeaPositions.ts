import { useMarketPositions } from "@/hooks/useMarketPositions";

export type {
  MarketPositionInput as PeaPositionInput,
  RefreshQuotesResult,
} from "@/hooks/useMarketPositions";

export function usePeaPositions(spaceId: string | undefined) {
  return useMarketPositions(spaceId, {
    table: "pea_positions",
    source: "yahoo",
    queryKey: "pea-positions",
  });
}
