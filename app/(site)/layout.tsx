import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CountriesProvider } from "@/components/countries-provider";
import { getCountries, getSiteSettings } from "@/lib/queries";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [countries, settings] = await Promise.all([getCountries(), getSiteSettings()]);

  return (
    <CountriesProvider countries={countries}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </CountriesProvider>
  );
}
