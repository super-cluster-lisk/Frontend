import { createConfig, http } from "wagmi";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import type { Chain } from "viem";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID is not set");
}

// Base Sepolia - Only network we support
export const baseSepolia = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
    public: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: {
      name: "Base Sepolia Explorer",
      url: "https://sepolia.basescan.org",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "SuperCluster" }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  defaultChain: baseSepolia,
  themeVariables: {
    "--w3m-accent": "#3b82f6",
  },
});

export { projectId };
