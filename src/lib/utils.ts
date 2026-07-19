import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Arc AppKit's HTTP client retries HTTP 404 (treated as "not yet available")
 * and 429 the same as 5xx/network errors, so "no liquidity route for this pair"
 * and "service is actually down" both surface as "Maximum retry attempts exceeded".
 * Arc Testnet liquidity is thin by design (see docs.arc.io/app-kit/quickstarts),
 * so a 404 there almost always means "no route for this pair right now", not an outage.
 */
export function describeSwapError(err: unknown): string {
  const message = err instanceof Error ? err.message : "Swap failed";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseBody = (err as any)?.responseBody;
  const apiMessage: string | undefined = responseBody?.message;

  if (apiMessage?.toLowerCase().includes("no route") || message.includes("HTTP 404")) {
    return "No swap route found for this pair on Arc Testnet right now — testnet liquidity can be thin or imbalanced. Try a different pair, a smaller amount, or try again shortly.";
  }
  if (message.includes("HTTP 429")) {
    return "Arc AppKit is rate-limiting swap requests. Please wait a moment and try again.";
  }
  if (message.includes("Maximum retry attempts") || message.includes("Failed to fetch")) {
    // Surface the real reason instead of a fully generic string — "Failed to fetch"
    // (network/CORS-level) and "HTTP 5xx exceeded" (backend-level) need different fixes,
    // and hiding which one it is makes this undebuggable from the UI alone.
    const reason = apiMessage ?? message.replace(/^Maximum retry attempts \(\d+\) exceeded:\s*/, "");
    return `Arc AppKit Swap Service is currently unavailable (${reason}). Please try again later.`;
  }
  return apiMessage ?? message;
}
