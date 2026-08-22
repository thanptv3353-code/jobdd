import { AdminSiteSettings } from "@/components/admin-site-settings";
import { getSiteSettings } from "@/lib/queries";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return <AdminSiteSettings settings={settings} />;
}
