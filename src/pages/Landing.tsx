import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { SocialProofBar } from '@/components/landing/SocialProofBar';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { Testimonials } from '@/components/landing/Testimonials';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <SocialProofBar />
      <FeatureShowcase />
      <Testimonials />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
}
