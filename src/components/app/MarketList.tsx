"use client";
import React from "react";

type Market = {
  id: string;
  name: string;
  tvl: string | number;
  apy: string | number;
};

type MarketListProps = {
  markets: Market[];
};

export function MarketList({ markets }: MarketListProps) {
  return (
    <div className="bg-white/5 p-4 rounded space-y-2 border border-white/10">
      <h4 className="text-xs font-semibold text-slate-300 mb-2">
        Available Markets
      </h4>
      {markets.map((m) => (
        <div
          key={m.id}
          className="p-3 bg-white/5 rounded flex justify-between hover:bg-white/10 border border-white/10"
        >
          <div>
            <div className="text-sm text-gray-200">{m.name}</div>
            <div className="flex gap-3 text-xs">
              <span className="text-gray-400">TVL: {m.tvl}</span>
              <span className="text-green-400/70 font-medium text-xs">
                APY: {m.apy}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
