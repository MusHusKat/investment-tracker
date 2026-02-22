import { AppShell } from "@/components/layout/AppShell";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewPropertyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <AppShell>
      <div className="max-w-2xl">
        <PropertyForm mode="create" />
      </div>
    </AppShell>
  );
}
