import { createConfig, http } from "wagmi";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import type { Chain } from "viem";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID is not set");
}

// Dynamic chain configuration from environment variables
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "");
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "";
const blockExplorerName = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_NAME || "";
const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "";

// Use proxy in production to avoid CORS issues
const isProduction =
  typeof window !== "undefined" && window.location.hostname !== "localhost";
const effectiveRpcUrl = isProduction
  ? `${window.location.origin}/api/rpc`
  : rpcUrl;

export const defaultChain = {
  id: chainId,
  name: chainName,
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: [effectiveRpcUrl] },
    public: { http: [effectiveRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: blockExplorerName,
      url: blockExplorerUrl,
    },
  },
  testnet: true,
} as const satisfies Chain;

export const config = createConfig({
  chains: [defaultChain],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "SuperCluster" }),
  ],
  transports: {
    [defaultChain.id]: http(),
  },
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  defaultChain: defaultChain,
  themeVariables: {
    "--w3m-accent": "#3b82f6",
  },
});

export { projectId };
