import { STATUS_LABELS, STATUS_STYLES, type WorkOrderStatus } from "@/lib/types";

export default function JobStatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
