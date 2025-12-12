"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  ExternalLink,
  TrendingUp,
  Shield,
  Zap,
  Award,
  Wallet,
  Copy,
  Check,
  AlertTriangle,
  Target,
  ActivitySquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { useUSDCBalance, useSTokenBalance } from "@/hooks/useTokenBalance";
import { getSimplifiedError } from "@/services/web3/utils/getSimplifiedError";
import { useStaking } from "@/hooks/useStaking";
import { CONTRACTS } from "@/services/web3/contracts/addresses";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function StakePage() {
  const [usdcAmount, setUsdcAmount] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [pilotCopied, setPilotCopied] = useState(false);
  const [showNoUSDCPopup, setShowNoUSDCPopup] = useState(false);
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);

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

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
    <div className="min-h-screen pb-24 text-white">
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
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Deposite & Earn Rewards
            </span>
          </h1>

          <p className="text-md text-slate-400 max-w-2xl mx-auto mb-8">
            Stake your USDC and receive sUSDC while earning competitive rewards
          </p>

          {/* Quick Stats Banner */}
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-sm">
              <span className="text-xs text-slate-400">APR:</span>{" "}
              <span className="text-sm font-semibold text-blue-400">
                {stats.apr}
              </span>
            </div>
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-sm">
              <span className="text-xs text-slate-400">Total Staked:</span>{" "}
              <span className="text-sm font-semibold text-cyan-400">
                8.69M USDC
              </span>
            </div>
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-sm">
              <span className="text-xs text-slate-400">Stakers:</span>{" "}
              <span className="text-sm font-semibold text-blue-400">569K+</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Staking Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Staking Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
              {/* Input Section */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <Image
                        src="/usdc.png"
                        alt="USDC"
                        width={48}
                        height={48}
                      />
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={usdcAmount}
                        onChange={handleAmountChange}
                        disabled={!isConnected || isSubmitting}
                        className="bg-transparent border-none text-3xl font-semibold focus-visible:ring-0 p-1 h-auto text-white placeholder:text-slate-600 disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={handleMaxClick}
                      disabled={!isConnected || isSubmitting}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallet Info - Only show when connected */}
              {isConnected && address && (
                <div className="mb-6 p-5 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Available to stake */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400 font-medium">
                          Available to Deposit
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {usdcBalance} USDC
                      </div>
                    </div>

                    {/* Staked amount */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-400 font-medium">
                          Deposited amount
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {sUSDCBalance} sUSDC
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-medium block">
                        Wallet Address
                      </span>
                      <button
                        onClick={handleCopyAddress}
                        className="flex items-center gap-2 text-sm font-mono text-white hover:text-blue-400 transition-colors group"
                      >
                        <span>{formatAddress(address)}</span>
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>

                    {/* APR */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                          sUSDC APR
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {stats.apr}
                      </div>
                    </div>

                    {/* Selected Pilot */}
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-300" />
                        <span className="text-xs text-slate-400 font-medium">
                          Selected pilot
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-lg font-semibold text-white">
                          {selectedPilotInfo?.name ?? "Atlas Core Pilot"}
                        </span>
                        <Link
                          href="/app/pilot"
                          className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          Manage pilots
                        </Link>
                      </div>
                      <button
                        onClick={handleCopyPilotAddress}
                        className="flex items-center gap-2 text-sm font-mono text-white/80 hover:text-cyan-300 transition-colors group"
                      >
                        <span>
                          {formatAddress(selectedPilotInfo?.address ?? "")}
                        </span>
                        {pilotCopied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* You will receive */}
              <div className="mb-8">
                <label className="text-sm text-slate-400 mb-2 block">
                  You will receive
                </label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Image
                      src="/susdc.png"
                      alt="sUSDC"
                      width={48}
                      height={48}
                      className="flex-shrink-0 rounded-full"
                    />
                    <div className="text-3xl font-semibold text-white truncate">
                      {usdcAmount || "0.0000"} sUSDC
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                  <p className="text-red-400 text-sm">
                    {getSimplifiedError(error)}
                  </p>
                </div>
              )}

              {/* Connect/Stake Button */}
              {isConnected ? (
                <Button
                  onClick={handleStake}
                  disabled={isStakeDisabled()}
                  className={`w-full h-14 font-bold text-lg rounded-xl shadow-lg transition-all disabled:cursor-not-allowed disabled:shadow-none ${
                    isStakeDisabled()
                      ? "bg-slate-700 text-slate-400 border border-slate-600"
                      : "w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium text-lg rounded-xl transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  }`}
                >
                  {getStakeButtonText()}
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

              {/* Transaction Info */}
              <div className="mt-6 space-y-3 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Exchange Rate</span>
                  <span className="text-white font-medium">
                    1 USDC = 1 sUSDC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network Fee</span>
                  <span className="text-white font-medium">~$0.92</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    Reward Fee
                    <Info className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-white font-medium">10%</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400">Total Staked</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.totalStaked}
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <ActivitySquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-400">Active Stakers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.stakers}</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400">Market Cap</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.marketCap}
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-2">
                    How does it work?
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    When you stake USDC, you receive sUSDC tokens that represent
                    your staked USDC plus all accrued rewards. Your sUSDC
                    balance automatically increases daily as you earn Deposit
                    rewards.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    Learn more about liquid Deposit
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-2xl font-bold mb-6 text-gray-300">
                Common Questions
              </h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => {
                  const Icon = item.icon;
                  const isExpanded = expandedFaq === index;

                  return (
                    <div
                      key={index}
                      className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-slate-700 transition-colors"
                    >
                      <button
                        onClick={() =>
                          setExpandedFaq(isExpanded ? null : index)
                        }
                        className="w-full p-5 text-left flex items-start gap-3 hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm leading-snug">
                            {item.question}
                          </h4>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5">
                          <p className="text-sm text-slate-400 leading-relaxed pl-11">
                            {item.answer}
                          </p>
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
