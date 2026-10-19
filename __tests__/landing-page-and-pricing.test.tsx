import fs from 'fs';
import path from 'path';
import { PLAN_LIMITS } from '@/config/plans';

describe('Landing Page Redesign & Pricing Consistency Verification', () => {
  const landingPageFile = path.join(process.cwd(), 'src/app/(public)/LandingPageClient.tsx');
  const landingContent = fs.readFileSync(landingPageFile, 'utf8');

  const publicHeaderFile = path.join(process.cwd(), 'src/components/public/PublicHeader.tsx');
  const headerContent = fs.readFileSync(publicHeaderFile, 'utf8');

  const publicFooterFile = path.join(process.cwd(), 'src/components/public/PublicFooter.tsx');
  const footerContent = fs.readFileSync(publicFooterFile, 'utf8');

  it('strictly forbids rounded-full pill badges on landing page and public components', () => {
    // Zero rounded-full in LandingPageClient
    expect(landingContent).not.toContain('rounded-full');

    // Zero rounded-full in PublicHeader
    expect(headerContent).not.toContain('rounded-full');

    // Zero rounded-full in PublicFooter
    expect(footerContent).not.toContain('rounded-full');
  });

  it('verifies pricing limits and numbers match exact specifications', () => {
    // Starter: $0/month, 2 custom sections, 5 members
    expect(PLAN_LIMITS.free.price).toBe('$0');
    expect(PLAN_LIMITS.free.maxCustomSections).toBe(2);
    expect(PLAN_LIMITS.free.maxMembers).toBe(5);

    // Pro: $3.69/month, 10 custom sections, 10 members
    expect(PLAN_LIMITS.pro.price).toBe('$3.69');
    expect(PLAN_LIMITS.pro.maxCustomSections).toBe(10);
    expect(PLAN_LIMITS.pro.maxMembers).toBe(10);

    // Enterprise: Custom pricing, 100 custom sections, unlimited members
    expect(PLAN_LIMITS.enterprise.price).toBe('Custom');
    expect(PLAN_LIMITS.enterprise.maxCustomSections).toBe(100);
    expect(PLAN_LIMITS.enterprise.maxMembers).toBeGreaterThan(100);
  });

  it('ensures Platform Admin console access is NOT marketed as a customer subscription feature', () => {
    // Must NOT exist in landing page pricing claims
    expect(landingContent).not.toContain('Platform Admin console access');

    // Must NOT exist in config plans
    const allFeatureLabels = Object.values(PLAN_LIMITS).flatMap(p => p.featureLabels);
    expect(allFeatureLabels.some(l => l.includes('Platform Admin console'))).toBe(false);
  });

  it('ensures Pricing CTA buttons link to valid functional destinations', () => {
    // Starter links to registration with individual type
    expect(landingContent).toContain('/register?type=individual');

    // Pro links to upgrade pricing or checkout
    expect(landingContent).toContain('/pricing');

    // Enterprise links to sales contact
    expect(landingContent).toContain('/contact');
  });

  it('includes FAQ and navigation links in public header and footer', () => {
    expect(headerContent).toContain('href="/faq"');
    expect(footerContent).toContain('"/faq"');
    expect(headerContent).toContain('href="/features"');
    expect(headerContent).toContain('href="/pricing"');
    expect(headerContent).toContain('href="/security"');
  });

  it('preserves Manageo and Team Workspace separation in marketing copy', () => {
    expect(landingContent).toContain('Personal Operating System');
    expect(landingContent).toContain('Team Workspaces');
    expect(landingContent).toContain('Zero Data Contamination');
    expect(landingContent).toContain('AES-256-GCM');
  });
});
