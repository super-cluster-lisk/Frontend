import type { Metadata } from "next";
import LandingNavbar from "@/components/landing/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SuperCluster - Liquid Stablecoin Savings Protocol",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingNavbar />
      <main className="w-full min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
