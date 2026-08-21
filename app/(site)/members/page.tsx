import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCountries, getMembers } from "@/lib/queries";

export default async function MembersPage() {
  const [members, countries] = await Promise.all([getMembers(), getCountries()]);
  const countryLabel = (code: string) => countries.find((c) => c.code === code)?.label ?? code;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">ບໍລິສັດສະມາຊິກ</h1>
      <p className="mt-1 text-muted-foreground">
        ບໍລິສັດຈັດຫາງານທີ່ຖືກຮັບຮອງໂດຍສະມາຄົມ, ໂພສວຽກຜ່ານ Job DD
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{m.name}</p>
                {m.established_year && (
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    ຕັ້ງແຕ່ {m.established_year}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.country_focus.map((c) => (
                  <Badge key={c} variant="secondary">
                    {countryLabel(c)}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-emerald-700">
                {m.openJobCount} ຕຳແໜ່ງງານເປີດຮັບ
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
