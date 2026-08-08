"use client";

import { useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { writeContract, waitForTransactionReceipt, readContract } from "wagmi/actions";
import { parseUnits } from "viem";
import { LENDING_POOL_ABI, LENDING_POOL_ADDRESS, ERC20_ABI } from "@/lib/contracts";
import { useTxStore } from "@/lib/txStore";

export function useLendingActions() {
  const { address } = useAccount();
  const config = useConfig();
  const { addTransaction } = useTxStore();
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const supply = async (
    tokenAddress: `0x${string}`,
    amountStr: string,
    decimals: number,
    symbol: string
  ): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setSubmitting(true);
    try {
      const parsedAmount = parseUnits(amountStr, decimals);

      // 1. Check current allowance
      setStatusMessage(`Checking ${symbol} allowance...`);
      const currentAllowance = (await readContract(config, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, LENDING_POOL_ADDRESS],
      })) as bigint;

      // 2. Approve if allowance is insufficient
      if (currentAllowance < parsedAmount) {
        setStatusMessage(`Approving ${symbol} for Lending Pool...`);
        const approveTx = await writeContract(config, {
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [LENDING_POOL_ADDRESS, parsedAmount],
        });
        await waitForTransactionReceipt(config, { hash: approveTx });
      }

      // 3. Call supply
      setStatusMessage(`Supplying ${amountStr} ${symbol}...`);
      const supplyTx = await writeContract(config, {
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "supply",
        args: [tokenAddress, parsedAmount],
      });
      await waitForTransactionReceipt(config, { hash: supplyTx });

      addTransaction({
        type: "supply",
        amount: amountStr,
        token: symbol,
        status: "success",
        txHash: supplyTx,
      });

      return supplyTx;
    } catch (err: unknown) {
      addTransaction({
        type: "supply",
        amount: amountStr,
        token: symbol,
        status: "failed",
      });
      throw err;
    } finally {
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  const withdraw = async (
    tokenAddress: `0x${string}`,
    amountStr: string,
    decimals: number,
    symbol: string
  ): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setSubmitting(true);
    try {
      const parsedAmount = parseUnits(amountStr, decimals);

      setStatusMessage(`Withdrawing ${amountStr} ${symbol}...`);
      const withdrawTx = await writeContract(config, {
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "withdraw",
        args: [tokenAddress, parsedAmount],
      });
      await waitForTransactionReceipt(config, { hash: withdrawTx });

      addTransaction({
        type: "withdraw",
        amount: amountStr,
        token: symbol,
        status: "success",
        txHash: withdrawTx,
      });

      return withdrawTx;
    } catch (err: unknown) {
      addTransaction({
        type: "withdraw",
        amount: amountStr,
        token: symbol,
        status: "failed",
      });
      throw err;
    } finally {
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  const borrow = async (
    tokenAddress: `0x${string}`,
    amountStr: string,
    decimals: number,
    symbol: string
  ): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setSubmitting(true);
    try {
      const parsedAmount = parseUnits(amountStr, decimals);

      setStatusMessage(`Borrowing ${amountStr} ${symbol}...`);
      const borrowTx = await writeContract(config, {
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "borrow",
        args: [tokenAddress, parsedAmount],
      });
      await waitForTransactionReceipt(config, { hash: borrowTx });

      addTransaction({
        type: "borrow",
        amount: amountStr,
        token: symbol,
        status: "success",
        txHash: borrowTx,
      });

      return borrowTx;
    } catch (err: unknown) {
      addTransaction({
        type: "borrow",
        amount: amountStr,
        token: symbol,
        status: "failed",
      });
      throw err;
    } finally {
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  const repay = async (
    tokenAddress: `0x${string}`,
    amountStr: string,
    decimals: number,
    symbol: string
  ): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setSubmitting(true);
    try {
      const parsedAmount = parseUnits(amountStr, decimals);

      // 1. Check allowance
      setStatusMessage(`Checking ${symbol} allowance...`);
      const currentAllowance = (await readContract(config, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, LENDING_POOL_ADDRESS],
      })) as bigint;

      // 2. Approve if allowance is insufficient
      if (currentAllowance < parsedAmount) {
        setStatusMessage(`Approving ${symbol} for Repayment...`);
        const approveTx = await writeContract(config, {
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [LENDING_POOL_ADDRESS, parsedAmount],
        });
        await waitForTransactionReceipt(config, { hash: approveTx });
      }

      // 3. Call repay
      setStatusMessage(`Repaying ${amountStr} ${symbol}...`);
      const repayTx = await writeContract(config, {
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "repay",
        args: [tokenAddress, parsedAmount],
      });
      await waitForTransactionReceipt(config, { hash: repayTx });

      addTransaction({
        type: "repay",
        amount: amountStr,
        token: symbol,
        status: "success",
        txHash: repayTx,
      });

      return repayTx;
    } catch (err: unknown) {
      addTransaction({
        type: "repay",
        amount: amountStr,
        token: symbol,
        status: "failed",
      });
      throw err;
    } finally {
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  return {
    supply,
    withdraw,
    borrow,
    repay,
    submitting,
    statusMessage,
  };
}
