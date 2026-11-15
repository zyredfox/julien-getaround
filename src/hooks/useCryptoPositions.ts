import { useMarketPositions } from "@/hooks/useMarketPositions";

export function useCryptoPositions(spaceId: string | undefined) {
  return useMarketPositions(spaceId, {
    table: "crypto_positions",
    source: "coingecko",
    queryKey: "crypto-positions",
  });
}
