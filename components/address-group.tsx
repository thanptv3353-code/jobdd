import { Input } from "@/components/ui/input";

export function AddressGroup({
  title,
  village,
  district,
  province,
  onVillage,
  onDistrict,
  onProvince,
}: {
  title: string;
  village: string;
  district: string;
  province: string;
  onVillage: (v: string) => void;
  onDistrict: (v: string) => void;
  onProvince: (v: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        <Input value={village} onChange={(e) => onVillage(e.target.value)} placeholder="ບ້ານ" />
        <Input value={district} onChange={(e) => onDistrict(e.target.value)} placeholder="ເມືອງ" />
        <Input value={province} onChange={(e) => onProvince(e.target.value)} placeholder="ແຂວງ" />
      </div>
    </div>
  );
}
