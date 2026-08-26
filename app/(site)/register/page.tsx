import { RegisterForm } from "@/components/register-form";
import { getFormFields, getOpenJobCategories } from "@/lib/queries";

export default async function RegisterPage() {
  const [fields, categories] = await Promise.all([getFormFields(), getOpenJobCategories()]);
  return <RegisterForm fields={fields} categories={categories} />;
}
