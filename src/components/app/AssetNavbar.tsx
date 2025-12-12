"use client";
import React, { useState, useEffect } from "react";
import {
  WalletIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  PowerIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export interface NavLink {
  name: string;
  href: string;
  active?: boolean;
  dropdown?: { label: string; items: { name: string; href: string }[] };
}

interface NavbarProps {
  links: NavLink[];
}

export function Navbar({ links }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { open } = useWeb3Modal();
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Set scrolled state for background
      setScrolled(currentScrollY > 10);

      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await open();
    } catch (error) {
      setError("Failed to connect wallet. Please try again.");
      console.error("Wallet connection error:", error);
    }
  };

  return (
    <>
      <nav
        className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "backdrop-blur-xl " : "bg-transparent"
        } ${visible ? "translate-y-0" : "-translate-y-full"}`}
        style={{
          transition: "transform 0.3s ease-in-out, background-color 0.3s",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 ">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-lg font-bold bg-gradient-to-r text-[#0b84ba] hidden sm:block">
                SuperCluster
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {links.map((link) =>
                link.dropdown ? (
                  <DropdownMenu key={link.name}>
                    <DropdownMenuTrigger
                      className={`relative px-1 py-2 text-sm font-medium transition-colors outline-none group ${
                        link.active
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {link.name}
                        <ChevronDownIcon className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-200" />
                      </span>
                      {link.active && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b84ba] rounded" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-xl rounded-xl mt-2 min-w-[160px]">
                      {link.dropdown.items.map((item) => (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            href={item.href}
                            className="px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 cursor-pointer transition-colors rounded-lg"
                          >
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative px-1 py-2 text-md transition-colors ${
                      link.active
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {link.name}
                    {link.active && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b84ba] rounded-full" />
                    )}
                  </Link>
                )
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Connect Wallet - Desktop */}
              {isConnected && address ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="hidden md:flex items-center gap-2 px-4 py-2 rounded bg-[#0b84ba] hover:bg-[#0973a3] text-white text-sm font-medium transition-all duration-300 outline-none">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>{formatAddress(address)}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 backdrop-blur-md border-slate-800 rounded mt-2 min-w-[220px]">
                    <div className="px-3 py-2.5 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Wallet Address</p>
                      <p className="text-sm text-white font-mono mt-1">
                        {formatAddress(address)}
                      </p>
                    </div>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(address)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors rounded m-1"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(
                          `https://etherscan.io/address/${address}`,
                          "_blank"
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 cursor-pointer transition-colors rounded m-1"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      View Explorer
                    </DropdownMenuItem>
                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors rounded m-1"
                      >
                        <PowerIcon className="w-4 h-4" />
                        Disconnect
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="hidden md:flex items-center w-full sm:w-auto justify-center bg-[#0b84ba] hover:bg-[#0973a3] text-white px-4 py-2 gap-1 text-sm font-normal rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <WalletIcon className="w-4 h-4" />
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-white transition-colors border border-slate-700"
              >
                {menuOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border-t border-red-500/50 px-4 py-2">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="sticky top-16 left-0 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl z-40 md:hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {/* Mobile Navigation Links */}
              {links.map((link) =>
                link.dropdown ? (
                  <div key={link.name} className="space-y-1">
                    <div
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        link.active
                          ? "text-white bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-l-2 border-blue-500"
                          : "text-slate-400"
                      }`}
                    >
                      {link.name}
                    </div>
                    <div className="pl-4 space-y-1">
                      {link.dropdown.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="block px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      link.active
                        ? "text-white bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-l-2 border-blue-500"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              )}

              {/* Mobile Connect Wallet */}
              <div className="pt-3 mt-3 border-t border-slate-800">
                {isConnected && address ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-400">Connected</p>
                      <p className="text-sm text-white font-mono mt-1">
                        {formatAddress(address)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(address);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      Copy Address
                    </button>
                    <button
                      onClick={() => {
                        window.open(
                          `https://etherscan.io/address/${address}`,
                          "_blank"
                        );
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      View Explorer
                    </button>
                    <button
                      onClick={() => {
                        disconnect();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <PowerIcon className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleConnect();
                      setMenuOpen(false);
                    }}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
                  >
                    <WalletIcon className="w-4 h-4" />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
