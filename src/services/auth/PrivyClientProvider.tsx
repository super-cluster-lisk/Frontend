"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

type Props = {
  children: React.ReactNode;
};

export default function PrivyClientProvider({ children }: Props) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string | undefined;

  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "");
  const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || "";
  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK || "";
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "";
  const blockExplorerName = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_NAME || "";
  const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "";

  if (!appId) {
    return <>{children}</>;
  }

  const chainConfig = {
    id: chainId,
    name: chainName,
    network: chainNetwork,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: blockExplorerName,
        url: blockExplorerUrl,
      },
    },
  };

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: chainConfig,
        supportedChains: [chainConfig],
        appearance: { theme: "dark" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
