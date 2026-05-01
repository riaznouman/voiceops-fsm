import { prisma } from "@/lib/prisma";

export async function logActivity(
  workOrderId: string,
  actorId: string,
  action: string,
  fromValue?: string,
  toValue?: string,
  note?: string
) {
  await prisma.activityLog.create({
    data: { workOrderId, actorId, action, fromValue, toValue, note },
  });
}
