import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job DD — ຫາງານພາຍໃນ ແລະ ຕ່າງປະເທດ",
  description:
    "Job DD ໂດຍສະມາຄົມທຸລະກິດບໍລິການຈັດຫາງານລາວ — ຄົ້ນຫາ ແລະ ສະໝັກວຽກພາຍໃນ, ໄທ, ເກົາຫຼີ ແລະ ຢີ່ປຸ່ນ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Job DD",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lo"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
