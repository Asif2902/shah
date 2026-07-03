"use client";

import { useState, useEffect, useRef } from "react";
import { SwapKit } from "@circle-fin/swap-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

interface SwapQuoteResult {
  amountOut: string;
  priceImpact: number;
  minimumReceived: string;
  gasFee: string;
  loading: boolean;
  error: string | null;
}

export function useSwapQuote(
  tokenInSymbol: string | undefined,
  tokenOutSymbol: string | undefined,
  amountIn: string,
  slippage: number = 0.5
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

    abortRef.current = false;
    setResult((prev) => ({ ...prev, loading: true, error: null }));

    const kitKey = process.env.NEXT_PUBLIC_ARC_KIT_KEY;

    // Fallback mock estimate when no kit key configured
    if (!kitKey || kitKey === "your_kit_key_here") {
      const timer = setTimeout(() => {
        if (abortRef.current) return;
        const rawOut = amount * 0.998;
        const minReceived = rawOut * (1 - slippage / 100);
        setResult({
          amountOut: rawOut.toFixed(4),
          priceImpact: 0.05,
          minimumReceived: minReceived.toFixed(4),
          gasFee: "~0.001 USDC",
          loading: false,
          error: null,
        });
      }, 400);
      return () => {
        abortRef.current = true;
        clearTimeout(timer);
      };
    }

    // Real Arc AppKit estimate
    const fetchEstimate = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eth = (window as any).ethereum;
        if (!eth) throw new Error("No wallet provider found");

        const adapter = await createViemAdapterFromProvider({ provider: eth });
        const kit = new SwapKit();

        const quote = await kit.estimate({
          from: { adapter, chain: "Arc_Testnet" },
          tokenIn: tokenInSymbol,
          tokenOut: tokenOutSymbol,
          amountIn: amountIn,
          config: { 
            kitKey: process.env.NEXT_PUBLIC_ARC_KIT_KEY,
            slippageBps: 50
          },
        });

        if (abortRef.current) return;

        const estimatedOut = quote.estimatedOutput?.amount ?? "";
        const stopLimitAmount = quote.stopLimit?.amount ?? "";

        // Gas fee from fees array
        const gasFeeEntry = quote.fees?.find((f) => f.type === "gas");
        const gasFee = gasFeeEntry
          ? `~${parseFloat(gasFeeEntry.amount ?? "0").toFixed(4)} ${gasFeeEntry.token}`
          : "~0.001 USDC";

        // Price impact
        const outNum = parseFloat(estimatedOut);
        const stopNum = parseFloat(stopLimitAmount);
        const priceImpact = outNum > 0 ? Math.abs(((outNum - stopNum) / outNum) * 100) : 0;

        const minReceived = (outNum * (1 - slippage / 100)).toFixed(4);

        setResult({
          amountOut: parseFloat(estimatedOut).toFixed(4),
          priceImpact: parseFloat(priceImpact.toFixed(4)),
          minimumReceived: minReceived,
          gasFee,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        if (abortRef.current) return;
        // Graceful fallback
        const rawOut = amount * 0.998;
        let errorMessage = err instanceof Error ? err.message : "Estimate failed";
        if (errorMessage.includes("Maximum retry attempts") || errorMessage.includes("Failed to fetch")) {
          errorMessage = "Arc AppKit Service is currently unavailable. Please try again later.";
        }

        setResult({
          amountOut: rawOut.toFixed(4),
          priceImpact: 0.05,
          minimumReceived: (rawOut * (1 - slippage / 100)).toFixed(4),
          gasFee: "~0.001 USDC",
          loading: false,
          error: errorMessage,
        });
      }
    };

    fetchEstimate();
    return () => { abortRef.current = true; };
  }, [tokenInSymbol, tokenOutSymbol, amountIn, slippage]);

  return result;
}
