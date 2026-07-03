"use client";

import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { LENDING_POOL_ABI, LENDING_POOL_ADDRESS } from "@/lib/contracts";

export function useHealthFactor() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: "getUserAccountData",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30_000,
    },
  });

  const result = data as [bigint, bigint, bigint] | undefined;

  const totalCollateralUSD = result ? parseFloat(formatUnits(result[0], 6)) : 0;
  const totalDebtUSD = result ? parseFloat(formatUnits(result[1], 6)) : 0;
  const healthFactor = result ? parseFloat(formatUnits(result[2], 18)) : null;

  const maxBorrow = totalCollateralUSD * 0.8;
  const availableBorrowUSD = Math.max(0, maxBorrow - totalDebtUSD);

  return {
    healthFactor,
    totalCollateralUSD,
    totalDebtUSD,
    availableBorrowUSD,
    isLoading,
    error,
    refetch,
  };
}
