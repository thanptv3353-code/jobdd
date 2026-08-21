import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CountriesProvider } from "@/components/countries-provider";
import { getCountries } from "@/lib/queries";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const countries = await getCountries();

  return (
    <CountriesProvider countries={countries}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </CountriesProvider>
  );
}
