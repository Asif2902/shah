import type { EIP1193Provider } from "viem";

type EIP6963ProviderDetail = {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: EIP1193Provider;
};

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<EIP6963ProviderDetail>;
  }
}

/**
 * Discovers injected browser wallets via EIP-6963 instead of grabbing
 * window.ethereum directly — the pattern docs.arc.io/app-kit/tutorials/adapter-setups
 * recommends, since window.ethereum silently picks whichever extension last
 * clobbered it when multiple wallets are installed.
 */
export async function getInjectedWalletProvider(requiredRdns?: string): Promise<EIP1193Provider> {
  const providers = new Map<string, EIP6963ProviderDetail>();

  const onAnnounce = ((event: CustomEvent<EIP6963ProviderDetail>) => {
    providers.set(event.detail.info.uuid, event.detail);
  }) as EventListener;

  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);

  const provider = requiredRdns
    ? [...providers.values()].find(({ info }) => info.rdns === requiredRdns)?.provider
    : [...providers.values()][0]?.provider;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!provider && (window as any).ethereum) {
    // Fall back to window.ethereum for wallets that don't support EIP-6963 yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).ethereum;
  }

  if (!provider) {
    throw new Error("No wallet provider found. Please install MetaMask.");
  }

  return provider;
}
