"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  TrendingUp,
  Shield,
  Zap,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { useUSDCBalance, useSTokenBalance } from "@/hooks/useTokenBalance";
import { getSimplifiedError } from "@/services/web3/utils/getSimplifiedError";
import { useStaking } from "@/hooks/useStaking";
import { CONTRACTS } from "@/services/web3/contracts/addresses";
import toast from "react-hot-toast";
import Link from "next/link";
import { DepositHeader } from "@/components/app/Deposit/Header";
import { StakeCard } from "@/components/app/Deposit/StakeCard";
import { StatsGrid } from "@/components/app/Deposit/StatsGrid";
import { FaqSidebar } from "@/components/app/Deposit/FaqSidebar";

export default function StakePage() {
  const [usdcAmount, setUsdcAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [pilotCopied, setPilotCopied] = useState(false);
  const [showNoUSDCPopup, setShowNoUSDCPopup] = useState(false);
  const [, setShowInsufficientPopup] = useState(false);

  const { open } = useWeb3Modal();
  const { address, isConnected, isConnecting } = useAccount();

  const { formatted: usdcBalance, refetch: refetchUSDC } = useUSDCBalance();
  const { formatted: sUSDCBalance, refetch: refetchSToken } =
    useSTokenBalance();

  const { stake, isSubmitting, error, resetError } = useStaking();
  const pilotCopyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pilotDirectory = useMemo(() => {
    return {
      [CONTRACTS.pilot.toLowerCase()]: {
        name: "Atlas Core Pilot",
        address: CONTRACTS.pilot as string,
      },
      ["0x8c1f10c0ae63b51c8ba3b2ac7184998f5e552f10"]: {
        name: "YieldWave Labs",
        address: "0x8c1F10c0AE63B51C8BA3b2aC7184998f5e552F10",
      },
      ["0x4b6c94f5ca817bc7d0b6c0d7f6e7f0a3ad5a1a31"]: {
        name: "Horizon Shield",
        address: "0x4b6c94F5cA817bC7d0b6C0D7f6e7F0A3ad5A1a31",
      },
    } as Record<string, { name: string; address: string }>;
  }, []);

  const defaultPilotInfo = useMemo(() => {
    return (
      pilotDirectory[CONTRACTS.pilot.toLowerCase()] ?? {
        name: "Atlas Core Pilot",
        address: CONTRACTS.pilot as string,
      }
    );
  }, [pilotDirectory]);

  const [selectedPilotInfo, setSelectedPilotInfo] = useState(defaultPilotInfo);

  // handle max button click
  const handleMaxClick = () => {
    const cleanBalance = usdcBalance.replace(/,/g, "");
    setUsdcAmount(cleanBalance);
  };

  // handle input change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
      value = value.replace(/^0+/, "");
      if (value === "") value = "0";
    }

    if (!/^\d*\.?\d*$/.test(value)) return;

    if (value.includes(".")) {
      const [whole, decimal] = value.split(".");
      if (decimal && decimal.length > 6) {
        value = `${whole}.${decimal.substring(0, 6)}`;
      }
    }

    setUsdcAmount(value);

    // Check if amount exceeds balance and show popup
    if (isConnected && value) {
      const cleanBalance = usdcBalance.replace(/,/g, "");
      const inputAmount = parseFloat(value);
      const availableBalance = parseFloat(cleanBalance);

      // Show insufficient balance popup when user types amount > balance
      if (inputAmount > availableBalance && availableBalance > 0) {
        setShowInsufficientPopup(true);
      }

      // Show no USDC popup when user tries to type but has 0 balance
      if (availableBalance === 0 && inputAmount > 0) {
        setShowNoUSDCPopup(true);
        setUsdcAmount(""); // Clear input
      }
    }
  };

  // determine if stake button should be disabled
  const isStakeDisabled = () => {
    if (!isConnected || isSubmitting) return true;

    // Check if USDC balance is 0
    const cleanBalance = usdcBalance.replace(/,/g, "");
    if (parseFloat(cleanBalance) === 0) return true;

    // Check if input amount is valid
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) return true;

    // Check if amount exceeds balance
    if (parseFloat(usdcAmount) > parseFloat(cleanBalance)) return true;

    return false;
  };

  // determine stake button text
  const getStakeButtonText = () => {
    if (isSubmitting) return "Depositing...";

    const cleanBalance = usdcBalance.replace(/,/g, "");
    if (parseFloat(cleanBalance) === 0) return "Get USDC First";

    if (!usdcAmount || parseFloat(usdcAmount) <= 0) return "Enter Amount";

    if (parseFloat(usdcAmount) > parseFloat(cleanBalance))
      return "Amount Exceeds Balance";

    return "Deposit Now";
  };

  // handle copy address
  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPilotAddress = () => {
    const pilotAddress = selectedPilotInfo?.address;
    if (!pilotAddress) return;

    navigator.clipboard.writeText(pilotAddress).then(() => {
      setPilotCopied(true);
      if (pilotCopyTimeout.current) {
        clearTimeout(pilotCopyTimeout.current);
      }
      pilotCopyTimeout.current = setTimeout(() => setPilotCopied(false), 2000);
    });
  };

  const stats = {
    apr: "3.3%",
    totalStaked: "8,691,541.703 USDC",
    stakers: "569,385",
    marketCap: "$35,031,698,430",
  };

  // handle wallet connect
  const handleConnect = async () => {
    try {
      resetError();
      await open();
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  // handle Deposit
  const handleStake = async () => {
    const toastId = toast.loading("Waiting for wallet confirmation...");
    try {
      await stake(usdcAmount);
      toast.success("Deposit successful! Refreshing balance...", {
        id: toastId,
      });
      setUsdcAmount("");
      setTimeout(() => {
        refetchUSDC();
        refetchSToken();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = getSimplifiedError(err);
      const isUserRejection = errorMessage
        .toLowerCase()
        .includes("user rejected");

      if (isUserRejection) {
        toast.dismiss(toastId);
      } else {
        toast.error(errorMessage, { id: toastId });
      }
      console.error(err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const STORAGE_KEY = "supercluster.selectedPilot";

    const updateSelectedPilot = () => {
      const storedAddress = window.localStorage.getItem(STORAGE_KEY);
      if (storedAddress && storedAddress.startsWith("0x")) {
        const entry = pilotDirectory[storedAddress.toLowerCase()] ?? {
          name: "Custom Pilot",
          address: storedAddress,
        };
        setSelectedPilotInfo(entry);
      } else {
        setSelectedPilotInfo(defaultPilotInfo);
      }
    };

    updateSelectedPilot();
    window.addEventListener("storage", updateSelectedPilot);

    return () => {
      window.removeEventListener("storage", updateSelectedPilot);
    };
  }, [pilotDirectory, defaultPilotInfo]);

  useEffect(() => {
    return () => {
      if (pilotCopyTimeout.current) {
        clearTimeout(pilotCopyTimeout.current);
      }
    };
  }, []);

  const faqItems = [
    {
      question: "What is liquid Deposit?",
      answer:
        "Liquid Deposit allows you to stake your USDC and receive a tokenized version (sUSDC) that represents your staked USDC plus Deposit rewards. Unlike traditional Deposit, you can use sUSDC in DeFi applications while still earning Deposit rewards.",
      icon: Info,
    },
    {
      question: "How do I receive my Deposit rewards?",
      answer:
        "Your sUSDC balance automatically increases daily to reflect your Deposit rewards. The token is a rebase token, meaning the amount in your wallet grows over time as rewards are earned. You can also track your rewards through the dashboard.",
      icon: TrendingUp,
    },
    {
      question: "Can I unstake my USDC at any time?",
      answer:
        "Yes, you can unstake your USDC at any time. However, there may be a withdrawal queue depending on network conditions. The unstaking process typically takes 1-5 days. You can also swap your sUSDC for USDC on decentralized exchanges for instant liquidity.",
      icon: Zap,
    },
    {
      question: "What are the risks of Deposit?",
      answer:
        "The main risks include smart contract risk, slashing risk (validators can lose a portion of stake for misbehavior), and market risk (the value of USDC/sUSDC can fluctuate). Our protocol has been audited by multiple security firms, and we maintain insurance coverage to mitigate these risks.",
      icon: Shield,
    },
    {
      question: "What is the reward fee?",
      answer:
        "A 10% fee is applied to your Deposit rewards to cover protocol maintenance, development, and validator operations. This means if you earn 3.3% APR, the protocol takes 10% of that reward, and you receive the remaining 90%. The fee is automatically deducted from your rewards.",
      icon: Award,
    },
    {
      question: "Is there a minimum Deposit amount?",
      answer:
        "No, there is no minimum amount required to stake. You can stake any amount of USDC you wish, making it accessible for everyone regardless of their holdings.",
      icon: Info,
    },
  ];

  return (
    <div className="min-h-screen py-20 text-white">
      {/* No USDC Popup */}
      {showNoUSDCPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>

              {/* Title */}
              <h3 className="font-bold text-white text-2xl mb-3">
                No USDC Available
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                You need USDC tokens to stake. Get test USDC from our faucet to
                start staking and earning rewards.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link href="/app/faucet" className="flex-1">
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600  text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl">
                    Go to Faucet
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowNoUSDCPopup(false)}
                  variant="outline"
                  className="flex-1 sm:flex-none h-12 px-6 border-slate-600 text-slate-300  rounded-xl transition-colors"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <DepositHeader />

        <div className="grid lg:grid-cols-3 gap-8">
          <StakeCard
            isConnected={isConnected}
            isConnecting={isConnecting}
            address={address ?? ""}
            usdcBalance={usdcBalance}
            sUSDCBalance={sUSDCBalance}
            stats={stats}
            selectedPilotInfo={selectedPilotInfo}
            onCopyAddress={handleCopyAddress}
            copied={copied}
            pilotCopied={pilotCopied}
            onCopyPilot={handleCopyPilotAddress}
            usdcAmount={usdcAmount}
            onAmountChange={handleAmountChange}
            onMax={handleMaxClick}
            onStake={handleStake}
            onConnect={handleConnect}
            isStakeDisabled={isStakeDisabled}
            getStakeButtonText={getStakeButtonText}
            error={error ? getSimplifiedError(error) : ""}
          />

          <div className="lg:col-span-1">
            <FaqSidebar items={faqItems} />
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <StatsGrid stats={stats} />
        </div>
      </div>
    </div>
  );
}
