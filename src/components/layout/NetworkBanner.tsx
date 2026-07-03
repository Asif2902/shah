"use client";

import { useAccount } from "wagmi";
import { AlertTriangle } from "lucide-react";
import { useArcNetwork } from "@/hooks/useArcNetwork";

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const { isCorrectNetwork, switchToArc } = useArcNetwork();

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 px-4 py-2.5 flex items-center justify-center gap-3 text-white text-sm">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>Please switch to Arc Testnet</span>
      <button
        onClick={switchToArc}
        className="ml-2 px-3 py-1 bg-white text-red-600 font-semibold rounded-lg text-xs hover:bg-red-50 transition-colors flex-shrink-0"
      >
        Switch Network
      </button>
    </div>
  );
}
