import NavBar from "../components/landing/NavBar";
import HeroUntrustBar from "../components/landing/HeroUntrustBar";
import HeroSection from "../components/landing/HeroSection";
import FeatureGrid from "../components/landing/FeatureGrid";
import CommunityShowcase from "../components/landing/CommunityShowcase";
import SiteFooter from "../components/landing/SiteFooter";

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <HeroUntrustBar />
      <FeatureGrid />
      <CommunityShowcase />
      <SiteFooter />
    </>
  );
}
