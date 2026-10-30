import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { SplitSection } from "@/components/split-section";
import { FeaturesGrid } from "@/components/features-grid";
import { PlatformDownloads } from "@/components/platform-downloads";
import { FaqSection } from "@/components/faq-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

// Page unique complete pour la landing page Gather Suite
export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between selection:bg-[#ff5a36]/20 selection:text-[#ff5a36]">
      <Header />
      <main className="w-full">
        <HeroSection />
        <SplitSection />
        <FeaturesGrid />
        <PlatformDownloads />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
