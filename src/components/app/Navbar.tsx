"use client";
import { usePathname } from "next/navigation";
import { Navbar, NavLink } from "@/components/app/AssetNavbar";

export default function AppNavbar() {
  const pathname = usePathname();

  const links: NavLink[] = [
    {
      name: "Pilot",
      href: "/app/pilot",
      active: pathname === "/app/pilot",
    },
    {
      name: "Deposit",
      href: "/app/deposit",
      active: pathname === "/app/deposit",
    },
    {
      name: "Wrap",
      href: "/app/wrap",
      active: pathname.startsWith("/app/wrap"),
    },
    {
      name: "Withdrawals",
      href: "/app/withdraw/request",
      active: pathname.startsWith("/app/withdraw"),
    },
    {
      name: "Faucet",
      href: "/app/faucet",
      active: pathname === "/app/faucet",
    },
  ];

  return <Navbar links={links} />;
}
