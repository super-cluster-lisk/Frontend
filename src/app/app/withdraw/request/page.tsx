"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertTriangle, ExternalLink, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";

import { NETWORK_INFO } from "@/services/web3/contracts/addresses";
import { useWithdrawRequests } from "../hooks/withdrawRequest";
import { useWithdrawActions } from "../hooks/ActionWithdraw";
import { useWithdrawalBalances } from "@/hooks/useTokenBalance";

// Component imports
import WithdrawHeader from "@/components/app/Withdrawals/Header";
import TabSelector from "@/components/app/Withdrawals/TabSelector";
import WithdrawCard from "@/components/app/Withdrawals/WithdrawCard";
import ActionButton from "@/components/app/Withdrawals/ActionButton";
import RequestsList from "@/components/app/Withdrawals/RequestsList";
import { FaqSidebar } from "@/components/app/Withdrawals/FaqSidebar";

export default function WithdrawalsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"superCluster" | "dex">(
    "superCluster"
  );
  const [copied, setCopied] = useState(false);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTab = pathname === "/app/withdraw/claim" ? "claim" : "request";

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
    const timeout = copyTimeoutRef.current;
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "claim" && address) {
      fetchRequests();
    }
  }, [activeTab, address, fetchRequests]);

  const handleTabChange = (tab: "request" | "claim") => {
    router.push(`/app/withdraw/${tab}`);
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
    },
    {
      question: "What are withdrawals?",
      answer:
        "Withdrawals allow you to exchange your sUSDC/wsUSDC back to ETH after a waiting period. You can choose between using superCluster's withdrawal queue or swapping on DEXs for instant liquidity.",
    },
    {
      question: "How long does withdrawal take?",
      answer:
        "Withdrawal time depends on the exit queue and can range from 1-5 days to several weeks when using superCluster. For instant withdrawals, you can use DEXs with minimal slippage.",
    },
    {
      question:
        "What is the difference between superCluster and DEX withdrawals?",
      answer:
        "superCluster withdrawals provide 1:1 rate but require waiting time. DEX withdrawals are instant but may have slight slippage depending on market conditions.",
    },
  ];

  return (
    <div className="min-h-screen py-20 text-white pb-24">
      <div className="max-w-7xl mx-auto">
        <WithdrawHeader activeTab={activeTab} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TabSelector activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === "request" ? (
              <>
                <WithdrawCard
                  amount={amount}
                  setAmount={setAmount}
                  isConnected={isConnected}
                  isSubmitting={isSubmitting}
                  sTokenFormatted={sTokenFormatted}
                  selectedMethod={selectedMethod}
                  setSelectedMethod={setSelectedMethod}
                  handleMaxClick={handleMaxClick}
                  address={address}
                  copied={copied}
                  handleCopyAddress={handleCopyAddress}
                  readyToClaimCount={readyToClaimCount}
                  pendingRequestsCount={pendingRequestsCount}
                  totalClaimableAmount={totalClaimableAmount}
                >
                  {requestError && (
                    <div className="mb-4 flex items-start gap-3 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  {latestRequestId && (
                    <div className="mb-4 flex items-start gap-3 rounded border border-white/10 bg-white/0 px-4 py-3 text-sm text-white">
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

                  <ActionButton
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    isSubmitting={isSubmitting}
                    amount={amount}
                    selectedMethod={selectedMethod}
                    onWithdraw={handleWithdraw}
                    onConnect={handleConnect}
                  />
                </WithdrawCard>
              </>
            ) : isConnected ? (
              <RequestsList
                displayRequests={displayRequests}
                claimingId={claimingId}
                handleClaim={handleClaim}
                isLoadingRequests={isLoadingRequests}
                usdcFormatted={usdcFormatted}
                fetchRequests={fetchRequests}
                claimError={claimError}
                readyToClaimCount={readyToClaimCount}
                totalClaimableAmount={totalClaimableAmount}
                totalPendingAmount={totalPendingAmount}
                claimedCount={claimedCount}
              />
            ) : (
              <div className="bg-white/10 border border-white/10 rounded p-12 backdrop-blur-sm text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl text-slate-200 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-slate-400 mb-8">
                  Connect your wallet to view and claim withdrawal requests
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="primary-button text-white font-bold h-12 px-8 rounded"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}
          </div>

          <FaqSidebar items={faqItems} />
        </div>
      </div>
    </div>
  );
}
