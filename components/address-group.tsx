"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/database.types";

type Province = Database["public"]["Tables"]["provinces"]["Row"];
type District = Database["public"]["Tables"]["districts"]["Row"];

export function AddressGroup({
  title,
  village,
  district,
  province,
  onVillage,
  onDistrict,
  onProvince,
  provinces = [],
  districts = [],
}: {
  title: string;
  village: string;
  district: string;
  province: string;
  onVillage: (v: string) => void;
  onDistrict: (v: string) => void;
  onProvince: (v: string) => void;
  provinces?: Province[];
  districts?: District[];
}) {
  const provinceCode = provinces.find((p) => p.name === province)?.code;
  const districtOptions = useMemo(
    () => districts.filter((d) => d.province_code === provinceCode),
    [districts, provinceCode]
  );

  // Profiles saved before the lists existed can hold a district that is not in
  // the current province's options; keep showing it rather than silently
  // clearing what someone already entered.
  const unlisted = district && !districtOptions.some((d) => d.name === district);

  // Fall back to free text if the divisions have not been imported yet.
  if (provinces.length === 0) {
    return (
      <Fieldset title={title}>
        <Input value={village} onChange={(e) => onVillage(e.target.value)} placeholder="ບ້ານ" />
        <Input value={district} onChange={(e) => onDistrict(e.target.value)} placeholder="ເມືອງ" />
        <Input value={province} onChange={(e) => onProvince(e.target.value)} placeholder="ແຂວງ" />
      </Fieldset>
    );
  }

  return (
    <Fieldset title={title}>
      <Input value={village} onChange={(e) => onVillage(e.target.value)} placeholder="ບ້ານ" />

      <Select
        value={district}
        onValueChange={onDistrict}
        disabled={!provinceCode}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={provinceCode ? "ເມືອງ" : "ເລືອກແຂວງກ່ອນ"} />
        </SelectTrigger>
        <SelectContent>
          {unlisted && <SelectItem value={district}>{district}</SelectItem>}
          {districtOptions.map((d) => (
            <SelectItem key={d.code} value={d.name}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={province}
        onValueChange={(v) => {
          onProvince(v);
          onDistrict(""); // districts belong to a province
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="ແຂວງ" />
        </SelectTrigger>
        <SelectContent>
          {province && !provinces.some((p) => p.name === province) && (
            <SelectItem value={province}>{province}</SelectItem>
          )}
          {provinces.map((p) => (
            <SelectItem key={p.code} value={p.name}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Fieldset>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="grid gap-2 sm:grid-cols-3">{children}</div>
    </div>
  );
}
