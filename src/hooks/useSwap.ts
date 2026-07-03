"use client";

import { useState } from "react";
import { SwapKit } from "@circle-fin/swap-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { useTxStore } from "@/lib/txStore";

export function useSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const { addTransaction } = useTxStore();

  const swap = async (
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string,
    _decimalsIn: number,
    _decimalsOut: number,
    tokenDisplaySymbol: string,
    _slippage: number = 0.5,
    _deadlineMinutes: number = 20
  ): Promise<string | undefined> => {
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum;
      if (!eth) {
        throw new Error("No wallet provider found. Please install MetaMask.");
      }

      const kitKey = process.env.NEXT_PUBLIC_ARC_KIT_KEY;
      if (!kitKey || kitKey === "your_kit_key_here") {
        throw new Error(
          "Arc AppKit key not configured. Add NEXT_PUBLIC_ARC_KIT_KEY to .env.local"
        );
      }

      // Request wallet access
      await eth.request({ method: "eth_requestAccounts" });

      // Create viem adapter from injected browser wallet
      const adapter = await createViemAdapterFromProvider({ provider: eth });
      const kit = new SwapKit();

      const result = await kit.swap({
        from: { adapter, chain: "Arc_Testnet" },
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountIn: amountIn,
        config: {
          kitKey: kitKey as string,
          slippageBps: Math.floor(_slippage * 100),
          allowanceStrategy: "approve", // Arc Testnet needs approve (no ecrecover)
        },
      });

      const hash = result.txHash;
      setTxHash(hash);
      setIsSuccess(true);

      addTransaction({
        type: "swap",
        amount: amountIn,
        token: tokenDisplaySymbol,
        status: "success",
        txHash: hash,
      });

      return hash;
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : "Swap failed";
      if (message.includes("Maximum retry attempts") || message.includes("Failed to fetch")) {
        message = "Arc AppKit Swap Service is currently unavailable. Please try again later.";
      }
      setError(message);
      addTransaction({
        type: "swap",
        amount: amountIn,
        token: tokenDisplaySymbol,
        status: "failed",
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { swap, isLoading, isSuccess, txHash, error };
}
