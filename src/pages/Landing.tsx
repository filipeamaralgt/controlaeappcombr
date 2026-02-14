import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { HeroOfferCard } from '@/components/landing/HeroOfferCard';
import { SocialProofBar } from '@/components/landing/SocialProofBar';
import { PainPoints } from '@/components/landing/PainPoints';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { Testimonials } from '@/components/landing/Testimonials';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { StickyMobileCTA } from '@/components/landing/StickyMobileCTA';
import { RecentSubscribers } from '@/components/landing/RecentSubscribers';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-20 md:pb-0">
      <LandingNav />
      <LandingHero />
      <SocialProofBar />
      <HeroOfferCard />
      <PainPoints />
      <FeatureShowcase />
      <Testimonials />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
      <StickyMobileCTA />
      <RecentSubscribers />
    </div>
  );
}
