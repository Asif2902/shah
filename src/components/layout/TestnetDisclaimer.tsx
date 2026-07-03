"use client";

import { useState, useEffect } from "react";
import { X, FlaskConical } from "lucide-react";

const STORAGE_KEY = "arcflow_testnet_disclaimer_dismissed";

export function TestnetDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
      <div className="bg-[#13131a] border border-yellow-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="mt-0.5 text-yellow-400 flex-shrink-0">
          <FlaskConical size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-300">Testnet — Not real money</p>
          <p className="text-xs text-gray-400 mt-0.5">
            ArcFlow Finance is running on Arc Testnet. All tokens are test tokens with no real value.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-500 hover:text-white transition-colors p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
