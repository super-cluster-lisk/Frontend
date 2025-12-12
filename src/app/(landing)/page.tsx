"use client";
import CoreFlowSection from "@/components/landing/CoreFlowSection/page";
import DefinitionSection from "@/components/landing/DefinitionSection/page";
import FeatureSection from "@/components/landing/FeatureSection/page";
import HeroSection from "@/components/landing/HeroSection/Page";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <DefinitionSection />
      <CoreFlowSection />
    </>
  );
}
