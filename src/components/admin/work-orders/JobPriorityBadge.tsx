import { priorityLabels, type WorkOrderPriority } from "@/lib/mock/work-orders";

const styles: Record<WorkOrderPriority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  NORMAL: "bg-gray-100 text-gray-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function JobPriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
