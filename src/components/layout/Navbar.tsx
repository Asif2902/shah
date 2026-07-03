"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Menu, X, ChevronDown, LogOut, Copy } from "lucide-react";
import { ConnectModal } from "@/components/wallet/ConnectModal";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";

const navLinks = [
  { href: "/swap", label: "Swap" },
  { href: "/lend", label: "Lend" },
  { href: "/borrow", label: "Borrow" },
];

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isCorrectNetwork } = useArcNetwork();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // USDC is the native gas token on Arc Testnet — fetch via useBalance (no token address)
  const { data: usdcBalanceData } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  });
  const usdcBalance = usdcBalanceData
    ? formatUnits(usdcBalanceData.value, 18)
    : "0.00";

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-8"
        style={{ height: 64, background: "#0a0a0f", borderBottom: "1px solid #1a1a2e" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-xl font-bold text-white">Arc</span>
          <span className="text-xl font-bold text-blue-500">Flow</span>
          <span className="text-xl font-bold text-gray-400 ml-1">Finance</span>
        </Link>

        {/* Center Nav — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${pathname === link.href
                ? "bg-blue-500/10 text-blue-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Testnet badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25 flex-shrink-0">
            Testnet
          </span>

          {/* Connect / Account */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              {/* USDC balance chip */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13131a] border border-[#2a2a3a] text-sm text-gray-200 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="font-semibold tabular-nums">{Number(usdcBalance).toFixed(2)}</span>
                <span className="text-gray-500 text-xs">USDC</span>
              </div>

              {/* Wallet button + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#13131a] border border-[#2a2a3a] hover:border-blue-500/40 transition-all text-sm min-h-[44px]"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-gray-200 hidden sm:inline">{truncateAddress(address)}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#13131a] border border-[#2a2a3a] rounded-xl p-2 shadow-2xl z-50">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-[#2a2a3a] mb-2">
                      Connected Wallet
                    </div>
                    <div className="px-3 py-2 text-sm text-gray-300 font-mono truncate">
                      {address}
                    </div>
                    <button
                      onClick={copyAddress}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Copy size={14} />
                      {copied ? "Copied!" : "Copy address"}
                    </button>
                    <button
                      onClick={() => { disconnect(); setAccountOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={14} />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConnectOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors min-h-[44px]"
            >
              Connect Wallet
            </button>
          )}

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-[#0a0a0f] border-r border-[#1a1a2e] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#1a1a2e]">
              <Link href="/" className="flex items-center gap-0.5" onClick={() => setMobileOpen(false)}>
                <span className="text-xl font-bold text-white">Arc</span>
                <span className="text-xl font-bold text-blue-500">Flow</span>
                <span className="text-xl font-bold text-gray-400 ml-1">Finance</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white p-2 min-h-[44px]">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-all min-h-[52px] flex items-center ${pathname === link.href
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto p-4 border-t border-[#1a1a2e]">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25 mb-4">
                Testnet — No real money
              </span>
              {!isConnected && (
                <button
                  onClick={() => { setMobileOpen(false); setConnectOpen(true); }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors min-h-[52px]"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConnectModal isOpen={connectOpen} onClose={() => setConnectOpen(false)} />
    </>
  );
}
