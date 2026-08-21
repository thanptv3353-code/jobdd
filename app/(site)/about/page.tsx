import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">ກ່ຽວກັບ Job DD</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Job DD ເປັນເວັບແອັບຂອງ <strong>ສະມາຄົມທຸລະກິດບໍລິການຈັດຫາງານລາວ</strong> ສ້າງຂຶ້ນເພື່ອເປັນຊ່ອງທາງກາງ
        ໃຫ້ບໍລິສັດສະມາຊິກປະກາດຮັບສະໝັກແຮງງານ ແລະ ໃຫ້ຜູ້ຫາງານສາມາດຄົ້ນຫາ ແລະ ສະໝັກວຽກໄດ້ຢ່າງອອນໄລນ໌
        ທັງວຽກພາຍໃນປະເທດ ແລະ ວຽກຢູ່ຕ່າງປະເທດ (ໄທ, ເກົາຫຼີ, ຢີ່ປຸ່ນ) ຜ່ານຊ່ອງທາງທີ່ຖືກຕ້ອງຕາມກົດໝາຍ.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl">🛡️</p>
            <p className="mt-2 font-semibold">ປອດໄພ ຖືກຕ້ອງ</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ສະເພາະບໍລິສັດສະມາຊິກທີ່ຜ່ານການຮັບຮອງເທົ່ານັ້ນ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl">📋</p>
            <p className="mt-2 font-semibold">ເອກະສານຄົບຖ້ວນ</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ລະບົບບອກເອກະສານທີ່ຕ້ອງກຽມສະເພາະແຕ່ລະປະເທດ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl">📞</p>
            <p className="mt-2 font-semibold">ຕິດຕາມສະຖານະ</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ຮູ້ວ່າໃບສະໝັກຮອດຂັ້ນໃດແລ້ວ ບໍ່ຕ້ອງໂທຖາມເອງ
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
