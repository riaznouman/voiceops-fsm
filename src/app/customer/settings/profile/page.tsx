import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/customer/profile-form";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/customer/settings/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  if (!user) redirect("/login");

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Profile</h2>
      <p className="mb-5 text-xs text-gray-500">Update your name and phone number.</p>
      <ProfileForm
        initial={{ name: user.name, email: user.email, phone: user.phone ?? "" }}
      />
    </section>
  );
}
