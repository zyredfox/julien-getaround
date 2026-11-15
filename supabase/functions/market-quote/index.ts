import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type QuoteSource = "yahoo" | "coingecko";

type QuoteRequest = {
  symbols?: string[];
  source?: QuoteSource;
  force?: boolean;
};

type QuoteResult = {
  symbol: string;
  price: number | null;
  priceUsd: number | null;
  currency: string | null;
  name: string | null;
  changePercent: number | null;
  asOf: string | null;
  cached?: boolean;
  error?: string;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MS = 15 * 60 * 1000;

const quoteCache = new Map<
  string,
  { expiresAt: number; quote: QuoteResult }
>();

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

function cacheKey(source: QuoteSource, symbol: string): string {
  return `${source}:${symbol}`;
}

function getCached(source: QuoteSource, symbol: string): QuoteResult | null {
  const hit = quoteCache.get(cacheKey(source, symbol));
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    quoteCache.delete(cacheKey(source, symbol));
    return null;
  }
  return { ...hit.quote, cached: true };
}

function setCache(source: QuoteSource, symbol: string, quote: QuoteResult) {
  quoteCache.set(cacheKey(source, symbol), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    quote: { ...quote, cached: false },
  });
}

function normalizeYahooSymbol(raw: string): string {
  const symbol = raw.trim().toUpperCase();
  if (!symbol) return symbol;
  if (symbol.includes(".")) return symbol;
  return `${symbol}.PA`;
}

function normalizeCoingeckoId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const upper = trimmed.toUpperCase();
  if (CRYPTO_ALIASES[upper]) return CRYPTO_ALIASES[upper];
  return trimmed.toLowerCase();
}

async function fetchYahooQuote(symbol: string): Promise<QuoteResult> {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "1d");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JulienGetaround/1.0)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      symbol,
      price: null,
      priceUsd: null,
      currency: null,
      name: null,
      changePercent: null,
      asOf: null,
      error: `Yahoo HTTP ${response.status}`,
    };
  }

  const payload = await response.json();
  const meta = payload?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") {
    return {
      symbol,
      price: null,
      priceUsd: null,
      currency: null,
      name: null,
      changePercent: null,
      asOf: null,
      error: "Symbole introuvable",
    };
  }

  const asOf =
    typeof meta.regularMarketTime === "number"
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

  const price = meta.regularMarketPrice;
  const currency = meta.currency ?? null;

  return {
    symbol: meta.symbol ?? symbol,
    price,
    priceUsd: currency === "USD" ? price : null,
    currency,
    name: meta.longName ?? meta.shortName ?? null,
    changePercent:
      typeof meta.regularMarketChangePercent === "number"
        ? meta.regularMarketChangePercent
        : null,
    asOf,
  };
}

async function fetchCoingeckoQuotes(ids: string[]): Promise<QuoteResult[]> {
  if (ids.length === 0) return [];

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("vs_currencies", "eur,usd");
  url.searchParams.set("include_24hr_change", "true");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return ids.map((id) => ({
      symbol: id,
      price: null,
      priceUsd: null,
      currency: "EUR",
      name: null,
      changePercent: null,
      asOf: null,
      error: `CoinGecko HTTP ${response.status}`,
    }));
  }

  const payload = await response.json();
  const asOf = new Date().toISOString();

  return ids.map((id) => {
    const row = payload?.[id];
    if (!row || typeof row.eur !== "number") {
      return {
        symbol: id,
        price: null,
        priceUsd: null,
        currency: "EUR",
        name: null,
        changePercent: null,
        asOf: null,
        error: "Crypto introuvable (id CoinGecko)",
      };
    }
    return {
      symbol: id,
      price: row.eur,
      priceUsd: typeof row.usd === "number" ? row.usd : null,
      currency: "EUR",
      name: id,
      changePercent:
        typeof row.eur_24h_change === "number" ? row.eur_24h_change : null,
      asOf,
    };
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST requis" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as QuoteRequest;
    const source: QuoteSource =
      body.source === "coingecko" ? "coingecko" : "yahoo";
    const force = Boolean(body.force);

    const rawSymbols = Array.isArray(body.symbols) ? body.symbols : [];
    const symbols =
      source === "coingecko"
        ? [...new Set(rawSymbols.map(normalizeCoingeckoId).filter(Boolean))].slice(
            0,
            20,
          )
        : [...new Set(rawSymbols.map(normalizeYahooSymbol).filter(Boolean))].slice(
            0,
            20,
          );

    if (symbols.length === 0) {
      return new Response(JSON.stringify({ error: "symbols requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const quotes: QuoteResult[] = [];
    const toFetch: string[] = [];

    for (const symbol of symbols) {
      if (!force) {
        const cached = getCached(source, symbol);
        if (cached) {
          quotes.push(cached);
          continue;
        }
      }
      toFetch.push(symbol);
    }

    if (toFetch.length > 0) {
      if (source === "coingecko") {
        const fresh = await fetchCoingeckoQuotes(toFetch);
        for (const quote of fresh) {
          if (quote.price != null) setCache(source, quote.symbol, quote);
          quotes.push(quote);
        }
      } else {
        const fresh = await Promise.all(
          toFetch.map((symbol) => fetchYahooQuote(symbol)),
        );
        for (const quote of fresh) {
          const key = normalizeYahooSymbol(quote.symbol);
          if (quote.price != null) setCache(source, key, quote);
          quotes.push(quote);
        }
      }
    }

    return new Response(
      JSON.stringify({
        quotes,
        cacheTtlMinutes: 15,
        source,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur market-quote";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
