import { PRIORITY_LABELS, PRIORITY_STYLES, type WorkOrderPriority } from "@/lib/types";

export default function JobPriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[priority] ?? "bg-gray-100 text-gray-700"}`}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}
