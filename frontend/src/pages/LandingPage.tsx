import NavBar from "../components/landing/NavBar";
import HeroSection from "../components/landing/HeroSection";
import FeatureGrid from "../components/landing/FeatureGrid";
import SiteFooter from "../components/landing/SiteFooter";

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <FeatureGrid />
      <SiteFooter />
    </>
  );
}
