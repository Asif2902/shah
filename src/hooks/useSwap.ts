"use client";

import { useState } from "react";
import { createPublicClient, http } from "viem";
import { SwapKit } from "@circle-fin/swap-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { useTxStore } from "@/lib/txStore";
import { describeSwapError } from "@/lib/utils";
import { getInjectedWalletProvider } from "@/lib/walletProvider";
import { ARC_TESTNET_RPC } from "@/lib/constants";

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
      const kitKey = process.env.NEXT_PUBLIC_ARC_KIT_KEY;
      if (!kitKey || kitKey === "your_kit_key_here") {
        throw new Error(
          "Arc AppKit key not configured. Add NEXT_PUBLIC_ARC_KIT_KEY to .env.local"
        );
      }

      // Discover the wallet via EIP-6963 rather than window.ethereum directly —
      // avoids silently picking the wrong extension when multiple wallets are installed.
      const provider = await getInjectedWalletProvider();
      await provider.request({ method: "eth_requestAccounts", params: undefined });

      // Pin the RPC transport instead of the SDK's default endpoint, which
      // docs.arc.io/app-kit/tutorials/adapter-setups notes "may be rate-limited
      // or unreliable" — confirmed firsthand while debugging this integration.
      const adapter = await createViemAdapterFromProvider({
        provider,
        getPublicClient: ({ chain }) => createPublicClient({ chain, transport: http(ARC_TESTNET_RPC) }),
      });
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
      console.error("[useSwap] swap failed:", err);
      const message = describeSwapError(err);
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
