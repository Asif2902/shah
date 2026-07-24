/**
 * Token list for ArcFlow Finance.
 * For Arc AppKit swap, only USDC, EURC, and cirBTC are supported on Arc Testnet.
 * The `appKitSymbol` field maps to the Arc AppKit token identifier.
 */
export type Token = {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  logoLetter: string;
  /** Official token logo URL. If present, rendered as an <img>; falls back to letter avatar. */
  logoUrl?: string;
  /** Arc AppKit swap token identifier. Undefined if not swappable via AppKit. */
  appKitSymbol?: string;
};

export const TOKEN_LIST: Token[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    logoLetter: "U",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    appKitSymbol: "USDC",
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
    logoLetter: "E",
    logoUrl: "https://assets.coingecko.com/coins/images/26045/small/euro-coin.png",
    appKitSymbol: "EURC",
  },
  {
    symbol: "cirBTC",
    name: "Circle Bitcoin",
    address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
    decimals: 8,
    logoLetter: "B",
    logoUrl: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    appKitSymbol: "cirBTC",
  },
];

/** Tokens supported for swap via Arc AppKit on Arc Testnet */
export const SWAPPABLE_TOKENS = TOKEN_LIST.filter((t) => !!t.appKitSymbol);

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKEN_LIST.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
}

export function getTokenByAddress(address: string): Token | undefined {
  return TOKEN_LIST.find((t) => t.address.toLowerCase() === address.toLowerCase());
}
