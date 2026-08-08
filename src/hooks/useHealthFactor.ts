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
      refetchInterval: 10_000,
    },
  });

  const result = data as [bigint, bigint, bigint] | undefined;

  // Handles collateral & debt USD formatting
  // The contract returns collateral and debt USD values based on oracle price
  const totalCollateralUSD = result ? parseFloat(formatUnits(result[0], 18)) : 0;
  const totalDebtUSD = result ? parseFloat(formatUnits(result[1], 18)) : 0;

  let healthFactor: number | null = null;
  if (result && result[2] !== undefined) {
    const rawVal = result[2];
    // If debt is 0, health factor is uint256 max
    if (rawVal === 115792089237316195423570985008687907853269984665640564039457584007913129639935n) {
      healthFactor = null;
    } else {
      const val = parseFloat(formatUnits(rawVal, 18));
      healthFactor = val > 100 || !isFinite(val) ? null : val;
    }
  }

  const maxBorrow = totalCollateralUSD * 0.8; // 80% liquidation threshold
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
