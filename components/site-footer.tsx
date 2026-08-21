export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">Job DD</p>
            <p>ໂດຍ ສະມາຄົມທຸລະກິດບໍລິການຈັດຫາງານລາວ</p>
          </div>
          <div className="space-y-1">
            <p>ໂທ: 021 xxx xxx · ອີເມວ: info@jobdd.com</p>
            <p>© {new Date().getFullYear()} Job DD — ຕົວຢ່າງເວັບແອັບ (prototype)</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
