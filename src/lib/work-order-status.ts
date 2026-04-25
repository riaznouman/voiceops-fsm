import type { WorkOrderStatus } from "@prisma/client";

export const VALID_STATUSES: WorkOrderStatus[] = [
  "PENDING",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const ALLOWED_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ["EN_ROUTE", "IN_PROGRESS", "CANCELLED"],
  EN_ROUTE: ["ON_SITE", "CANCELLED"],
  ON_SITE: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(
    public from: WorkOrderStatus,
    public to: WorkOrderStatus,
    public allowed: WorkOrderStatus[]
  ) {
    super(`Cannot transition from ${from} to ${to}`);
  }
}

export function assertTransition(from: WorkOrderStatus, to: WorkOrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to, ALLOWED_TRANSITIONS[from]);
  }
}
