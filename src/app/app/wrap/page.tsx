"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { getSimplifiedError } from "@/services/web3/utils/getSimplifiedError";
import { useSTokenBalance, useWsTokenBalance } from "@/hooks/useTokenBalance";
import { useWrapping } from "@/hooks/useWrapping";

import toast from "react-hot-toast";

// Component imports
import WrapHeader from "@/components/app/Wrap/Header";
import TabSelector from "@/components/app/Wrap/TabSelector";
import ConversionCard from "@/components/app/Wrap/ConversionCard";
import WalletInfo from "@/components/app/Wrap/WalletInfo";
import ActionButton from "@/components/app/Wrap/ActionButton";
import { FaqSidebar } from "@/components/app/Wrap/FaqSidebar";

export default function SuperClusterWrapUnwrap() {
  const router = useRouter();
  const pathname = usePathname();
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const { open } = useWeb3Modal();
  const { address, isConnected, isConnecting } = useAccount();

  const { formatted: sUSDCBalance, refetch: refetchSToken } =
    useSTokenBalance();
  const {
    formatted: wsUSDCBalance,
    formattedConversionRate,
    refetch: refetchWsToken,
  } = useWsTokenBalance();

  const { wrap, unwrap, isSubmitting, error, resetError } = useWrapping();

  const activeTab = pathname === "/app/wrap/unwrap" ? "unwrap" : "wrap";

  const handleTabChange = (tab: string) => {
    if (tab === "wrap") {
      router.push("/app/wrap");
    } else {
      router.push("/app/wrap/unwrap");
    }
  };
  const handleMaxClick = () => {
    if (activeTab === "wrap" && sUSDCBalance) {
      setAmount(sUSDCBalance.replace(/,/g, ""));
    } else if (activeTab === "unwrap" && wsUSDCBalance) {
      setAmount(wsUSDCBalance.replace(/,/g, ""));
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    try {
      resetError();
      await open();
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const getButtonState = () => {
    if (!isConnected) {
      return { disabled: false, text: "Connect Wallet" };
    }

    if (!amount || parseFloat(amount) <= 0) {
      return {
        disabled: true,
        text: activeTab === "wrap" ? "Enter Amount" : "Enter Amount",
      };
    }

    const inputAmount = parseFloat(amount);
    const maxBalance =
      activeTab === "wrap"
        ? parseFloat(sUSDCBalance?.replace(/,/g, "") || "0")
        : parseFloat(wsUSDCBalance?.replace(/,/g, "") || "0");

    if (inputAmount > maxBalance) {
      return {
        disabled: true,
        text: "Insufficient Balance",
      };
    }

    if (isSubmitting) {
      return {
        disabled: true,
        text: activeTab === "wrap" ? "Wrapping..." : "Unwrapping...",
      };
    }

    return {
      disabled: false,
      text: activeTab === "wrap" ? "Wrap sUSDC" : "Unwrap wsUSDC",
    };
  };

  const buttonState = getButtonState();

  const handleWrap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const actionText = activeTab === "wrap" ? "Wrapping" : "Unwrapping";
    const toastId = toast.loading(`Waiting for wallet confirmation...`);

    try {
      if (activeTab === "wrap") {
        await wrap(amount);
      } else {
        await unwrap(amount);
      }

      const successActionText = activeTab === "wrap" ? "Wrap" : "Unwrap";
      toast.success(`${successActionText} successful! Refreshing balance...`, {
        id: toastId,
      });

      setAmount("");
      setTimeout(() => {
        refetchSToken();
        refetchWsToken();
      }, 2000);
    } catch (err: unknown) {
      const simplifiedError = getSimplifiedError(err);
      toast.error(simplifiedError, { id: toastId });
      console.error(`${actionText} failed:`, err);
    }
  };

  const calculateWrapReceive = () => {
    if (!amount || !formattedConversionRate) return "0.0000";
    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(formattedConversionRate.replace(/,/g, ""));
    if (rateNum === 0) return "0.0000";
    return (amountNum / rateNum).toFixed(4);
  };

  const calculateUnwrapReceive = () => {
    if (!amount || !formattedConversionRate) return "0.0000";
    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(formattedConversionRate.replace(/,/g, ""));
    return (amountNum * rateNum).toFixed(4);
  };

  const wrapDetails = {
    youWillReceive: calculateWrapReceive(),
    maxUnlockCost: "~$0.25",
    maxTransactionCost: "~$0.59",
    exchangeRate: `1 sUSDC = ${
      formattedConversionRate
        ? (1 / parseFloat(formattedConversionRate.replace(/,/g, ""))).toFixed(4)
        : "0.0000"
    } wsUSDC`,
    allowance: "-",
  };

  const unwrapDetails = {
    youWillReceive: calculateUnwrapReceive(),
    maxTransactionCost: "~$0.56",
    exchangeRate: `1 wsUSDC = ${formattedConversionRate || "0.0000"} sUSDC`,
  };

  const faqItems = [
    {
      question:
        "What are the risks of engaging with the superCluster protocol?",
      answer:
        "The superCluster protocol carries smart contract risk, slashing risk, and other DeFi-related risks. Our protocol has been audited by multiple security firms, and we maintain insurance coverage to mitigate these risks.",
    },
    {
      question: "What is wsUSDC?",
      answer:
        "wsUSDC is a wrapped version of sUSDC that maintains a fixed balance and uses an internal share system. It's designed to be compatible with DeFi protocols that don't support rebasing tokens.",
    },
    {
      question: "How can get wsUSDC?",
      answer:
        "You can get wsUSDC by wrapping your sUSDC tokens through this interface. The process is simple and only requires one transaction.",
    },
    {
      question: "How can use wsUSDC?",
      answer:
        "wsUSDC can be used across various DeFi protocols and platforms including lending markets, liquidity pools, and yield farming strategies. It maintains the same value as sUSDC but with a fixed balance.",
    },
  ];

  return (
    <div className="min-h-screen py-20 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <WrapHeader />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Conversion Panel */}
          <div className="lg:col-span-2">
            {/* Tab Selector */}
            <TabSelector activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Conversion Card with nested components */}
            <ConversionCard
              activeTab={activeTab}
              amount={amount}
              setAmount={setAmount}
              isConnected={isConnected}
              sUSDCBalance={sUSDCBalance}
              wsUSDCBalance={wsUSDCBalance}
              wrapDetails={wrapDetails}
              unwrapDetails={unwrapDetails}
              handleMaxClick={handleMaxClick}
              error={error ? getSimplifiedError(error) : undefined}
            >
              {/* Wallet Info - embedded inside ConversionCard */}
              <WalletInfo
                address={address || ""}
                copied={copied}
                onCopyAddress={handleCopyAddress}
                sUSDCBalance={sUSDCBalance}
                wsUSDCBalance={wsUSDCBalance}
                formattedConversionRate={formattedConversionRate}
                isConnected={isConnected}
              />

              {/* Action Button */}
              <ActionButton
                buttonState={buttonState}
                isConnecting={isConnecting}
                onWrap={handleWrap}
                onConnect={handleConnect}
                isConnected={isConnected}
              />
            </ConversionCard>
          </div>

          {/* FAQ Sidebar */}
          <div className="lg:col-span-1">
            <FaqSidebar items={faqItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
