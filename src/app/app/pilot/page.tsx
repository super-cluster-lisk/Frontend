"use client";

import { useEffect, useMemo, useState } from "react";
import { CONTRACTS } from "@/services/web3/contracts/addresses";
import { FiltersBar } from "@/components/app/FiltersBar";
import { AssetTable } from "@/components/app/Table";
import { PilotAsset } from "@/services/web3/contracts/types";

const STORAGE_KEY = "supercluster.selectedPilot";

const PILOT_ASSETS: readonly PilotAsset[] = [
  {
    id: "atlas-core",
    name: "Atlas Core Pilot",
    symbol: "ATLAS",
    chain: "Base Sepolia",
    logo: "/usde.svg",
    category: "Core",
    totalLiquidity: 1420000,
    pools: 3,
    isactive: true,
    bestFixedAPY: 7.9,
    marketsCount: 3,
    markets: [
      {
        id: "atlas-aave",
        name: "Aave v3 Liquidity Vault",
        tvl: "$620K",
        apy: "6.8%",
      },
      {
        id: "atlas-morpho",
        name: "Morpho Blue Supply Loop",
        tvl: "$510K",
        apy: "7.3%",
      },
      {
        id: "atlas-buffer",
        name: "Rebalance Buffer Reserve",
        tvl: "$290K",
        apy: "3.4%",
      },
    ],
    address: CONTRACTS.pilot,
    status: "Active",
    focus: "Balanced yield aggregation across lending markets.",
    description:
      "Primary pilot connected to the live SuperCluster deployment. Maintains diversified allocations across Aave and Morpho with automated rebalancing.",
  },
  {
    id: "yieldwave-labs",
    name: "YieldWave Labs",
    symbol: "YLAB",
    chain: "Base Sepolia",
    logo: "/usde.svg",
    category: "Growth",
    totalLiquidity: 820000,
    pools: 4,
    isactive: false,
    bestFixedAPY: 12.4,
    marketsCount: 4,
    markets: [
      {
        id: "yieldwave-balancer",
        name: "Balancer Boosted Pools",
        tvl: "$310K",
        apy: "14.1%",
      },
      {
        id: "yieldwave-perps",
        name: "Perp Delta-Neutral Hedge",
        tvl: "$220K",
        apy: "9.8%",
      },
      {
        id: "yieldwave-liquity",
        name: "Liquity Stability Vault",
        tvl: "$150K",
        apy: "8.6%",
      },
      {
        id: "yieldwave-synthetix",
        name: "Synthetix Market Making",
        tvl: "$140K",
        apy: "11.7%",
      },
    ],
    address: "0x8c1F10c0AE63B51C8BA3b2aC7184998f5e552F10",
    status: "Standby",
    focus: "High-volatility strategies with weekly human oversight.",
    description:
      "Experimental pilot targeting higher risk / higher reward DeFi pools. Requires operator approval before routing large deposits.",
  },
  {
    id: "horizon-shield",
    name: "Horizon Shield",
    symbol: "HZN",
    chain: "Base Sepolia",
    logo: "/usde.svg",
    category: "Defensive",
    totalLiquidity: 2050000,
    pools: 2,
    isactive: false,
    bestFixedAPY: 5.1,
    marketsCount: 2,
    markets: [
      {
        id: "horizon-aave",
        name: "Aave Stablecoin Loop",
        tvl: "$1.1M",
        apy: "5.4%",
      },
      {
        id: "horizon-tbills",
        name: "Tokenised T-Bill Exposure",
        tvl: "$950K",
        apy: "4.7%",
      },
    ],
    address: "0x4b6c94F5cA817bC7d0b6C0D7f6e7F0A3ad5A1a31",
    status: "Standby",
    focus: "Capital preservation with conservative leverage limits.",
    description:
      "Built for institutions prioritising downside protection. Relies on over-collateralised loops and tokenised treasuries.",
  },
] as const;

export default function OperatorPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Pilots");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [expandedAssets, setExpandedAssets] = useState<string[]>([]);
  const [selectedPilotId, setSelectedPilotId] = useState<string>(
    PILOT_ASSETS[0].id
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAddress = window.localStorage.getItem(STORAGE_KEY);
    if (savedAddress) {
      const match = PILOT_ASSETS.find(
        (pilot: PilotAsset) => pilot.address === savedAddress
      );
      if (match) {
        setSelectedPilotId(match.id);
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, PILOT_ASSETS[0].address);
    }
  }, []);

  const toggleAssetExpansion = (assetId: string) => {
    setExpandedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const filteredPilots = useMemo<PilotAsset[]>(() => {
    return PILOT_ASSETS.filter((pilot: PilotAsset) => {
      const matchesCategory =
        selectedCategory === "All Pilots" ||
        pilot.category === selectedCategory;

      const matchesSearch =
        searchQuery.trim() === "" ||
        pilot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pilot.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pilot.address.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSelectPilot = (pilot: PilotAsset) => {
    setSelectedPilotId(pilot.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, pilot.address);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-20 min-h-screen">
      <div>
        <FiltersBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
        <AssetTable
          assets={filteredPilots}
          expandedAssets={expandedAssets}
          toggleAssetExpansion={toggleAssetExpansion}
          selectedPilotId={selectedPilotId}
          onSelectPilot={handleSelectPilot}
        />
      </div>
    </div>
  );
}
