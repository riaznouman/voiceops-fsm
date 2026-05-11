import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/print-button";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

function money(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { referenceNumber: ref },
    include: {
      customer: { select: { name: true, email: true, phone: true, address: true } },
      workOrder: { select: { referenceNumber: true } },
      lineItems: { orderBy: { id: "asc" } },
    },
  });

  if (!invoice) notFound();

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
              <p className="mt-2 text-xs text-gray-500">Tax Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Invoice number
              </p>
              <p className="font-mono text-lg font-bold text-gray-900">
                {invoice.referenceNumber}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                  STATUS_COLORS[invoice.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </header>

          <section className="mb-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Bill to
              </h3>
              <p className="font-medium text-gray-900">{invoice.customer.name}</p>
              {invoice.customer.email && (
                <p className="text-gray-600">{invoice.customer.email}</p>
              )}
              {invoice.customer.phone && (
                <p className="text-gray-600">{invoice.customer.phone}</p>
              )}
              {invoice.customer.address && (
                <p className="text-gray-600">{invoice.customer.address}</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Details
              </h3>
              <p className="text-gray-700">
                Issued: {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
              {invoice.dueDate && (
                <p className="text-gray-700">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              )}
              {invoice.workOrder && (
                <p className="text-gray-700">
                  Work order:{" "}
                  <Link
                    href={`/share/${invoice.workOrder.referenceNumber}`}
                    className="font-medium text-blue-600 hover:underline print:text-gray-900"
                  >
                    {invoice.workOrder.referenceNumber}
                  </Link>
                </p>
              )}
            </div>
          </section>

          <section className="mb-8 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 w-20 text-right">Qty</th>
                  <th className="px-4 py-2.5 w-28 text-right">Unit price</th>
                  <th className="px-4 py-2.5 w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No line items.
                    </td>
                  </tr>
                ) : (
                  invoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="px-4 py-2.5 text-gray-700">{li.description}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{li.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">
                        {money(li.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                        {money(li.lineTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="ml-auto w-full max-w-xs space-y-2 text-sm">
            <Row label="Subtotal" value={money(invoice.subtotal)} />
            <Row
              label={`GST (${(invoice.taxRate * 100).toFixed(0)}%)`}
              value={money(invoice.taxAmount)}
            />
            <div className="border-t border-gray-200 pt-2">
              <Row label="Total" value={money(invoice.total)} bold />
            </div>
          </section>

          {invoice.notes && (
            <section className="mt-8 rounded-md border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
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

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-gray-900" : "text-gray-600"}>
        {label}
      </span>
      <span className={bold ? "font-bold text-gray-900" : "font-medium text-gray-900"}>
        {value}
      </span>
    </div>
  );
}
