import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { PeaPosition } from "@/integrations/supabase/types";
import {
  fetchMarketQuotes,
  isQuoteFresh,
  normalizeTicker,
  type QuoteSource,
} from "@/lib/marketQuote";

export type MarketPosition = PeaPosition & {
  last_price_usd?: number | null;
};

export type MarketPositionInput = {
  ticker: string;
  isin?: string | null;
  label: string;
  quantity: number;
  avg_cost: number;
  last_price?: number | null;
  last_price_on?: string | null;
  notes?: string | null;
};

export type RefreshQuotesResult = {
  updated: number;
  skipped: number;
  failed: string[];
};

type TableName = "pea_positions" | "crypto_positions";

function positionValue(position: MarketPosition): number {
  const price =
    position.last_price != null
      ? Number(position.last_price)
      : Number(position.avg_cost);
  return Number(position.quantity) * price;
}

function positionValueUsd(position: MarketPosition): number {
  if (position.last_price_usd == null) return 0;
  return Number(position.quantity) * Number(position.last_price_usd);
}

function positionCost(position: MarketPosition): number {
  return Number(position.quantity) * Number(position.avg_cost);
}

export function useMarketPositions(
  spaceId: string | undefined,
  options: { table: TableName; source: QuoteSource; queryKey: string },
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [options.queryKey, user?.id, spaceId] as const;
  const { table, source } = options;

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id && spaceId),
    queryFn: async () => {
      if (!user?.id || !spaceId) return [] as MarketPosition[];
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("owner_id", user.id)
        .eq("space_id", spaceId)
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MarketPosition[];
    },
  });

  const createPosition = useMutation({
    mutationFn: async (input: MarketPositionInput) => {
      if (!user?.id || !spaceId) throw new Error("Espace introuvable");
      const ticker = normalizeTicker(input.ticker, source);
      const today = new Date().toISOString().slice(0, 10);

      let lastPrice = input.last_price ?? null;
      let lastPriceUsd: number | null = null;
      let lastPriceOn = input.last_price_on || today;
      let label = input.label.trim() || ticker;

      if (lastPrice == null) {
        try {
          const [quote] = await fetchMarketQuotes([ticker], {
            source,
            force: true,
          });
          if (quote?.price != null) {
            lastPrice = quote.price;
            lastPriceUsd =
              typeof quote.priceUsd === "number" ? quote.priceUsd : null;
            lastPriceOn = quote.asOf?.slice(0, 10) ?? today;
            if (!input.label.trim() && quote.name) {
              label =
                source === "coingecko"
                  ? quote.name.charAt(0).toUpperCase() + quote.name.slice(1)
                  : quote.name;
            }
          }
        } catch {
          // fallback PRU
        }
      }

      const baseInsert = {
        owner_id: user.id,
        space_id: spaceId,
        ticker,
        isin: input.isin?.trim() || null,
        label,
        quantity: input.quantity,
        avg_cost: input.avg_cost,
        last_price: lastPrice ?? input.avg_cost,
        last_price_on: lastPriceOn,
        notes: input.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } =
        table === "crypto_positions"
          ? await supabase
              .from("crypto_positions")
              .insert({ ...baseInsert, last_price_usd: lastPriceUsd })
              .select("*")
              .single()
          : await supabase
              .from("pea_positions")
              .insert(baseInsert)
              .select("*")
              .single();
      if (error) throw error;
      return data as MarketPosition;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const updatePosition = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<MarketPositionInput> & { id: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from(table)
        .update({
          ...patch,
          ticker: patch.ticker
            ? normalizeTicker(patch.ticker, source)
            : undefined,
          isin:
            patch.isin === undefined ? undefined : patch.isin?.trim() || null,
          label: patch.label?.trim(),
          notes:
            patch.notes === undefined ? undefined : patch.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as MarketPosition;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletePosition = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const refreshQuotes = useMutation({
    mutationFn: async (opts?: {
      force?: boolean;
    }): Promise<RefreshQuotesResult> => {
      if (!user?.id || !spaceId) throw new Error("Espace introuvable");
      const positions = query.data ?? [];
      if (positions.length === 0) {
        return { updated: 0, skipped: 0, failed: [] };
      }

      const force = Boolean(opts?.force);
      const stale = force
        ? positions
        : positions.filter(
            (row) => !isQuoteFresh(row.last_price_on, row.updated_at),
          );
      const skipped = positions.length - stale.length;

      if (stale.length === 0) {
        return { updated: 0, skipped, failed: [] };
      }

      const quotes = await fetchMarketQuotes(
        stale.map((row) => row.ticker),
        { source, force },
      );
      const bySymbol = new Map(
        quotes.map((quote) => [
          normalizeTicker(quote.symbol, source),
          quote,
        ]),
      );

      let updated = 0;
      const failed: string[] = [];
      const today = new Date().toISOString().slice(0, 10);

      for (const position of stale) {
        const key = normalizeTicker(position.ticker, source);
        const quote = bySymbol.get(key);

        if (!quote || quote.price == null) {
          failed.push(position.ticker);
          continue;
        }

        const pricePatch = {
          last_price: quote.price,
          last_price_on: quote.asOf?.slice(0, 10) ?? today,
          ticker: key,
          updated_at: new Date().toISOString(),
        };

        const { error } =
          table === "crypto_positions"
            ? await supabase
                .from("crypto_positions")
                .update({
                  ...pricePatch,
                  last_price_usd:
                    typeof quote.priceUsd === "number" ? quote.priceUsd : null,
                })
                .eq("id", position.id)
                .eq("owner_id", user.id)
            : await supabase
                .from("pea_positions")
                .update(pricePatch)
                .eq("id", position.id)
                .eq("owner_id", user.id);

        if (error) failed.push(position.ticker);
        else updated += 1;
      }

      return { updated, skipped, failed };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["workspace", user?.id] });
    },
  });

  const positions = query.data ?? [];
  const marketValue = positions.reduce(
    (sum, row) => sum + positionValue(row),
    0,
  );
  const marketValueUsd = positions.reduce(
    (sum, row) => sum + positionValueUsd(row),
    0,
  );
  const invested = positions.reduce((sum, row) => sum + positionCost(row), 0);

  return {
    ...query,
    positions,
    marketValue,
    marketValueUsd,
    invested,
    latent: marketValue - invested,
    positionValue,
    positionValueUsd,
    positionCost,
    createPosition,
    updatePosition,
    deletePosition,
    refreshQuotes,
  };
}
