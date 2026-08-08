"use client";

import { useReadContract, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI } from "@/lib/contracts";
import { getTokenByAddress, getTokenBySymbol } from "@/lib/tokenList";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

function isUsdcToken(tokenAddress?: string, tokenSymbol?: string): boolean {
  return (
    tokenSymbol?.toUpperCase() === "USDC" ||
    tokenAddress?.toLowerCase() === USDC_ADDRESS.toLowerCase()
  );
}

function isEurcToken(tokenAddress?: string, tokenSymbol?: string): boolean {
  return (
    tokenSymbol?.toUpperCase() === "EURC" ||
    tokenAddress?.toLowerCase() === EURC_ADDRESS.toLowerCase()
  );
}

function getTokenDecimals(tokenAddress?: string, tokenSymbol?: string): number {
  if (isUsdcToken(tokenAddress, tokenSymbol)) return 6;
  if (isEurcToken(tokenAddress, tokenSymbol)) return 6;
  const token =
    (tokenAddress ? getTokenByAddress(tokenAddress) : undefined) ||
    (tokenSymbol ? getTokenBySymbol(tokenSymbol) : undefined);
  return token?.decimals ?? 18;
}

export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
  tokenSymbol?: string
) {
  const isUsdc = isUsdcToken(tokenAddress, tokenSymbol);
  const decimals = getTokenDecimals(tokenAddress, tokenSymbol);

  // For non-USDC ERC-20 tokens (e.g. EURC): use balanceOf
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
    ? (balanceData !== undefined ? formatUnits(balanceData.value, balanceData.decimals ?? 18) : "0.00")
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
    ? (balanceData !== undefined ? formatUnits(balanceData.value, balanceData.decimals ?? 18) : "0.00")
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
