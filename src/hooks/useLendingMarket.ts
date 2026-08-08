"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { LENDING_POOL_ABI, LENDING_POOL_ADDRESS } from "@/lib/contracts";
import { TOKEN_LIST, Token } from "@/lib/tokenList";

export interface MarketAsset {
  token: Token;
  isSupported: boolean;
  totalSupplied: bigint;
  totalBorrowed: bigint;
  totalSuppliedFormatted: string;
  totalBorrowedFormatted: string;
  supplyApr: number;
  supplyApy: number;
  borrowApr: number;
  borrowApy: number;
  userSupplyAmount: bigint;
  userSupplyFormatted: string;
  userBorrowAmount: bigint;
  userBorrowFormatted: string;
}

function calculateApy(aprPercent: number): number {
  if (!aprPercent || aprPercent <= 0) return 0;
  const ratePerDay = aprPercent / 100 / 365;
  const apy = (Math.pow(1 + ratePerDay, 365) - 1) * 100;
  return Number(apy.toFixed(2));
}

export function useLendingMarket() {
  const { address, isConnected } = useAccount();

  // Create contract queries for each token in TOKEN_LIST
  const contracts = TOKEN_LIST.flatMap((t) => [
    {
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "assets",
      args: [t.address],
    },
    {
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "getSupplyRate",
      args: [t.address],
    },
    {
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "getBorrowRate",
      args: [t.address],
    },
    {
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "supplyShares",
      args: address ? [address, t.address] : undefined,
    },
    {
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "borrowShares",
      args: address ? [address, t.address] : undefined,
    },
  ]);

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: true,
      refetchInterval: 10_000,
    },
  });

  // Second pass queries for supplySharesToAmount and borrowSharesToAmount
  const shareConversionContracts = TOKEN_LIST.flatMap((t, idx) => {
    const baseIdx = idx * 5;
    const userSupplyShares = (data?.[baseIdx + 3]?.result as bigint) ?? 0n;
    const userBorrowShares = (data?.[baseIdx + 4]?.result as bigint) ?? 0n;

    return [
      {
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "supplySharesToAmount",
        args: [t.address, userSupplyShares],
      },
      {
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: "borrowSharesToAmount",
        args: [t.address, userBorrowShares],
      },
    ];
  });

  const { data: shareData, isLoading: shareLoading, refetch: refetchShares } = useReadContracts({
    contracts: shareConversionContracts,
    query: {
      enabled: !!data && data.length > 0,
      refetchInterval: 10_000,
    },
  });

  const markets: MarketAsset[] = TOKEN_LIST.map((t, idx) => {
    const baseIdx = idx * 5;
    const assetData = data?.[baseIdx]?.result as
      | [boolean, bigint, bigint, bigint, bigint, bigint]
      | undefined;
    const supplyRateRaw = (data?.[baseIdx + 1]?.result as bigint) ?? 0n;
    const borrowRateRaw = (data?.[baseIdx + 2]?.result as bigint) ?? 0n;

    const shareIdx = idx * 2;
    const userSupplyAmount = (shareData?.[shareIdx]?.result as bigint) ?? 0n;
    const userBorrowAmount = (shareData?.[shareIdx + 1]?.result as bigint) ?? 0n;

    const isSupported = assetData ? assetData[0] : true;
    const totalSupplied = assetData ? assetData[1] : 0n;
    const totalBorrowed = assetData ? assetData[2] : 0n;

    const supplyAprPercent = parseFloat(formatUnits(supplyRateRaw, 18)) * 100;
    const borrowAprPercent = parseFloat(formatUnits(borrowRateRaw, 18)) * 100;

    const supplyApy = calculateApy(supplyAprPercent);
    const borrowApy = calculateApy(borrowAprPercent);

    return {
      token: t,
      isSupported,
      totalSupplied,
      totalBorrowed,
      totalSuppliedFormatted: parseFloat(formatUnits(totalSupplied, t.decimals)).toFixed(4),
      totalBorrowedFormatted: parseFloat(formatUnits(totalBorrowed, t.decimals)).toFixed(4),
      supplyApr: Number(supplyAprPercent.toFixed(2)),
      supplyApy,
      borrowApr: Number(borrowAprPercent.toFixed(2)),
      borrowApy,
      userSupplyAmount,
      userSupplyFormatted: parseFloat(formatUnits(userSupplyAmount, t.decimals)).toFixed(4),
      userBorrowAmount,
      userBorrowFormatted: parseFloat(formatUnits(userBorrowAmount, t.decimals)).toFixed(4),
    };
  });

  const refetchAll = () => {
    refetch();
    refetchShares();
  };

  return {
    markets,
    isLoading: isLoading || shareLoading,
    error,
    refetch: refetchAll,
  };
}
