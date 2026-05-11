import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusButtons from "./status-buttons";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["PENDING", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  EN_ROUTE: "bg-blue-100 text-blue-800",
  ON_SITE: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default async function TechnicianDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/technician/dashboard");
  }

  const userId = session.user.id;

  const [active, completedRecent] = await Promise.all([
    prisma.workOrder.findMany({
      where: { technicianId: userId, status: { in: [...ACTIVE_STATUSES] } },
      orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        priority: true,
        scheduledAt: true,
        address: true,
        issueDescription: true,
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.workOrder.count({
      where: {
        technicianId: userId,
        status: "COMPLETED",
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hi, {session.user.name?.split(" ")[0] ?? "Tech"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your assigned jobs. Update status as you go.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Active jobs" value={active.length} />
        <Stat label="Completed (7 days)" value={completedRecent} />
        <Stat label="High priority" value={active.filter((w) => w.priority !== "NORMAL").length} />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Active jobs</h2>
        </div>

        {active.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Nothing on your list right now.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {active.map((wo) => (
              <li key={wo.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {wo.referenceNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_COLORS[wo.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {wo.status.replace("_", " ")}
                      </span>
                      {wo.priority !== "NORMAL" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          {wo.priority}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {wo.service?.name ?? "General service"}
                      {wo.customer?.name && <> · {wo.customer.name}</>}
                    </div>
                    {wo.address && (
                      <div className="mt-0.5 text-xs text-gray-500">{wo.address}</div>
                    )}
                    {wo.scheduledAt && (
                      <div className="mt-0.5 text-xs text-gray-500">
                        Scheduled {new Date(wo.scheduledAt).toLocaleString()}
                      </div>
                    )}
                    {wo.issueDescription && (
                      <p className="mt-2 text-xs text-gray-600">{wo.issueDescription}</p>
                    )}
                  </div>
                  <StatusButtons id={wo.id} status={wo.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
