export type WorkOrderStatus =
  | "PENDING"
  | "EN_ROUTE"
  | "ON_SITE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type WorkOrderPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface MockWorkOrder {
  ref: string;
  customer: string;
  service: string;
  scheduledAt: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  technician: string | null;
}

export const statusOptions: { value: WorkOrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "EN_ROUTE", label: "En Route" },
  { value: "ON_SITE", label: "On Site" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const statusLabels: Record<WorkOrderStatus, string> = {
  PENDING: "Pending",
  EN_ROUTE: "En Route",
  ON_SITE: "On Site",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const priorityLabels: Record<WorkOrderPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const mockWorkOrders: MockWorkOrder[] = [
  {
    ref: "WO-2026-0042",
    customer: "Ben Carter",
    service: "In-house Repair",
    scheduledAt: "2026-04-25 11:30",
    status: "PENDING",
    priority: "NORMAL",
    technician: null,
  },
  {
    ref: "WO-2026-0041",
    customer: "Lisa Wang",
    service: "On-site Repair",
    scheduledAt: "2026-04-25 10:00",
    status: "IN_PROGRESS",
    priority: "HIGH",
    technician: "John Smith",
  },
  {
    ref: "WO-2026-0040",
    customer: "Omar Hassan",
    service: "Pickup",
    scheduledAt: "2026-04-25 09:15",
    status: "EN_ROUTE",
    priority: "URGENT",
    technician: "Maria Torres",
  },
  {
    ref: "WO-2026-0039",
    customer: "Sarah Kim",
    service: "Delivery",
    scheduledAt: "2026-04-25 08:45",
    status: "COMPLETED",
    priority: "NORMAL",
    technician: "Tom Nguyen",
  },
  {
    ref: "WO-2026-0038",
    customer: "James Patel",
    service: "On-site Repair",
    scheduledAt: "2026-04-25 08:00",
    status: "COMPLETED",
    priority: "LOW",
    technician: "Priya Nair",
  },
  {
    ref: "WO-2026-0037",
    customer: "Aisha Rahman",
    service: "In-house Repair",
    scheduledAt: "2026-04-24 16:30",
    status: "ON_SITE",
    priority: "HIGH",
    technician: "David Lee",
  },
  {
    ref: "WO-2026-0036",
    customer: "Henry Wilson",
    service: "Pickup",
    scheduledAt: "2026-04-24 14:00",
    status: "CANCELLED",
    priority: "NORMAL",
    technician: null,
  },
  {
    ref: "WO-2026-0035",
    customer: "Fatima Noor",
    service: "On-site Repair",
    scheduledAt: "2026-04-24 13:15",
    status: "COMPLETED",
    priority: "URGENT",
    technician: "Maria Torres",
  },
  {
    ref: "WO-2026-0034",
    customer: "Daniel Brooks",
    service: "Delivery",
    scheduledAt: "2026-04-24 11:00",
    status: "PENDING",
    priority: "LOW",
    technician: null,
  },
  {
    ref: "WO-2026-0033",
    customer: "Mei Chen",
    service: "In-house Repair",
    scheduledAt: "2026-04-24 09:30",
    status: "IN_PROGRESS",
    priority: "NORMAL",
    technician: "John Smith",
  },
  {
    ref: "WO-2026-0032",
    customer: "Robert Hall",
    service: "On-site Repair",
    scheduledAt: "2026-04-23 17:00",
    status: "COMPLETED",
    priority: "HIGH",
    technician: "Tom Nguyen",
  },
  {
    ref: "WO-2026-0031",
    customer: "Yuki Tanaka",
    service: "Pickup",
    scheduledAt: "2026-04-23 15:45",
    status: "EN_ROUTE",
    priority: "URGENT",
    technician: "Priya Nair",
  },
  {
    ref: "WO-2026-0030",
    customer: "Liam O'Connor",
    service: "Delivery",
    scheduledAt: "2026-04-23 13:30",
    status: "COMPLETED",
    priority: "NORMAL",
    technician: "David Lee",
  },
  {
    ref: "WO-2026-0029",
    customer: "Priscilla Adeyemi",
    service: "In-house Repair",
    scheduledAt: "2026-04-23 11:00",
    status: "PENDING",
    priority: "NORMAL",
    technician: null,
  },
  {
    ref: "WO-2026-0028",
    customer: "Marco Rossi",
    service: "On-site Repair",
    scheduledAt: "2026-04-23 09:00",
    status: "ON_SITE",
    priority: "HIGH",
    technician: "Maria Torres",
  },
  {
    ref: "WO-2026-0027",
    customer: "Sophia Garcia",
    service: "Pickup",
    scheduledAt: "2026-04-22 16:15",
    status: "COMPLETED",
    priority: "LOW",
    technician: "John Smith",
  },
  {
    ref: "WO-2026-0026",
    customer: "Arjun Mehta",
    service: "Delivery",
    scheduledAt: "2026-04-22 14:45",
    status: "CANCELLED",
    priority: "NORMAL",
    technician: null,
  },
  {
    ref: "WO-2026-0025",
    customer: "Emma Schultz",
    service: "In-house Repair",
    scheduledAt: "2026-04-22 12:30",
    status: "COMPLETED",
    priority: "URGENT",
    technician: "Tom Nguyen",
  },
];
