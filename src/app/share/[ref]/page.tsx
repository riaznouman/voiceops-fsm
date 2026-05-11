import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/print-button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  EN_ROUTE: "En route",
  ON_SITE: "On site",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  EN_ROUTE: "bg-blue-100 text-blue-800",
  ON_SITE: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { referenceNumber: ref },
    include: {
      customer: { select: { name: true, email: true, phone: true, address: true } },
      technician: { select: { name: true, phone: true } },
      service: { select: { name: true, description: true, basePrice: true } },
      logs: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          action: true,
          fromValue: true,
          toValue: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!wo) notFound();

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
          <PrintButton />
        </div>

        <article className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <header className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-base font-bold text-white">
                  V
                </span>
                <span className="text-lg font-bold text-gray-900">VoiceOps</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">Work order details</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Reference</p>
              <p className="font-mono text-lg font-bold text-gray-900">{wo.referenceNumber}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                  STATUS_COLORS[wo.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {STATUS_LABELS[wo.status] ?? wo.status}
              </span>
            </div>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Block title="Customer">
              <Field label="Name" value={wo.customer.name} />
              {wo.customer.email && <Field label="Email" value={wo.customer.email} />}
              {wo.customer.phone && <Field label="Phone" value={wo.customer.phone} />}
              {wo.customer.address && <Field label="Address" value={wo.customer.address} />}
            </Block>

            <Block title="Service">
              <Field label="Service" value={wo.service?.name ?? "General service"} />
              {wo.service?.description && (
                <Field label="Description" value={wo.service.description} />
              )}
              <Field label="Priority" value={wo.priority} />
              {wo.scheduledAt && (
                <Field label="Scheduled" value={new Date(wo.scheduledAt).toLocaleString()} />
              )}
              {wo.address && <Field label="Service address" value={wo.address} />}
            </Block>
          </section>

          {(wo.issueDescription || wo.resolutionNotes) && (
            <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {wo.issueDescription && (
                <Block title="Issue">
                  <p className="text-sm text-gray-700">{wo.issueDescription}</p>
                </Block>
              )}
              {wo.resolutionNotes && (
                <Block title="Resolution">
                  <p className="text-sm text-gray-700">{wo.resolutionNotes}</p>
                </Block>
              )}
            </section>
          )}

          {wo.technician && (
            <section className="mb-8">
              <Block title="Technician">
                <Field label="Name" value={wo.technician.name} />
                {wo.technician.phone && <Field label="Phone" value={wo.technician.phone} />}
              </Block>
            </section>
          )}

          {wo.logs.length > 0 && (
            <section className="mb-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Activity
              </h3>
              <ol className="space-y-3 border-l border-gray-200 pl-4">
                {wo.logs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 block h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600" />
                    <p className="text-sm font-medium text-gray-900">
                      {log.action.replace(/_/g, " ")}
                      {log.fromValue && log.toValue && (
                        <span className="font-normal text-gray-500">
                          {" "}
                          ({log.fromValue} → {log.toValue})
                        </span>
                      )}
                    </p>
                    {log.note && <p className="mt-0.5 text-xs text-gray-600">{log.note}</p>}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
            Generated {new Date().toLocaleString()} · VoiceOps
          </footer>
        </article>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
