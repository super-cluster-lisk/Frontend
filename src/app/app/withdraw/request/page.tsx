"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  Info,
  Clock,
  Zap,
  Shield,
  TrendingDown,
  Copy,
  Check,
  FileText,
  Settings,
  CheckCircle2,
  Clock10Icon,
  Wallet,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";

import { NETWORK_INFO } from "@/services/web3/contracts/addresses";
import { useWithdrawRequests } from "../hooks/withdrawRequest";
import { useWithdrawActions } from "../hooks/ActionWithdraw";
import { useWithdrawalBalances } from "@/hooks/useTokenBalance";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Ready to be claimed";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}h ${hours}j`;
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"superCluster" | "dex">(
    "superCluster"
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTab = pathname === "/withdrawals/claim" ? "claim" : "request";

  const { open } = useWeb3Modal();
  const { address, isConnected, isConnecting } = useAccount();

  // custom hooks
  const {
    usdcFormatted,
    sTokenFormatted,
    refetchAll: refetchBalances,
  } = useWithdrawalBalances();

  const {
    isLoading: isLoadingRequests,
    fetchRequests,
    readyToClaimCount,
    pendingRequestsCount,
    claimedCount,
    totalClaimableAmount,
    totalPendingAmount,
    displayRequests,
  } = useWithdrawRequests();

  const {
    requestWithdraw,
    isSubmitting,
    requestError,
    requestTxHash,
    latestRequestId,
    claimWithdraw,
    claimingId,
    claimError,
  } = useWithdrawActions();

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "claim" && address) {
      fetchRequests();
    }
  }, [activeTab, address, fetchRequests]);

  const handleTabChange = (tab: "request" | "claim") => {
    router.push(`/withdrawals/${tab}`);
  };

  const handleMaxClick = () => {
    const numValue = parseFloat(sTokenFormatted || "0");
    setAmount(numValue.toFixed(4));
  };

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected) {
      await handleConnect();
      return;
    }

    if (selectedMethod !== "superCluster") {
      return;
    }

    const loadingToast = toast.loading("Waiting for wallet confirmation...");

    try {
      await requestWithdraw(amount);
      toast.success("Withdrawal request submitted successfully!", {
        id: loadingToast,
      });
      setAmount("");
      await Promise.all([fetchRequests(), refetchBalances()]);
    } catch (error) {
      console.error("Withdrawal error:", error);

      // Check if user rejected the transaction
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isUserRejection =
        errorMessage.includes("User denied") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected");

      if (isUserRejection) {
        // Silently dismiss the loading toast
        toast.dismiss(loadingToast);
      } else {
        // Show error toast for real errors
        toast.error(errorMessage || "Failed to submit withdrawal request", {
          id: loadingToast,
        });
      }
    }
  };
  const handleClaim = async (id: bigint) => {
    const loadingToast = toast.loading("Waiting for wallet confirmation...");

    try {
      await claimWithdraw(id);
      toast.success("USDC claimed successfully!", {
        id: loadingToast,
      });
      await Promise.all([fetchRequests(), refetchBalances()]);
    } catch (error) {
      console.error("Claim error:", error);

      // Check if user rejected the transaction
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isUserRejection =
        errorMessage.includes("User denied") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected");

      if (isUserRejection) {
        // Silently dismiss the loading toast
        toast.dismiss(loadingToast);
      } else {
        // Show error toast for real errors
        toast.error(errorMessage || "Failed to claim USDC", {
          id: loadingToast,
        });
      }
    }
  };

  const requestExplorerUrl =
    requestTxHash && NETWORK_INFO.explorer
      ? `${NETWORK_INFO.explorer}/tx/${requestTxHash}`
      : null;

  const faqItems = [
    {
      question:
        "What are the risks of engaging with the superCluster protocol?",
      answer:
        "The superCluster protocol carries smart contract risk, slashing risk, and other DeFi-related risks. Our protocol has been audited by multiple security firms, and we maintain insurance coverage to mitigate these risks.",
      icon: Shield,
    },
    {
      question: "What are withdrawals?",
      answer:
        "Withdrawals allow you to exchange your sUSDC/wsUSDC back to ETH after a waiting period. You can choose between using superCluster's withdrawal queue or swapping on DEXs for instant liquidity.",
      icon: Info,
    },
    {
      question: "How long does withdrawal take?",
      answer:
        "Withdrawal time depends on the exit queue and can range from 1-5 days to several weeks when using superCluster. For instant withdrawals, you can use DEXs with minimal slippage.",
      icon: Clock,
    },
    {
      question:
        "What is the difference between superCluster and DEX withdrawals?",
      answer:
        "superCluster withdrawals provide 1:1 rate but require waiting time. DEX withdrawals are instant but may have slight slippage depending on market conditions.",
      icon: TrendingDown,
    },
  ];

  return (
    <div className="min-h-screen text-white pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Request Withdrawals
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Submit your sUSDC/wsUSDC withdrawal request and claim your USDC
            through the superCluster queue.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            {/* Tab selector */}
            <div className="relative mb-6">
              <div className="flex gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
                <button
                  onClick={() => handleTabChange("request")}
                  className={`flex-1 relative py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === "request"
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {activeTab === "request" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl" />
                  )}
                  <span className="relative z-10">Request</span>
                </button>
                <button
                  onClick={() => handleTabChange("claim")}
                  className={`flex-1 relative py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === "claim"
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {activeTab === "claim" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl" />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Claim
                  </span>
                </button>
              </div>
            </div>

            {activeTab === "request" ? (
              <>
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm mb-6">
                  {/* amount */}
                  <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-2 block">
                      Amount to be withdrawn
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-blue-500/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Image
                            src="/susdc.png"
                            alt="sUSDC"
                            width={48}
                            height={48}
                            className="flex-shrink-0 rounded-full"
                          />
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={!isConnected || isSubmitting}
                            className="bg-transparent border-none text-3xl font-semibold focus-visible:ring-0 p-1 h-auto text-white placeholder:text-slate-600 min-w-0 disabled:opacity-60"
                          />
                        </div>
                        <button
                          onClick={handleMaxClick}
                          disabled={!isConnected || isSubmitting}
                          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* method */}
                  <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-3 block">
                      Withdrawal method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedMethod("superCluster")}
                        disabled={!isConnected || isSubmitting}
                        className={`p-5 rounded-2xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedMethod === "superCluster"
                            ? "border-blue-500 bg-blue-900/20"
                            : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-white">
                              superCluster Queue
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedMethod === "superCluster"
                                ? "border-blue-400"
                                : "border-slate-500"
                            }`}
                          >
                            {selectedMethod === "superCluster" && (
                              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Rate:</span>
                            <span className="text-white font-medium">
                              1 : 1
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Estimated duration:
                            </span>
                            <span className="text-white font-medium">
                              3–10 days
                            </span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedMethod("dex")}
                        disabled
                        className="p-5 rounded-2xl border-2 border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-cyan-400" />
                            <span className="font-semibold text-white">
                              DEX Instant (Coming Soon)
                            </span>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                        </div>
                        <p className="text-sm text-slate-400">
                          Instant swaps via DEX with third-party liquidity. This
                          feature is not yet available.
                        </p>
                      </button>
                    </div>
                  </div>

                  {isConnected && address && (
                    <div className="mb-6 p-5 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-2xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-slate-400 font-medium">
                              sUSDC balance
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {sTokenFormatted}
                            sUSDC
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-slate-400 font-medium block">
                            Wallet address
                          </span>
                          <button
                            onClick={handleCopyAddress}
                            className="flex items-center gap-2 text-sm font-mono text-white hover:text-blue-400 transition-colors group"
                          >
                            <span>{`${address.slice(0, 6)}...${address.slice(
                              -4
                            )}`}</span>
                            {copied ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-slate-400 font-medium">
                              My requests
                            </span>
                          </div>
                          <TooltipProvider>
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-help">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span className="text-2xl font-bold text-white">
                                      {readyToClaimCount
                                        .toString()
                                        .padStart(2, "0")}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-700">
                                  <p className="text-sm text-white font-medium">
                                    Ready to claim
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Complete the claim in the Claim tab
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <div className="h-8 w-px bg-slate-600" />

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-help">
                                    <Clock10Icon className="w-5 h-5 text-amber-400" />
                                    <span className="text-2xl font-bold text-white">
                                      {pendingRequestsCount
                                        .toString()
                                        .padStart(2, "0")}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-700">
                                  <p className="text-sm text-white font-medium">
                                    Waiting
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    In the operator queue
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-slate-400 font-medium">
                              Withdrawal mode
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-cyan-400">
                              Queue
                            </span>
                            <div className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs font-semibold text-cyan-400">
                              STANDARD
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-2 block">
                      You will receive
                    </label>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Image
                          src="/usdc.png"
                          alt="USDC"
                          width={48}
                          height={48}
                          className="flex-shrink-0"
                        />
                        <div className="text-3xl font-semibold text-white truncate">
                          {amount || "0.0000"} USDC
                        </div>
                      </div>
                    </div>
                  </div>

                  {requestError && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  {latestRequestId && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>
                          Withdrawal request successfully created. Request ID:{" "}
                          <span className="font-semibold">
                            #{latestRequestId}
                          </span>
                        </p>
                        <p>
                          Monitor the status in the tab{" "}
                          <button
                            className="underline font-medium"
                            onClick={() => handleTabChange("claim")}
                          >
                            Claim
                          </button>
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  {requestTxHash && requestExplorerUrl && (
                    <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
                      <ExternalLink className="w-4 h-4" />
                      <Link
                        href={requestExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-slate-200"
                      >
                        View transactions in the explorer
                      </Link>
                    </div>
                  )}

                  {isConnected ? (
                    <Button
                      onClick={handleWithdraw}
                      disabled={
                        isSubmitting || !amount || Number(amount.trim()) <= 0
                      }
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isSubmitting ? "Processing..." : "Request Withdrawal"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  )}

                  <div className="mt-6 space-y-3 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Withdrawal mode</span>
                      <span className="text-green-400 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Network fee</span>
                      <span className="text-white font-medium">~$0.20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        Time estimate
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-700">
                              <p className="text-xs text-slate-200">
                                Times may vary depending on queue conditions and
                                operator actions.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      <span className="text-white font-medium">3–10 days</span>
                    </div>
                  </div>
                </div>

                {/* Info card */}
                <div className="p-5 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        How does the withdrawal process work?
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        After the request is made, the operator will withdraw
                        liquidity from the pilot and fund the Withdraw Manager
                        contract. When the status changes to ready, you can make
                        a claim to receive USDC.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : isConnected ? (
              <>
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">
                        Your withdrawal request
                      </h2>
                      <p className="text-sm text-slate-400">
                        Claim USDC when the request has been finalized by the
                        operator.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-slate-800/70 border border-slate-700 px-4 py-2 text-sm text-slate-300">
                        USDC Balance:{" "}
                        {parseFloat(usdcFormatted || "0").toFixed(4)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchRequests}
                        className="border border-slate-700 hover:bg-slate-800"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {claimError && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{claimError}</span>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">
                          Withdrawal summary
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400 block">
                              Total ready to claim
                            </span>
                            <span className="text-white font-semibold text-lg">
                              {totalClaimableAmount} USDC
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">
                              Total waiting
                            </span>
                            <span className="text-white font-semibold text-lg">
                              {parseFloat(totalPendingAmount || "0").toFixed(4)}{" "}
                              sUSDC
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">
                              Ready-to-claim requests
                            </span>
                            <span className="text-white font-semibold text-lg">
                              {readyToClaimCount.toString().padStart(2, "0")}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">
                              Completed requests
                            </span>
                            <span className="text-white font-semibold text-lg">
                              {claimedCount.toString().padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isLoadingRequests ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
                      Loading withdrawal request...
                    </div>
                  ) : displayRequests.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-2xl flex items-center justify-center">
                        <Clock className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No requests yet
                      </h3>
                      <p className="text-sm text-slate-400">
                        Submit your withdrawal request in the Request tab first.
                        Once the operator has processed it, you can make your
                        claim here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayRequests.map((request) => (
                        <div
                          key={request.id.toString()}
                          className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide">
                                <FileText className="w-4 h-4" />
                                Request #{request.id.toString()}
                              </div>
                              <div className="mt-2 text-xl font-semibold text-white">
                                {parseFloat(
                                  request.sAmountFormatted || "0"
                                ).toFixed(4)}{" "}
                                sUSDC
                                <span className="text-sm font-normal text-slate-400 ml-2">
                                  ↔{" "}
                                  {parseFloat(
                                    request.baseAmountFormatted || "0"
                                  ).toFixed(4)}{" "}
                                  USDC
                                </span>
                              </div>
                            </div>
                            <div>
                              {request.status === "ready" && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/15 text-green-300 text-xs font-medium border border-green-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Ready to claim
                                </span>
                              )}
                              {request.status === "pending" && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 text-xs font-medium border border-amber-500/30">
                                  <Clock className="w-3.5 h-3.5" />
                                  Waiting for the operator
                                </span>
                              )}
                              {request.status === "finalizing" && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-200 text-xs font-medium border border-cyan-500/30">
                                  <Clock className="w-3.5 h-3.5" />
                                  Processed
                                </span>
                              )}
                              {request.status === "claimed" && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/20 text-slate-200 text-xs font-medium border border-slate-500/30">
                                  <Check className="w-3.5 h-3.5" />
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300 mb-4">
                            <div>
                              <span className="text-slate-400 block">
                                Requested on
                              </span>
                              <span className="text-white font-medium">
                                {new Date(
                                  request.requestedAtMs
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">
                                Ready estimate
                              </span>
                              <span className="text-white font-medium">
                                {request.availableAtMs > 0
                                  ? new Date(
                                      request.availableAtMs
                                    ).toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">
                                Remaining time
                              </span>
                              <span className="text-white font-medium">
                                {request.status === "ready" ||
                                request.status === "claimed"
                                  ? "Ready to claim"
                                  : formatCountdown(request.secondsToUnlock)}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                              <span>Progress</span>
                              <span className="text-white font-medium">
                                {request.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                                style={{ width: `${request.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-xs text-slate-400">
                              ID request: {request.id.toString()}
                            </div>
                            {request.status === "ready" && (
                              <Button
                                onClick={() => handleClaim(request.id)}
                                disabled={claimingId === request.id.toString()}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {claimingId === request.id.toString()
                                  ? "Processing..."
                                  : "Claim USDC"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 backdrop-blur-sm text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-slate-400 mb-8">
                  Connect your wallet to view and claim withdrawal requests
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-500/25"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-2xl font-bold mb-6 text-white">
                Common Questions
              </h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => {
                  const Icon = item.icon;
                  const isOpen = expandedFaq === index;
                  return (
                    <div
                      key={item.question}
                      className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-slate-700 transition-colors"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">
                            {item.question}
                          </span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-slate-300">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
