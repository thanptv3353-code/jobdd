import { AdminFormBuilder } from "@/components/admin-form-builder";
import { getFormFields } from "@/lib/queries";

export default async function AdminFormBuilderPage() {
  const fields = await getFormFields();
  return <AdminFormBuilder fields={fields} />;
}
