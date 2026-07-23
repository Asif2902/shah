"use client";

import { useState } from "react";
import { getTokenBySymbol } from "@/lib/tokenList";

const TOKEN_COLORS: Record<string, string> = {
  U: "bg-blue-500",
  W: "bg-indigo-500",
  B: "bg-orange-500",
  T: "bg-green-500",
  D: "bg-yellow-500",
  L: "bg-blue-600",
  A: "bg-sky-500",
  N: "bg-pink-500",
  E: "bg-indigo-400",
};

interface TokenLogoProps {
  symbol: string;
  size?: number;
}

export function TokenLogo({ symbol, size = 32 }: TokenLogoProps) {
  const token = getTokenBySymbol(symbol);
  const logoUrl = token?.logoUrl;
  const letter = symbol.charAt(0).toUpperCase();
  const colorClass = TOKEN_COLORS[letter] || "bg-gray-500";

  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={symbol}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`${colorClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {letter}
    </div>
  );
}
