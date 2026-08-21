import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lo"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
