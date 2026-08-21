import { docLabel } from "@/lib/eligibility";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Requirement = Database["public"]["Tables"]["country_requirements"]["Row"];

export function CountryDocChecklist({
  requirements,
  documents,
}: {
  requirements: Requirement[];
  documents?: Record<string, boolean>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">ເອກະສານ</th>
            <th className="px-3 py-2 text-left font-medium">ຈຳເປັນ</th>
            {documents && <th className="px-3 py-2 text-left font-medium">ສະຖານະ</th>}
            <th className="px-3 py-2 text-left font-medium">ໝາຍເຫດ</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((r) => {
            const has = documents?.[r.doc_type];
            return (
              <tr key={r.doc_type} className="border-t">
                <td className="px-3 py-2">{docLabel(r.doc_type)}</td>
                <td className="px-3 py-2">{r.required ? "✅" : "–"}</td>
                {documents && (
                  <td className={cn("px-3 py-2", has ? "text-emerald-600" : "text-red-500")}>
                    {has ? "✅ ຄົບ" : "❌ ຍັງບໍ່ຄົບ"}
                  </td>
                )}
                <td className="px-3 py-2 text-muted-foreground">{r.note ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
