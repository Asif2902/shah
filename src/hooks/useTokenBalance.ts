"use client";

import { useReadContract, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI } from "@/lib/contracts";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

function isUsdcToken(tokenAddress?: string, tokenSymbol?: string): boolean {
  return (
    tokenSymbol?.toUpperCase() === "USDC" ||
    tokenAddress?.toLowerCase() === USDC_ADDRESS.toLowerCase()
  );
}

export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
  tokenSymbol?: string
) {
  const isUsdc = isUsdcToken(tokenAddress, tokenSymbol);

  // For non-USDC ERC-20 tokens: use balanceOf
  const { data: readData, isLoading: readIsLoading, error: readError, refetch: readRefetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !isUsdc && !!tokenAddress && !!userAddress,
    },
  });

  // For USDC (native gas token on Arc Testnet): use useBalance with address only
  const { data: balanceData, isLoading: balanceIsLoading, error: balanceError, refetch: balanceRefetch } = useBalance({
    address: userAddress,
    query: {
      // Only need the wallet address connected — no token address
      enabled: isUsdc && !!userAddress,
    },
  });

  const data = isUsdc ? balanceData?.value : (readData as bigint | undefined);
  const isLoading = isUsdc ? balanceIsLoading : readIsLoading;
  const error = isUsdc ? balanceError : readError;
  const refetch = isUsdc ? balanceRefetch : readRefetch;

  const formatted = isUsdc
    ? (balanceData !== undefined ? formatUnits(balanceData.value, 18) : "0.00")
    : (data !== undefined ? formatUnits(data as bigint, 18) : "0.00");
  const displayBalance = parseFloat(formatted).toFixed(4);

  return {
    balance: displayBalance,
    rawBalance: data,
    isLoading,
    error,
    refetch,
  };
}

export function useTokenBalanceWithDecimals(
  tokenAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
  decimals: number,
  tokenSymbol?: string
) {
  const isUsdc = isUsdcToken(tokenAddress, tokenSymbol);

  const { data: readData, isLoading: readIsLoading, error: readError, refetch: readRefetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !isUsdc && !!tokenAddress && !!userAddress,
    },
  });

  // For USDC (native gas token on Arc Testnet): use useBalance with address only
  const { data: balanceData, isLoading: balanceIsLoading, error: balanceError, refetch: balanceRefetch } = useBalance({
    address: userAddress,
    query: {
      enabled: isUsdc && !!userAddress,
    },
  });

  const data = isUsdc ? balanceData?.value : (readData as bigint | undefined);
  const isLoading = isUsdc ? balanceIsLoading : readIsLoading;
  const error = isUsdc ? balanceError : readError;
  const refetch = isUsdc ? balanceRefetch : readRefetch;

  const formatted = isUsdc
    ? (balanceData !== undefined ? formatUnits(balanceData.value, balanceData.decimals) : "0.00")
    : (data !== undefined ? formatUnits(data as bigint, decimals) : "0.00");
  const displayBalance = parseFloat(formatted).toFixed(4);

  return {
    balance: displayBalance,
    rawBalance: data,
    isLoading,
    error,
    refetch,
  };
}
