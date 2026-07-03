"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ERC20_ABI, LENDING_POOL_ABI, LENDING_POOL_ADDRESS } from "@/lib/contracts";
import { useTxStore } from "@/lib/txStore";
import { arcTestnet } from "@/lib/wagmiConfig";

export function useSupply() {
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

  const supply = async (tokenAddress: `0x${string}`, amount: string, decimals: number, tokenSymbol: string) => {
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    const txId = addTx("supply", amount, tokenSymbol);

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
        functionName: "supply",
        args: [tokenAddress, rawAmount],
        chainId: arcTestnet.id,
      });

      setTxHash(hash);
      updateTransaction(txId, { status: "success", txHash: hash });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Supply failed";
      setError(msg);
      updateTransaction(txId, { status: "failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (tokenAddress: `0x${string}`, amount: string, decimals: number, tokenSymbol: string) => {
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    const txId = addTx("withdraw", amount, tokenSymbol);

    try {
      const rawAmount = parseUnits(amount, decimals);

      const hash = await writeContractAsync({
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "withdraw",
        args: [tokenAddress, rawAmount],
        chainId: arcTestnet.id,
      });

      setTxHash(hash);
      updateTransaction(txId, { status: "success", txHash: hash });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Withdraw failed";
      setError(msg);
      updateTransaction(txId, { status: "failed" });
    } finally {
      setIsLoading(false);
    }
  };

  function addTx(type: "supply" | "withdraw", amount: string, token: string): string {
    const id = Math.random().toString(36).slice(2);
    addTransaction({ type, amount, token, status: "pending" });
    return id;
  }

  return { supply, withdraw, isLoading: isLoading || isWaiting, isSuccess, txHash, error };
}
