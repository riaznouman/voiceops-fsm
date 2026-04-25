export const jobColumns = [
  { key: "ref", label: "Ref" },
  { key: "customer", label: "Customer" },
  { key: "service", label: "Service" },
  { key: "scheduledAt", label: "Scheduled at" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "technician", label: "Technician" },
  { key: "actions", label: "Actions" },
] as const;

export const headCellClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200";

export const bodyCellClass = "px-3 py-3 text-[13px] text-gray-700 border-b border-gray-100";
