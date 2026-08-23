import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Job DD — ຫາວຽກພາຍໃນ ແລະ ຕ່າງປະເທດ",
    short_name: "Job DD",
    description:
      "Job DD ໂດຍສະມາຄົມທຸລະກິດບໍລິການຈັດຫາງານລາວ — ຄົ້ນຫາ ແລະ ສະໝັກວຽກພາຍໃນ, ໄທ, ເກົາຫຼີ ແລະ ຢີ່ປຸ່ນ",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
