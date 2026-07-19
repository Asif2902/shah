"use client";

import { useState, useEffect, useRef } from "react";
import { parseUnits, formatUnits } from "viem";
import { getTokenBySymbol } from "@/lib/tokenList";

interface SwapQuoteResult {
  amountOut: string;
  priceImpact: number;
  minimumReceived: string;
  gasFee: string;
  loading: boolean;
  error: string | null;
}

/**
 * Maps our /api/swap/quote proxy's HTTP status back to an actionable message.
 * The proxy runs server-side, so a failure here is either "no liquidity route"
 * (expected on Arc Testnet — see docs.arc.io/app-kit/quickstarts) or a real
 * outage of Circle's service, never a browser-side network/extension block.
 */
function describeQuoteError(status: number, apiMessage?: string): string {
  if (status === 404 || apiMessage?.toLowerCase().includes("no route")) {
    return "No swap route found for this pair on Arc Testnet right now — testnet liquidity can be thin or imbalanced. Try a different pair, a smaller amount, or try again shortly.";
  }
  if (status === 429) {
    return "Arc AppKit is rate-limiting quote requests. Please wait a moment and try again.";
  }
  if (status === 502) {
    return "Arc AppKit Swap Service is currently unavailable. Please try again later.";
  }
  return apiMessage ?? `Quote request failed (HTTP ${status})`;
}

/**
 * Fetches swap quotes from our own /api/swap/quote route instead of calling
 * Circle's API directly from the browser. That endpoint is read-only pricing
 * with no wallet/signing involved, so proxying it server-side means browser
 * extensions or network policies that block third-party fetches to
 * api.circle.com no longer break quotes (unlike swap execution, which still
 * has to run client-side against the wallet adapter).
 */
export function useSwapQuote(
  tokenInSymbol: string | undefined,
  tokenOutSymbol: string | undefined,
  amountIn: string,
  slippage: number = 0.5,
  fromAddress?: string
): SwapQuoteResult {
  const [result, setResult] = useState<SwapQuoteResult>({
    amountOut: "",
    priceImpact: 0,
    minimumReceived: "",
    gasFee: "",
    loading: false,
    error: null,
  });

  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    const empty: SwapQuoteResult = {
      amountOut: "",
      priceImpact: 0,
      minimumReceived: "",
      gasFee: "",
      loading: false,
      error: null,
    };

    if (!tokenInSymbol || !tokenOutSymbol || !amountIn || parseFloat(amountIn) === 0) {
      setResult(empty);
      return;
    }

    if (tokenInSymbol === tokenOutSymbol) {
      setResult(empty);
      return;
    }

    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) {
      setResult(empty);
      return;
    }

    const tokenIn = getTokenBySymbol(tokenInSymbol);
    const tokenOut = getTokenBySymbol(tokenOutSymbol);
    if (!tokenIn || !tokenOut) {
      setResult(empty);
      return;
    }

    abortRef.current = false;
    setResult((prev) => ({ ...prev, loading: true, error: null }));

    const fetchEstimate = async () => {
      try {
        const amountInBaseUnits = parseUnits(amountIn, tokenIn.decimals).toString();
        const params = new URLSearchParams({
          tokenIn: tokenIn.symbol,
          tokenOut: tokenOut.symbol,
          amount: amountInBaseUnits,
        });
        if (fromAddress) params.set("fromAddress", fromAddress);

        const res = await fetch(`/api/swap/quote?${params.toString()}`);
        const body = await res.json().catch(() => null);

        if (abortRef.current) return;

        if (!res.ok) {
          setResult({
            amountOut: "",
            priceImpact: 0,
            minimumReceived: "",
            gasFee: "",
            loading: false,
            error: describeQuoteError(res.status, body?.error),
          });
          return;
        }

        const estimatedAmount = BigInt(body.quote.estimatedAmount);
        const minAmount = BigInt(body.quote.minAmount);

        const amountOutNum = parseFloat(formatUnits(estimatedAmount, tokenOut.decimals));
        const minReceivedNum = parseFloat(formatUnits(minAmount, tokenOut.decimals));
        const priceImpact = amountOutNum > 0 ? Math.abs(((amountOutNum - minReceivedNum) / amountOutNum) * 100) : 0;

        setResult({
          amountOut: amountOutNum.toFixed(4),
          priceImpact: parseFloat(priceImpact.toFixed(4)),
          minimumReceived: minReceivedNum.toFixed(4),
          gasFee: "~0.001 USDC",
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (abortRef.current) return;
        console.error("[useSwapQuote] estimate failed:", err);
        setResult({
          amountOut: "",
          priceImpact: 0,
          minimumReceived: "",
          gasFee: "",
          loading: false,
          error: err instanceof Error ? err.message : "Estimate failed",
        });
      }
    };

    const debounceTimer = setTimeout(() => {
      if (abortRef.current) return;
      fetchEstimate();
    }, 350);

    return () => {
      abortRef.current = true;
      clearTimeout(debounceTimer);
    };
  }, [tokenInSymbol, tokenOutSymbol, amountIn, slippage, fromAddress]);

  return result;
}
