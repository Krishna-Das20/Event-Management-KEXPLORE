import { Hero } from '@/components/home/Hero';
import {
  CategoriesSection,
  CategoryBand,
  CtaBanner,
  FeaturedBento,
  HowItWorks,
  StatsBand,
  Testimonials,
  UpcomingSection,
} from '@/components/home/Sections';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <CategoryBand />
      <FeaturedBento />
      <UpcomingSection />
      <StatsBand />
      <CategoriesSection />
      <HowItWorks />
      <Testimonials />
      <CtaBanner />
    </>
  );
}
