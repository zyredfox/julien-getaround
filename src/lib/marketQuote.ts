import { supabase } from "@/integrations/supabase/client";

export type QuoteSource = "yahoo" | "coingecko";

export type MarketQuote = {
  symbol: string;
  price: number | null;
  /** Prix USD (crypto / CoinGecko). */
  priceUsd?: number | null;
  currency: string | null;
  name: string | null;
  changePercent: number | null;
  asOf: string | null;
  cached?: boolean;
  error?: string;
};

/** Cache client : ne pas re-fetcher avant 15 min (sauf force). */
export const QUOTE_CLIENT_TTL_MS = 15 * 60 * 1000;

const CRYPTO_ALIASES: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  POL: "matic-network",
  LINK: "chainlink",
  LTC: "litecoin",
  UNI: "uniswap",
  ATOM: "cosmos",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  BUSD: "binance-usd",
};

/** Ajoute .PA si pas de place (ex. PSP5 → PSP5.PA). */
export function normalizePeaTicker(raw: string): string {
  const symbol = raw.trim().toUpperCase();
  if (!symbol) return symbol;
  if (symbol.includes(".")) return symbol;
  return `${symbol}.PA`;
}

/** Id CoinGecko : BTC → bitcoin, ethereum reste ethereum. */
export function normalizeCryptoId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const upper = trimmed.toUpperCase();
  if (CRYPTO_ALIASES[upper]) return CRYPTO_ALIASES[upper];
  return trimmed.toLowerCase();
}

export function normalizeTicker(raw: string, source: QuoteSource): string {
  return source === "coingecko"
    ? normalizeCryptoId(raw)
    : normalizePeaTicker(raw);
}

export function isQuoteFresh(
  lastPriceOn: string | null | undefined,
  updatedAt?: string | null,
): boolean {
  const iso = updatedAt || (lastPriceOn ? `${lastPriceOn}T12:00:00.000Z` : null);
  if (!iso) return false;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < QUOTE_CLIENT_TTL_MS;
}

export async function fetchMarketQuotes(
  symbols: string[],
  options?: { source?: QuoteSource; force?: boolean },
): Promise<MarketQuote[]> {
  const source = options?.source ?? "yahoo";
  const unique = [
    ...new Set(symbols.map((s) => normalizeTicker(s, source)).filter(Boolean)),
  ].slice(0, 20);
  if (unique.length === 0) return [];

  const { data, error } = await supabase.functions.invoke<{
    quotes?: MarketQuote[];
    error?: string;
  }>("market-quote", {
    body: {
      symbols: unique,
      source,
      force: Boolean(options?.force),
    },
  });

  if (error) {
    throw new Error(error.message || "Impossible de récupérer les cours");
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.quotes ?? [];
}
