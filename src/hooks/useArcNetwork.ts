"use client";

import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/constants";

const ARC_CHAIN_HEX = "0x4CE352"; // 5042002 in hex

const ARC_CHAIN_PARAMS = {
  chainId: ARC_CHAIN_HEX,
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.network"],
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  },
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

async function addAndSwitchToArc() {
  if (typeof window === "undefined" || !window.ethereum) return;

  try {
    // First, try to add the chain (idempotent — safe if already added)
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ARC_CHAIN_PARAMS],
    });
  } catch {
    // Some wallets throw if the chain already exists; that's fine — continue to switch
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_HEX }],
    });
  } catch (switchError: any) {
    console.error("Failed to switch to Arc Testnet:", switchError);
    throw switchError;
  }
}

export function useArcNetwork() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = !isConnected || chainId === ARC_TESTNET_CHAIN_ID;

  const switchToArc = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        await addAndSwitchToArc();
      } else if (switchChain) {
        switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // Auto-trigger on wallet connect or chain change
  useEffect(() => {
    if (isConnected && chainId !== ARC_TESTNET_CHAIN_ID) {
      switchToArc();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, chainId]);

  return { isCorrectNetwork, switchToArc, chainId };
}
