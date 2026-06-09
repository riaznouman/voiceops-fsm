import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const INVOICE_STATUS_COLORS: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default async function CustomerInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/customer/invoices");
  }

  const userId = session.user.id;

  const invoices = await prisma.invoice.findMany({
    where: { customerId: userId, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      subtotal: true,
      taxAmount: true,
      total: true,
      dueDate: true,
      createdAt: true,
      workOrder: { select: { referenceNumber: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invoices issued for your jobs. We also email a copy when an invoice is sent.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        {invoices.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 px-6 py-12 text-center">
            <p className="text-sm text-gray-600">You don&apos;t have any invoices yet.</p>
            <p className="mt-1 text-xs text-gray-500">
              Invoices appear here once we issue them for a completed job.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{inv.referenceNumber}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Issued {new Date(inv.createdAt).toLocaleDateString()}
                    {inv.dueDate && <> · due {new Date(inv.dueDate).toLocaleDateString()}</>}
                    {inv.workOrder?.referenceNumber && (
                      <> · job {inv.workOrder.referenceNumber}</>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-gray-900">
                    ${inv.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    incl. ${inv.taxAmount.toFixed(2)} GST
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
