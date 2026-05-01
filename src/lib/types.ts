export type WorkOrderStatus =
  | "PENDING"
  | "EN_ROUTE"
  | "ON_SITE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type WorkOrderPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type UserRole = "ADMIN" | "TECHNICIAN" | "CUSTOMER";

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  PENDING: "Pending",
  EN_ROUTE: "En Route",
  ON_SITE: "On Site",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  EN_ROUTE: "bg-blue-100 text-blue-800",
  ON_SITE: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_STYLES: Record<WorkOrderPriority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  NORMAL: "bg-gray-100 text-gray-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-800",
};
