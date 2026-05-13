import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// Voice call button is temporarily disabled on production so the public dashboard
// cannot burn through our Vapi free credit. Re-enable by uncommenting the import
// AND the <VoiceCallButton .../> tag below.
// import VoiceCallButton from "@/components/customer/VoiceCallButton";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  EN_ROUTE: "bg-blue-100 text-blue-800",
  ON_SITE: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/customer/dashboard");
  }

  const userId = session.user.id;

  const [user, workOrders, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    }),
    prisma.workOrder.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        priority: true,
        scheduledAt: true,
        address: true,
        createdAt: true,
        service: { select: { name: true } },
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {(user.name ?? "").split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
            : "You're all caught up."}
        </p>
      </div>

      {/*
        Voice call button disabled on production to protect Vapi free credit.
        Uncomment this block (and the import at the top of the file) to put the
        web-based "Call agent" button back on the customer dashboard.

        <VoiceCallButton
          customerName={user.name ?? undefined}
          customerId={userId}
          customerPhone={user.phone ?? undefined}
        />
      */}

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">My work orders</h2>
          <span className="text-xs text-gray-500">{workOrders.length} total</span>
        </div>

        {workOrders.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 px-6 py-10 text-center">
            <p className="text-sm text-gray-600">You don&apos;t have any work orders yet.</p>
            <p className="mt-1 text-xs text-gray-500">
              Call our voice line or use the contact form to raise a request.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Contact us
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {workOrders.map((wo) => (
              <li key={wo.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/share/${wo.referenceNumber}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    {wo.referenceNumber}
                  </Link>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {wo.service?.name ?? "General service"}
                    {wo.scheduledAt && (
                      <> · scheduled {new Date(wo.scheduledAt).toLocaleString()}</>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    STATUS_COLORS[wo.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {wo.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
