import Image from "next/image";
import type { Database } from "@/lib/supabase/database.types";

type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  const whatsappNumber = settings?.phone?.replace(/[^0-9]/g, "");

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <Image src="/leba-logo.jpg" alt="LEBA" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full" />
            <div>
              <p className="font-semibold text-foreground">Job DD</p>
              <p>
                ໂດຍ {settings?.org_name_lo}
                {settings?.org_abbreviation && ` (${settings.org_abbreviation})`}
              </p>
              {settings?.org_name_en && <p className="text-xs">{settings.org_name_en}</p>}

              {(settings?.facebook_url || settings?.tiktok_url || settings?.youtube_url) && (
                <div className="mt-3 flex gap-3">
                  {settings.facebook_url && (
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-700 hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                  {settings.tiktok_url && (
                    <a
                      href={settings.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-700 hover:underline"
                    >
                      TikTok
                    </a>
                  )}
                  {settings.youtube_url && (
                    <a
                      href={settings.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-700 hover:underline"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {settings?.phone && (
              <p>
                ໂທ/WhatsApp:{" "}
                {whatsappNumber ? (
                  <a
                    href={`https://wa.me/856${whatsappNumber.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-700 hover:underline"
                  >
                    {settings.phone}
                  </a>
                ) : (
                  settings.phone
                )}
              </p>
            )}
            {settings?.hotline && <p>ສາຍດ່ວນ: {settings.hotline}</p>}
            <p>© {new Date().getFullYear()} Job DD — ຕົວຢ່າງເວັບແອັບ (prototype)</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
