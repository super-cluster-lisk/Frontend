"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  Droplets,
  Info,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useUSDCBalance } from "@/hooks/useTokenBalance";
import {
  CONTRACTS,
  NETWORK_INFO,
  isBaseSepolia,
} from "@/services/web3/contracts/addresses";
import { FAUCET_ABI } from "@/services/web3/contracts/abis/Faucet";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "shortMessage" in error &&
    typeof (error as { shortMessage: unknown }).shortMessage === "string"
  ) {
    return (error as { shortMessage: string }).shortMessage;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Failed to request tokens. Please try again.";
}

function formatAddress(address?: string | null) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function FaucetPage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { open } = useWeb3Modal();
  const { isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { formatted: usdcBalance, refetch } = useUSDCBalance();

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: faucetTokenAddress } = useReadContract({
    address: CONTRACTS.faucet,
    abi: FAUCET_ABI,
    functionName: "usdc",
  });

  const formattedTokenAddress = useMemo(() => {
    return typeof faucetTokenAddress === "string"
      ? faucetTokenAddress
      : undefined;
  }, [faucetTokenAddress]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      await open();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  };

  const handleCopyAddress = () => {
    if (!formattedTokenAddress) return;

    navigator.clipboard.writeText(formattedTokenAddress).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRequestTokens = async () => {
    if (!isConnected) {
      await handleConnect();
      return;
    }

    if (!isBaseSepolia(chainId)) {
      const message = "Please switch to Base Sepolia to use the faucet.";
      setError(message);
      toast.error(message);
      return;
    }

    let toastId: string | undefined;
    try {
      setError(null);
      setIsRequesting(true);
      setTxHash(null);
      toastId = toast.loading("Requesting test USDC from faucet...");

      const hash = await writeContractAsync({
        address: CONTRACTS.faucet,
        abi: FAUCET_ABI,
        functionName: "requestTokens",
      });

      setTxHash(hash);
      await publicClient?.waitForTransactionReceipt({ hash });
      await refetch?.();
      toast.success("Mock USDC has been sent to your wallet!", {
        id: toastId,
      });
    } catch (err) {
      console.error("Faucet request failed", err);
      const message = getErrorMessage(err);
      setError(message);
      if (toastId) {
        toast.error(message, { id: toastId });
      } else {
        toast.error(message);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const explorerUrl =
    txHash && NETWORK_INFO.explorer
      ? `${NETWORK_INFO.explorer}/tx/${txHash}`
      : null;

  return (
    <div className="min-h-screen pb-16 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Request Mock USDC for Testing
          </h1>

          <p className="text-slate-300 max-w-2xl mx-auto text-base">
            Use this faucet to mint a small amount of Mock USDC on Base Sepolia.
            These tokens are for development only and help you test the staking
            and withdrawal flow without real funds.
          </p>
        </header>

        <section className="grid lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Faucet Status
                  </h2>
                  <p className="text-sm text-slate-400">
                    Connected wallet will receive Mock USDC on Base Sepolia.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-800/70 border border-slate-700 px-4 py-2 text-sm text-slate-300">
                    Network: {NETWORK_INFO.name}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    Wallet USDC Balance
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {usdcBalance} USDC
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide">
                    <RefreshCw className="w-4 h-4 text-cyan-300" />
                    Faucet Token
                  </div>
                  <div className="mt-2 text-sm text-slate-200 font-mono">
                    {formattedTokenAddress ? (
                      <button
                        onClick={handleCopyAddress}
                        className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors"
                      >
                        {formatAddress(formattedTokenAddress)}
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-70" />
                        )}
                      </button>
                    ) : (
                      "Loading..."
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {txHash && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Tokens requested successfully.</p>
                    {explorerUrl && (
                      <Link
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-emerald-100"
                      >
                        View transaction
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="grid gap-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-white">
                        Connect your wallet
                      </p>
                      <p className="text-slate-400">
                        Use Base Sepolia network. Switching is required before
                        requesting tokens.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-white">
                        Request Mock USDC
                      </p>
                      <p className="text-slate-400">
                        Each call mints a fixed batch of Mock USDC to your
                        wallet for testing.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-white">
                        Start staking in SuperCluster
                      </p>
                      <p className="text-slate-400">
                        {" Use the newly minted tokens on the"}
                        <Link
                          href="/app/deposit"
                          className="text-cyan-300 hover:text-cyan-200 underline"
                        >
                          Deposit
                        </Link>
                        {"  page to test pilots and strategies."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  {isConnected ? (
                    <Button
                      onClick={handleRequestTokens}
                      disabled={isRequesting}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isRequesting ? "Requesting..." : "Get Test USDC"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                    >
                      Connect Wallet
                    </Button>
                  )}

                  <p className="text-xs text-slate-500 text-center sm:text-left">
                    Faucet usage is rate-limited to prevent abuse. Use only for
                    development.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-300" />
                <h3 className="text-lg font-semibold text-white">
                  Why do I need Mock USDC?
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                SuperCluster’s staking flow uses USDC as the underlying asset.
                On testnet, this faucet distributes a token-compatible mock so
                you can simulate deposits, pilot allocation, and withdrawals
                without risking real funds.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
              <h3 className="text-lg font-semibold text-white mb-3">
                Need more information?
              </h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>
                  • Switch network in your wallet to{" "}
                  <span className="text-white font-medium">
                    Base Sepolia (Chain ID 84532)
                  </span>
                </li>
                <li>
                  • Each wallet can request tokens periodically as determined by
                  the contract.
                </li>
                <li>
                  • Tokens are purely for testing and have no real-world value.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
