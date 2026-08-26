import { RegisterForm } from "@/components/register-form";
import { getFormFields, getLaoAdminDivisions, getOpenJobCategories } from "@/lib/queries";

export default async function RegisterPage() {
  const [fields, categories, divisions] = await Promise.all([
    getFormFields(),
    getOpenJobCategories(),
    getLaoAdminDivisions(),
  ]);
  return (
    <RegisterForm
      fields={fields}
      categories={categories}
      provinces={divisions.provinces}
      districts={divisions.districts}
    />
  );
}
