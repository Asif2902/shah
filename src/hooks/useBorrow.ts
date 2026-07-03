"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ERC20_ABI, LENDING_POOL_ABI, LENDING_POOL_ADDRESS } from "@/lib/contracts";
import { useTxStore } from "@/lib/txStore";
import { arcTestnet } from "@/lib/wagmiConfig";

export function useBorrow() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { addTransaction, updateTransaction } = useTxStore();
  const { writeContractAsync } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: arcTestnet.id,
  });

  const borrow = async (tokenAddress: `0x${string}`, amount: string, decimals: number, tokenSymbol: string) => {
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    const id = Math.random().toString(36).slice(2);
    addTransaction({ type: "borrow", amount, token: tokenSymbol, status: "pending" });

    try {
      const rawAmount = parseUnits(amount, decimals);

      const hash = await writeContractAsync({
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "borrow",
        args: [tokenAddress, rawAmount],
        chainId: arcTestnet.id,
      });

      setTxHash(hash);
      updateTransaction(id, { status: "success", txHash: hash });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Borrow failed";
      setError(msg);
      updateTransaction(id, { status: "failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const repay = async (tokenAddress: `0x${string}`, amount: string, decimals: number, tokenSymbol: string) => {
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    const id = Math.random().toString(36).slice(2);
    addTransaction({ type: "repay", amount, token: tokenSymbol, status: "pending" });

    try {
      const rawAmount = parseUnits(amount, decimals);

      await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [LENDING_POOL_ADDRESS, rawAmount],
        chainId: arcTestnet.id,
      });

      const hash = await writeContractAsync({
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "repay",
        args: [tokenAddress, rawAmount],
        chainId: arcTestnet.id,
      });

      setTxHash(hash);
      updateTransaction(id, { status: "success", txHash: hash });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Repay failed";
      setError(msg);
      updateTransaction(id, { status: "failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return { borrow, repay, isLoading: isLoading || isWaiting, isSuccess, txHash, error };
}
