export const siteConfig = {
  siteName: "Julien Getaround",
  siteTagline: "Portefeuille · Getaround · PEA · Crypto",
  url: "https://julien-getaround.netlify.app",
  themeColor: "#0f1c2e",
  defaultTaxRatePercent: 30,
  defaultSocialRatePercent: 17.2,
  robots: "noindex, nofollow",
  /** Seul email autorisé à se connecter / créer un compte. */
  allowedEmails: ["zyredfox2310@gmail.com"] as const,
} as const;

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return siteConfig.allowedEmails.some(
    (allowed) => allowed.toLowerCase() === normalized,
  );
}

export function seoTitle(pageTitle: string): string {
  return `${pageTitle} | ${siteConfig.siteName}`;
}
