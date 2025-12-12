"use client";
import Geometri from "@/components/landing/Geometri";
import Link from "next/link";

export default function HeroSection() {
  return (
    <>
      <Geometri>
        <div
          className={` flex flex-col justify-center items-center h-[74vh] text-center text-gray-200 px-4`}
        >
          <h1 className="text-3xl md:text-5xl max-w-4xl font-normal text-white">
            Optimized yield for stablecoin holders Designed for performance and
            risk control.
          </h1>
        </div>
      </Geometri>
      <section className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            <div>
              <h1 className="text-3xl md:text-6xl font-normal text-white">
                Liquid <span className="text-[#0b84ba]">Stablecoin</span>
                <br />
                <span className="text-white">Savings Protocol</span>
              </h1>

              <p className="text-xl md:text-lg text-start text-slate-400 max-w-3xl mb-12 mt-4">
                Earn yields on your USDC while maintaining full liquidity and
                composability across DeFi ecosystems
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-12 lg:mb-16">
                <Link
                  href="/app/deposit"
                  className="w-full sm:w-auto flex items-center font-medium justify-center primary-button text-white px-6 py-3 md:text-lg text-sm rounded transition-all"
                >
                  Deposit Now
                </Link>
                <Link
                  href="https://super-cluster-2.gitbook.io/super-cluster-docs"
                  className="w-full sm:w-auto flex items-center justify-center border border-slate-800 bg-white/20 backdrop-blur-xl hover:bg-white/20 text-white px-6 py-3 md:text-lg text-sm font-normal rounded transition-all"
                >
                  Read Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
