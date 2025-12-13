"use client";

import { AlertTriangle, Check, Copy } from "lucide-react";
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
    <div className="min-h-screen py-20 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-2xl md:text-4xl mb-2">
            Request Mock USDC for Testing
          </h1>
          <p className="text-md text-slate-400 max-w-2xl mx-auto mb-8">
            Use this faucet to mint a small amount of Mock USDC on Base Sepolia.
          </p>
        </header>

        <section className="grid lg:grid-cols-[1fr] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-white/10 border border-white/10 rounded p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-300">
                    Faucet Status
                  </h2>
                  <p className="text-sm text-slate-400">
                    Connected wallet will receive Mock USDC on Base Sepolia.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded bg-white/5 border border-white/10 px-4 py-3 text-sm text-slate-300">
                    Network: {NETWORK_INFO.name}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400 tracking-wide">
                    Wallet USDC Balance
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-200">
                    {usdcBalance} USDC
                  </div>
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400 tracking-wide">
                    Faucet Token
                  </div>
                  <div className="mt-2 text-sm text-slate-200 font-mono">
                    {formattedTokenAddress ? (
                      <button
                        onClick={handleCopyAddress}
                        className="inline-flex items-center gap-2 text-slate-200 hover:text-slate-400 transition-colors"
                      >
                        {formatAddress(formattedTokenAddress)}
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-slate-200" />
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

              <div className="rounded border border-white/10 bg-white/2 p-5">
                <div className="grid gap-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-white/2 text-slate-200 text-sm border border-white/10">
                      1
                    </span>
                    <div>
                      <p className="text-slate-200">Connect your wallet</p>
                      <p className="text-slate-400">
                        Use Base Sepolia network. Switching is required before
                        requesting tokens.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-white/2 text-slate-200 text-sm border border-white/10">
                      2
                    </span>
                    <div>
                      <p className="text-slate-200">Request Mock USDC</p>
                      <p className="text-slate-400">
                        Each call mints a fixed batch of Mock USDC to your
                        wallet for testing.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-white/2 text-slate-200 text-sm border border-white/10">
                      3
                    </span>
                    <div>
                      <p className="text-slate-200">
                        Start staking in SuperCluster
                      </p>
                      <p className="text-slate-400">
                        {" Use the newly minted tokens on the"}
                        <Link
                          href="/app/deposit"
                          className=" text-[#0b84ba] hover:text-[#0973a3] underline"
                        >
                          Deposit
                        </Link>
                        {"  page to test pilots and strategies."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                {isConnected ? (
                  <Button
                    onClick={handleRequestTokens}
                    disabled={isRequesting}
                    className="w-full primary-button text-white cursor-pointer px-6 py-3 h-16 text-md font-semibold rounded transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? "Requesting..." : "Get Test USDC"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnect}
                    className="w-full primary-button text-white cursor-pointer px-6 py-3 h-16 text-md font-semibold rounded transition-all"
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
              <aside className="space-y-4 mt-6">
                <div className="rounded p-8 bg-white/0 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-slate-300">
                      Why do I need Mock USDC?
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    SuperCluster’s staking flow uses USDC as the underlying
                    asset. On testnet, this faucet distributes a
                    token-compatible mock so you can simulate deposits, pilot
                    allocation, and withdrawals without risking real funds.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
