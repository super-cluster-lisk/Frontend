"use client";
import React from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Market } from "@/services/web3/contracts/types";

function Badge({
  text,
  tone = "accent",
}: {
  text: string;
  tone?: "accent" | "neutral" | "danger";
}) {
  const variants: Record<string, string> = {
    accent: "bg-[#0b84ba]/10 text-[#0b84ba] border border-[#0b84ba]/30",
    neutral: "bg-white/10 text-slate-300 border border-neutral-700",
    danger: "bg-red-900/30 text-red-400 border border-red-400/30",
  };

  return (
    <span className={`${variants[tone]} px-2 py-0.5 rounded text-xs`}>
      {text}
    </span>
  );
}

interface Asset {
  logo: string;
  name: string;
  symbol: string;
  chain: string;
  isactive: boolean;
  marketsCount?: number;
  pools?: number;
  markets: Market[];
  totalLiquidity?: number;
  bestFixedAPY?: number;
  category?: string;
}

interface AssetRowDesktopProps {
  asset: Asset;
  isSelected: boolean;
  isExpanded: boolean;
  disabled: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onOpenModal: () => void;
}

export function AssetRowDesktop({
  asset,
  isSelected,
  isExpanded,
  disabled,
  onSelect,
  onExpand,
  onOpenModal,
}: AssetRowDesktopProps) {
  return (
    <div
      className={`hidden md:grid grid-cols-[2fr_1fr_1fr_auto] items-center px-6 py-3 rounded border border-white/10 shadow transition
      ${
        disabled
          ? "bg-slate-950/20 opacity-40 cursor-not-allowed"
          : isSelected
          ? "bg-white/5 border-slate-700"
          : "bg-white/5 hover:bg-white/10"
      }`}
      onClick={() => !disabled && onSelect()}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10">
          <Image
            src={asset.logo}
            alt={asset.name}
            height={24}
            width={24}
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-300">{asset.name}</span>
          <span className="text-slate-400 text-sm">{asset.symbol}</span>
          <Badge text={asset.chain} tone="accent" />
          <Badge
            text={asset.isactive ? "Active" : "Inactive"}
            tone={asset.isactive ? "accent" : "neutral"}
          />
        </div>
      </div>

      <div>
        <Badge
          text={`${asset.marketsCount || asset.pools} Markets`}
          tone="neutral"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onOpenModal();
          }}
          className="p-2 hover:bg-white/10 rounded"
        >
          <ExternalLink className="h-4 w-4 text-slate-300" />
        </button>

        {(asset.markets?.length ?? 0) > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onExpand();
            }}
            className="p-2 hover:bg-white/10 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-300" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface AssetCardMobileProps {
  asset: Asset;
  isSelected: boolean;
  isExpanded: boolean;
  disabled: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onOpenModal: () => void;
}

export function AssetCardMobile({
  asset,
  isSelected,
  isExpanded,
  disabled,
  onSelect,
  onExpand,
  onOpenModal,
}: AssetCardMobileProps) {
  return (
    <div
      className={`md:hidden p-4 rounded shadow transition border border-white/10
      ${
        disabled
          ? "bg-slate-950/20 opacity-60"
          : isSelected
          ? "bg-white/5 border-white/5"
          : "bg-white/5 border-white/5"
      }`}
      onClick={() => !disabled && onSelect()}
    >
      <div className="flex justify-between mb-3">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10">
            <Image
              src={asset.logo}
              alt={asset.name}
              height={28}
              width={28}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex gap-2 flex-wrap">
              <span className="font-medium text-slate-300">{asset.name}</span>
              <span className="text-slate-400 text-sm">{asset.symbol}</span>
            </div>
            <div className="flex gap-2 flex-wrap mt-1">
              <Badge text={asset.chain} tone="accent" />
              <Badge
                text={asset.isactive ? "Active" : "Inactive"}
                tone={asset.isactive ? "accent" : "neutral"}
              />
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onOpenModal();
          }}
          className="p-2 hover:bg-white/10 rounded"
        >
          <ExternalLink className="h-4 w-4 text-slate-300" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Stat label="Markets" value={asset.marketsCount || asset.pools} />
        <Stat
          label="TVL"
          value={`$${((asset.totalLiquidity ?? 0) / 1e6).toFixed(2)}M`}
        />
        <Stat label="Best Fixed APY" value={`${asset.bestFixedAPY}%`} green />
        <Stat label="Category" value={asset.category} />
      </div>

      {(asset.markets?.length ?? 0) > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onExpand();
          }}
          className="w-full py-2 text-[#0b84ba] flex  text-sm"
        >
          {isExpanded ? "Hide Markets" : "Show Markets"}
        </button>
      )}
    </div>
  );
}

interface StatProps {
  label: string;
  value: React.ReactNode;
  green?: boolean;
}

function Stat({ label, value, green }: StatProps) {
  return (
    <div className="bg-slate-900/40 p-2.5 rounded">
      <div className="text-slate-400 text-xs">{label}</div>
      <div
        className={`text-sm font-medium ${
          green ? "text-green-400" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
