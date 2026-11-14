import { Helmet } from "react-helmet-async";
import { seoTitle, siteConfig } from "@/config/site";

type SeoProps = {
  title: string;
  description?: string;
};

export function Seo({ title, description }: SeoProps) {
  const fullTitle = seoTitle(title);
  const desc =
    description ??
    `${siteConfig.siteTagline} — outil privé, non indexé.`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={siteConfig.robots} />
      <meta name="theme-color" content={siteConfig.themeColor} />
    </Helmet>
  );
}
