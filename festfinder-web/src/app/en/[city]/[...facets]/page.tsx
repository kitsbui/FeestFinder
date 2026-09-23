import { LandingPage, landingMetadata } from '@/components/landing-page';

export const revalidate = 900;

// Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = landingMetadata('en');
export default LandingPage('en');
