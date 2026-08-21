import { RegisterForm } from "@/components/register-form";
import { getFormFields } from "@/lib/queries";

export default async function RegisterPage() {
  const fields = await getFormFields();
  return <RegisterForm fields={fields} />;
}
