"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Image from "next/image";
import { PilotAsset } from "@/services/web3/contracts/types";
import { AssetModal } from "@/components/app/AssetModal";
import Link from "next/link";

interface AssetTableProps {
  assets: PilotAsset[];
  expandedAssets: string[];
  toggleAssetExpansion: (assetId: string) => void;
  selectedPilotId?: string;
  onSelectPilot?: (asset: PilotAsset) => void;
}

type SortField = "name" | "markets" | "tvl" | "bestLong" | "bestFixed";
type SortDirection = "asc" | "desc" | null;

export function AssetTable({
  assets,
  expandedAssets,
  toggleAssetExpansion,
  selectedPilotId,
  onSelectPilot,
}: AssetTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<PilotAsset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const openModal = (asset: PilotAsset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const handleSelectPilot = (asset: PilotAsset) => {
    if (!asset.isactive) {
      return;
    }
    onSelectPilot?.(asset);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      );
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3 h-3 ml-1" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <>
      <div className="space-y-2 md:px-0">
        {/* Desktop Table Header */}
        <div className="hidden md:grid w-full grid-cols-[2fr_1fr_1fr_auto] items-center bg-gray-800/50 rounded-t-xl px-6 py-4 gap-4 border-b border-gray-700/50">
          {/* Name Column */}
          <div
            className="group cursor-pointer flex items-center text-gray-400 hover:text-gray-200 transition-colors"
            onClick={() => handleSort("name")}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">
              Asset Name
            </span>
            {getSortIcon("name")}
          </div>

          {/* Markets Column */}
          <div
            className="group cursor-pointer flex items-center justify-start text-gray-400 hover:text-gray-200 transition-colors"
            onClick={() => handleSort("markets")}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">
              Markets
            </span>
            {getSortIcon("markets")}
          </div>

          {/* Actions Column */}
          <div className="flex items-center justify-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Actions
            </span>
          </div>
        </div>

        {/* Table Body */}
        {assets.map((asset) => {
          const isSelected = selectedPilotId === asset.id;
          const isExpanded = expandedAssets.includes(asset.id);
          const isDisabled = !asset.isactive;

          return (
            <div key={asset.id} className="space-y-2">
              {/* Desktop Row */}
              <div
                className={`hidden md:grid w-full grid-cols-[2fr_1fr_1fr_auto] items-center rounded-md px-6 py-3 gap-4 shadow transition-colors ${
                  isDisabled
                    ? "bg-gray-500/5 opacity-50 cursor-not-allowed"
                    : isSelected
                    ? "bg-cyan-500/15 border border-cyan-500/40 cursor-pointer"
                    : "bg-gray-500/15 hover:bg-gray-500/20 border border-transparent cursor-pointer"
                }`}
                onClick={() => !isDisabled && handleSelectPilot(asset)}
              >
                {/* Icon & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    <Image
                      src={asset.logo}
                      alt={asset.name}
                      className="w-6 h-6"
                      height={24}
                      width={24}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-base">
                      {asset.name}
                    </span>
                    <span className="text-white/60 text-sm">
                      {asset.symbol}
                    </span>
                    <span className="bg-purple-900/60 text-purple-400 px-2 py-0.5 rounded text-xs">
                      {asset.chain}
                    </span>
                    {isDisabled ? (
                      <span className="bg-red-900/60 text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
                        Inactive
                      </span>
                    ) : (
                      <span className="bg-blue-900/60 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Markets */}
                <div className="flex justify-start">
                  <span className="bg-blue-900/60 text-blue-400 px-2 py-1 rounded-md text-xs font-semibold">
                    {asset.marketsCount || asset.pools} Markets
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        openModal(asset);
                      }
                    }}
                    disabled={isDisabled}
                    className={`p-2 rounded-xl transition-colors ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-white/10 cursor-pointer"
                    }`}
                    title={isDisabled ? "Pilot Inactive" : "View Details"}
                  >
                    <ExternalLink className="h-4 w-4 text-white/60" />
                  </button>
                  {asset.markets && asset.markets.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDisabled) {
                          toggleAssetExpansion(asset.id);
                        }
                      }}
                      disabled={isDisabled}
                      className={`p-2 rounded-xl transition-colors ${
                        isDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-white/10 cursor-pointer"
                      }`}
                      title={
                        isDisabled
                          ? "Pilot Inactive"
                          : isExpanded
                          ? "Collapse"
                          : "Expand"
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-white/60" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/60" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Card */}
              <div
                className={`md:hidden rounded-xl p-4 shadow ${
                  isDisabled
                    ? "bg-gray-500/5 opacity-50 cursor-not-allowed"
                    : isSelected
                    ? "bg-cyan-500/15 border border-cyan-500/40 cursor-pointer"
                    : "bg-gray-500/15 cursor-pointer"
                }`}
                onClick={() => !isDisabled && handleSelectPilot(asset)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image
                        src={asset.logo}
                        alt={asset.name}
                        className="w-7 h-7"
                        height={28}
                        width={28}
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-base">
                          {asset.name}
                        </span>
                        <span className="text-white/60 text-sm">
                          {asset.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-purple-900/60 text-purple-400 px-2 py-0.5 rounded text-xs inline-block w-fit">
                          {asset.chain}
                        </span>
                        {isDisabled ? (
                          <span className="bg-red-900/60 text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
                            Inactive
                          </span>
                        ) : (
                          <span className="bg-blue-900/60 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        openModal(asset);
                      }
                    }}
                    disabled={isDisabled}
                    className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-white/10 cursor-pointer"
                    }`}
                  >
                    <ExternalLink className="h-4 w-4 text-white/60" />
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-800/40 rounded-lg p-2.5">
                    <div className="text-white/50 text-xs mb-0.5">Markets</div>
                    <div className="text-white font-semibold text-sm">
                      {asset.marketsCount || asset.pools}
                    </div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-2.5">
                    <div className="text-white/50 text-xs mb-0.5">TVL</div>
                    <div className="text-white font-semibold text-sm">
                      $
                      {(asset.totalLiquidity / 1000000).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                      M
                    </div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-2.5">
                    <div className="text-white/50 text-xs mb-0.5">
                      Best Fixed APY
                    </div>
                    <div className="text-green-400 font-semibold text-sm">
                      {asset.bestFixedAPY}%
                    </div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg p-2.5">
                    <div className="text-white/50 text-xs mb-0.5">Category</div>
                    <div className="text-white font-semibold text-sm">
                      {asset.category}
                    </div>
                  </div>
                </div>

                {/* Expand Button */}
                {asset.markets && asset.markets.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        toggleAssetExpansion(asset.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-white/80 text-sm ${
                      isDisabled
                        ? "bg-gray-800/20 cursor-not-allowed opacity-50"
                        : "bg-gray-800/40 hover:bg-gray-800/60 cursor-pointer"
                    }`}
                  >
                    {isExpanded ? "Hide Markets" : "Show Markets"}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Expanded Markets Section */}
              {isExpanded && asset.markets && asset.markets.length > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-4 ml-0 md:ml-6 space-y-2">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">
                    Available Markets
                  </h4>
                  {asset.markets.map((market) => (
                    <div
                      key={market.id}
                      className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between hover:bg-gray-700/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm mb-1">
                          {market.name}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white/60">
                            TVL: {market.tvl}
                          </span>
                          <span className="text-green-400 font-semibold">
                            APY: {market.apy}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Asset Modal */}
      {selectedAsset && (
        <AssetModal isOpen={isModalOpen} onClose={closeModal}>
          <div className="space-y-6">
            {/* Asset Icon & Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                <Image
                  src={selectedAsset.logo}
                  alt={selectedAsset.name}
                  className="w-10 h-10"
                  height={40}
                  width={40}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-white">
                    {selectedAsset.name}
                  </h3>
                  {!selectedAsset.isactive ? (
                    <span className="bg-red-900/60 text-red-400 px-3 py-1 rounded-md text-xs font-semibold">
                      Inactive
                    </span>
                  ) : (
                    <span className="bg-blue-900/60 text-blue-400 px-3 py-1 rounded-md text-xs font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-sm">
                  {selectedAsset.description}
                </p>
              </div>
            </div>

            {/* Asset Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="text-white/50 text-xs mb-1">Symbol</div>
                <div className="text-white font-semibold">
                  {selectedAsset.symbol}
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="text-white/50 text-xs mb-1">Chain</div>
                <div className="text-white font-semibold">
                  {selectedAsset.chain}
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="text-white/50 text-xs mb-1">Category</div>
                <div className="text-white font-semibold">
                  {selectedAsset.category}
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="text-white/50 text-xs mb-1">Status</div>
                <div
                  className={`font-semibold ${
                    selectedAsset.isactive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {selectedAsset.status}
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="text-white/50 text-xs mb-1">
                  Total Liquidity
                </div>
                <div className="text-white font-semibold">
                  $
                  {(selectedAsset.totalLiquidity / 1000000).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                  M
                </div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="text-white/50 text-xs mb-1">Best Fixed APY</div>
                <div className="text-green-400 font-semibold">
                  {selectedAsset.bestFixedAPY}%
                </div>
              </div>
            </div>

            {/* Focus Area */}
            <div className="bg-gray-800/40 rounded-lg p-4">
              <div className="text-white/50 text-xs mb-2">Strategy Focus</div>
              <div className="text-white text-sm leading-relaxed">
                {selectedAsset.focus}
              </div>
            </div>

            {/* Contract Address */}
            <div className="bg-gray-800/40 rounded-lg p-4">
              <div className="text-white/50 text-xs mb-2">Contract Address</div>
              <div className="text-white font-mono text-xs break-all">
                {selectedAsset.address}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link href="/app/deposit">
                <button
                  onClick={() => {
                    if (selectedAsset.isactive) {
                      handleSelectPilot(selectedAsset);
                      closeModal();
                    }
                  }}
                  disabled={!selectedAsset.isactive}
                  className={`flex-1 font-medium py-3 px-6 rounded-lg transition-colors ${
                    selectedAsset.isactive
                      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {selectedAsset.isactive ? "Select Pilot" : "Pilot Inactive"}
                </button>
              </Link>
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </AssetModal>
      )}
    </>
  );
}
