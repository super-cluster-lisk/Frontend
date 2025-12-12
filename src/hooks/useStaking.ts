import { useState } from "react";
import { Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import {
  CONTRACTS,
  TOKEN_DECIMALS,
  isBaseSepolia,
} from "@/services/web3/contracts/addresses";
import { SupportedChainId } from "@/services/web3/contracts/types";
import { MOCK_USDC_ABI } from "@/services/web3/contracts/abis/MockUSDC";
import { SUPERCLUSTER_ABI } from "@/services/web3/contracts/abis/SuperCluster";

const STORAGE_KEY = "supercluster.selectedPilot";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.shortMessage === "string") return err.shortMessage;
    if (typeof err.message === "string") return err.message;
  }

  return "Failed to stake. Please try again.";
}

export function useStaking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const stake = async (amount: string, pilotAddress?: Address) => {
    if (!address || !chainId) {
      throw new Error("Please connect your wallet");
    }

    if (!isBaseSepolia(chainId as SupportedChainId)) {
      throw new Error("Please switch to Base Sepolia network");
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error("Please enter a valid amount");
    }

    try {
      setError(null);
      setIsSubmitting(true);
      setTxHash(null);

      const amountBigInt = parseUnits(amount, TOKEN_DECIMALS.USDC);

      let targetPilot: Address = pilotAddress ?? CONTRACTS.pilot;
      if (!pilotAddress && typeof window !== "undefined") {
        const savedAddress = window.localStorage.getItem(STORAGE_KEY);
        if (savedAddress && savedAddress.startsWith("0x")) {
          targetPilot = savedAddress as Address;
        }
      }

      console.log("Approving USDC...");
      const approveTx = await writeContractAsync({
        address: CONTRACTS.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [CONTRACTS.superCluster, amountBigInt],
      });

      await publicClient?.waitForTransactionReceipt({ hash: approveTx });
      console.log("USDC approved:", approveTx);

      console.log("Depositing to SuperCluster...");
      const depositTx = await writeContractAsync({
        address: CONTRACTS.superCluster,
        abi: SUPERCLUSTER_ABI,
        functionName: "deposit",
        args: [targetPilot, CONTRACTS.mockUSDC, amountBigInt],
      });

      await publicClient?.waitForTransactionReceipt({ hash: depositTx });
      console.log("Deposit successful:", depositTx);

      setTxHash(depositTx);
      setError(null);
    } catch (err: unknown) {
      console.error("Staking error:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetError = () => setError(null);

  return {
    stake,
    isSubmitting,
    error,
    txHash,
    resetError,
  };
}
