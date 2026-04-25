import { statusLabels, type WorkOrderStatus } from "@/lib/mock/work-orders";

const styles: Record<WorkOrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  EN_ROUTE: "bg-blue-100 text-blue-800",
  ON_SITE: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function JobStatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
