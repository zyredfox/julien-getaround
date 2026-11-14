export const siteConfig = {
  siteName: "Julien Getaround",
  siteTagline: "Bilan locations & dépenses",
  url: "https://julien-getaround.netlify.app",
  themeColor: "#0f1c2e",
  defaultTaxRatePercent: 30,
  robots: "noindex, nofollow",
} as const;

export function seoTitle(pageTitle: string): string {
  return `${pageTitle} | ${siteConfig.siteName}`;
}
