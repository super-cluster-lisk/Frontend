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
    <div className="bg-white/2 p-4 rounded space-y-2 md:ml-6 border border-white/10">
      <h4 className="text-xs font-semibold text-slate-300 mb-2">
        Available Markets
      </h4>
      {markets.map((m) => (
        <div
          key={m.id}
          className="p-3 bg-white/3 rounded flex justify-between hover:bg-white/5 border border-white/10"
        >
          <div>
            <div className="font-medium text-sm text-slate-400">{m.name}</div>
            <div className="flex gap-3 text-xs">
              <span className="text-slate-500">TVL: {m.tvl}</span>
              <span className="text-green-400/70">APY: {m.apy}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
