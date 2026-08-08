"use client";

import { useState, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { X, AlertTriangle, CheckCircle, Loader2, ExternalLink, TrendingUp } from "lucide-react";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { useHealthFactor } from "@/hooks/useHealthFactor";
import { ARC_EXPLORER } from "@/lib/constants";

const SUPPLY_MARKETS = [
  { symbol: "USDC", name: "USD Coin", apy: 4.2, decimals: 6 },
  { symbol: "WETH", name: "Wrapped Ether", apy: 2.8, decimals: 18 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", apy: 1.5, decimals: 8 },
  { symbol: "DAI", name: "Dai Stablecoin", apy: 3.9, decimals: 18 },
];

const BORROW_MARKETS = [
  { symbol: "USDC", name: "USD Coin", borrowApy: 6.1, decimals: 6 },
  { symbol: "WETH", name: "Wrapped Ether", borrowApy: 4.2, decimals: 18 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", borrowApy: 3.0, decimals: 8 },
  { symbol: "DAI", name: "Dai Stablecoin", borrowApy: 5.5, decimals: 18 },
];

function validateAmount(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts[1];
  if (parts[1] && parts[1].length > 6) return parts[0] + "." + parts[1].slice(0, 6);
  return cleaned;
}

type ToastMsg = { type: "pending" | "success" | "error"; message: string; txHash?: string };

export default function LendPage() {
  const { isConnected, address } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { healthFactor, totalCollateralUSD, totalDebtUSD, availableBorrowUSD, isLoading: hfLoading } = useHealthFactor();

  const [supplyModal, setSupplyModal] = useState<(typeof SUPPLY_MARKETS)[0] | null>(null);
  const [borrowModal, setBorrowModal] = useState<(typeof BORROW_MARKETS)[0] | null>(null);
  const [supplyAmount, setSupplyAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [useAsCollateral, setUseAsCollateral] = useState(true);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const borrowLimitUsed = useMemo(() => {
    if (!totalCollateralUSD || totalCollateralUSD === 0) return 0;
    return Math.min((totalDebtUSD / (totalCollateralUSD * 0.8)) * 100, 100);
  }, [totalCollateralUSD, totalDebtUSD]);

  const previewHF = useMemo(() => {
    if (!borrowAmount || !borrowModal) return healthFactor;
    const add = parseFloat(borrowAmount) || 0;
    if (!add) return healthFactor;
    const newDebt = totalDebtUSD + add;
    if (!totalCollateralUSD) return null;
    const res = (totalCollateralUSD * 0.8) / newDebt;
    return res > 100 ? null : res;
  }, [borrowAmount, borrowModal, healthFactor, totalCollateralUSD, totalDebtUSD]);

  const showToast = (msg: ToastMsg) => {
    setToast(msg);
    if (msg.type !== "pending") setTimeout(() => setToast(null), 5000);
  };

  const handleSupply = () => {
    if (!supplyAmount || parseFloat(supplyAmount) === 0) return;
    const sym = supplyModal?.symbol;
    const amt = supplyAmount;
    setSubmitting(true);
    showToast({ type: "pending", message: `Supplying ${amt} ${sym}...` });
    setSupplyModal(null);
    setSupplyAmount("");
    setTimeout(() => {
      setSubmitting(false);
      showToast({ type: "success", message: `Supplied ${amt} ${sym} successfully!`, txHash: "0xmock" });
    }, 2000);
  };

  const handleBorrow = () => {
    if (!borrowAmount || parseFloat(borrowAmount) === 0) return;
    const sym = borrowModal?.symbol;
    const amt = borrowAmount;
    setSubmitting(true);
    showToast({ type: "pending", message: `Borrowing ${amt} ${sym}...` });
    setBorrowModal(null);
    setBorrowAmount("");
    setTimeout(() => {
      setSubmitting(false);
      showToast({ type: "success", message: `Borrowed ${amt} ${sym} successfully!`, txHash: "0xmock" });
    }, 2000);
  };

  const hfColor = (hf: number | null) =>
    hf === null ? "text-gray-500" : hf > 1.5 ? "text-green-400" : hf >= 1.0 ? "text-yellow-400" : "text-red-400";

  const borrowRisk = previewHF !== null && previewHF < 1.2;
  const borrowLiqRisk = previewHF !== null && previewHF < 1.0;

  const currentUsdcBalanceStr = balanceData
    ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)
    : "0.00";

  return (
    <div className="min-h-screen px-4 pt-8 pb-24" style={{ background: "#0a0a0f" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lend & Borrow</h1>
          <p className="text-gray-400">Supply assets to earn yield. Borrow against your collateral.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Net APY", value: "0.00%" },
            { label: "Total Supplied", value: `$${totalCollateralUSD.toFixed(4)}` },
            { label: "Total Borrowed", value: `$${totalDebtUSD.toFixed(4)}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#2a2a3a] p-5" style={{ background: "#13131a" }}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              {hfLoading ? <div className="w-20 h-7 rounded-lg bg-gray-800 animate-pulse" /> : <p className="text-xl font-bold text-white">{s.value}</p>}
            </div>
          ))}
          <div className="rounded-2xl border border-[#2a2a3a] p-5" style={{ background: "#13131a" }}>
            <p className="text-xs text-gray-500 mb-1">Health Factor</p>
            {hfLoading ? (
              <div className="w-20 h-7 rounded-lg bg-gray-800 animate-pulse" />
            ) : (
              <div>
                <span className={`text-2xl font-bold ${hfColor(healthFactor)}`}>
                  {healthFactor !== null && healthFactor <= 100 ? healthFactor.toFixed(2) : "—"}
                </span>
                {healthFactor !== null && healthFactor < 1.0 && (
                  <div className="mt-1 flex items-center gap-1 text-red-400 text-xs"><AlertTriangle size={12} />Liquidation risk!</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Borrow Limit Bar */}
        <div className="rounded-2xl border border-[#2a2a3a] p-5 mb-8" style={{ background: "#13131a" }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Borrow Limit Used</span>
            <span className="text-white font-semibold">{borrowLimitUsed.toFixed(4)}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#2a2a3a] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${borrowLimitUsed > 80 ? "bg-red-500" : borrowLimitUsed > 50 ? "bg-yellow-500" : "bg-blue-500"}`}
              style={{ width: `${borrowLimitUsed}%` }}
            />
          </div>
        </div>

        {/* Markets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supply */}
          <div className="rounded-2xl border border-[#2a2a3a] overflow-hidden" style={{ background: "#13131a" }}>
            <div className="p-5 border-b border-[#2a2a3a]">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" /> Supply Markets
              </h2>
            </div>
            {!isConnected ? (
              <div className="p-8 text-center text-gray-500 text-sm">Connect wallet to view markets.</div>
            ) : SUPPLY_MARKETS.map((m) => (
              <div key={m.symbol} className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a2e] last:border-0 hover:bg-white/[0.02] transition-colors">
                <TokenLogo symbol={m.symbol} size={32} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{m.symbol}</div>
                  <div className="text-xs text-gray-500">{m.name}</div>
                </div>
                <div className="text-emerald-400 font-semibold text-sm mr-4">{m.apy}%</div>
                <div className="text-gray-500 text-sm mr-4 hidden sm:block">
                  {m.symbol === "USDC" ? currentUsdcBalanceStr : "0.00"}
                </div>
                <button onClick={() => { setSupplyModal(m); setSupplyAmount(""); }} className="px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-medium transition-colors min-h-[36px]">
                  Supply
                </button>
              </div>
            ))}
          </div>

          {/* Borrow */}
          <div className="rounded-2xl border border-[#2a2a3a] overflow-hidden" style={{ background: "#13131a" }}>
            <div className="p-5 border-b border-[#2a2a3a]">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ExternalLink size={18} className="text-purple-400" /> Borrow Markets
              </h2>
            </div>
            {!isConnected ? (
              <div className="p-8 text-center text-gray-500 text-sm">Connect wallet to view markets.</div>
            ) : BORROW_MARKETS.map((m) => (
              <div key={m.symbol} className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a2e] last:border-0 hover:bg-white/[0.02] transition-colors">
                <TokenLogo symbol={m.symbol} size={32} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{m.symbol}</div>
                  <div className="text-xs text-gray-500">{m.name}</div>
                </div>
                <div className="text-purple-400 font-semibold text-sm mr-4">{m.borrowApy}%</div>
                <div className="text-gray-500 text-sm mr-4 hidden sm:block">0.00</div>
                <button onClick={() => { setBorrowModal(m); setBorrowAmount(""); }} className="px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs font-medium transition-colors min-h-[36px]">
                  Borrow
                </button>
              </div>
            ))}
          </div>
        </div>

        {isConnected && !hfLoading && totalCollateralUSD === 0 && (
          <div className="mt-6 rounded-2xl border border-[#2a2a3a] p-8 text-center" style={{ background: "#13131a" }}>
            <TrendingUp className="text-blue-400 mx-auto mb-3" size={28} />
            <p className="text-gray-300 font-medium mb-1">You have no active positions.</p>
            <p className="text-gray-500 text-sm">Supply tokens above to get started and earn yield.</p>
          </div>
        )}
      </div>

      {/* Supply Modal */}
      {supplyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSupplyModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full sm:w-[420px] rounded-t-2xl sm:rounded-2xl border border-[#2a2a3a] p-5 shadow-2xl z-10" style={{ background: "#13131a" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Supply {supplyModal.symbol}</h2>
              <button onClick={() => setSupplyModal(null)} className="text-gray-400 hover:text-white p-1"><X size={18} /></button>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-400 font-medium">Amount</label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">
                    Balance: {currentUsdcBalanceStr} {supplyModal.symbol}
                  </span>
                  {balanceData && parseFloat(currentUsdcBalanceStr) > 0 && (
                    <button
                      type="button"
                      onClick={() => setSupplyAmount(currentUsdcBalanceStr)}
                      className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#2a2a3a] focus-within:border-blue-500/50" style={{ background: "#1c1c26" }}>
                <TokenLogo symbol={supplyModal.symbol} size={28} />
                <input type="text" inputMode="decimal" placeholder="0.0" value={supplyAmount} onChange={(e) => setSupplyAmount(validateAmount(e.target.value))} className="flex-1 bg-transparent text-white text-lg font-semibold outline-none" autoFocus />
                <span className="text-gray-400 text-sm">{supplyModal.symbol}</span>
              </div>
            </div>
            <div className="rounded-xl p-3 border border-[#2a2a3a] space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Supply APY</span><span className="text-emerald-400 font-semibold">{supplyModal.apy}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Collateral Factor</span><span className="text-gray-300">80%</span></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#2a2a3a] mb-5" style={{ background: "#1c1c26" }}>
              <div>
                <p className="text-sm text-white font-medium">Use as Collateral</p>
                <p className="text-xs text-gray-500 mt-0.5">Enable borrowing against this asset</p>
              </div>
              <button onClick={() => setUseAsCollateral(!useAsCollateral)} className={`relative w-11 h-6 rounded-full transition-colors ${useAsCollateral ? "bg-blue-600" : "bg-[#2a2a3a]"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${useAsCollateral ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
            <button onClick={handleSupply} disabled={!supplyAmount || parseFloat(supplyAmount) === 0 || submitting} className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-[#2a2a3a] disabled:text-gray-500 text-white font-semibold transition-colors min-h-[52px]">
              {submitting ? "Supplying..." : `Supply ${supplyModal.symbol}`}
            </button>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {borrowModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setBorrowModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full sm:w-[420px] rounded-t-2xl sm:rounded-2xl border border-[#2a2a3a] p-5 shadow-2xl z-10" style={{ background: "#13131a" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Borrow {borrowModal.symbol}</h2>
              <button onClick={() => setBorrowModal(null)} className="text-gray-400 hover:text-white p-1"><X size={18} /></button>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-400 font-medium">Amount</label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">
                    Available: ${availableBorrowUSD.toFixed(4)}
                  </span>
                  {availableBorrowUSD > 0 && (
                    <button
                      type="button"
                      onClick={() => setBorrowAmount(availableBorrowUSD.toFixed(4))}
                      className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#2a2a3a] focus-within:border-blue-500/50" style={{ background: "#1c1c26" }}>
                <TokenLogo symbol={borrowModal.symbol} size={28} />
                <input type="text" inputMode="decimal" placeholder="0.0" value={borrowAmount} onChange={(e) => setBorrowAmount(validateAmount(e.target.value))} className="flex-1 bg-transparent text-white text-lg font-semibold outline-none" autoFocus />
                <span className="text-gray-400 text-sm">{borrowModal.symbol}</span>
              </div>
            </div>
            <div className="rounded-xl p-3 border border-[#2a2a3a] space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Borrow APY</span><span className="text-purple-400 font-semibold">{borrowModal.borrowApy}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Available</span><span className="text-gray-300">${availableBorrowUSD.toFixed(4)}</span></div>
              {borrowAmount && parseFloat(borrowAmount) > 0 && (
                <div className="flex justify-between text-sm border-t border-[#2a2a3a] pt-2">
                  <span className="text-gray-500">New Health Factor</span>
                  <span className={hfColor(previewHF)}>
                    {previewHF !== null && previewHF <= 100 ? previewHF.toFixed(2) : "—"}
                  </span>
                </div>
              )}
            </div>
            {borrowRisk && (
              <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-xs ${borrowLiqRisk ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"}`}>
                <AlertTriangle size={14} />
                {borrowLiqRisk ? "This borrow would risk liquidation!" : "Health factor would drop below 1.2."}
              </div>
            )}
            <button onClick={handleBorrow} disabled={!borrowAmount || parseFloat(borrowAmount) === 0 || borrowLiqRisk || submitting} className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-[#2a2a3a] disabled:text-gray-500 text-white font-semibold transition-colors min-h-[52px]">
              {submitting ? "Borrowing..." : borrowLiqRisk ? "Borrowing would risk liquidation" : `Borrow ${borrowModal.symbol}`}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-sm w-[calc(100%-2rem)] ${toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-300" : toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-blue-500/10 border-blue-500/30 text-blue-300"}`}>
          {toast.type === "pending" && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
          {toast.type === "success" && <CheckCircle size={16} className="flex-shrink-0" />}
          {toast.type === "error" && <AlertTriangle size={16} className="flex-shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          {toast.txHash && <a href={`${ARC_EXPLORER}/tx/${toast.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs opacity-70 hover:opacity-100 flex-shrink-0 flex items-center gap-1">View <ExternalLink size={10} /></a>}
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
