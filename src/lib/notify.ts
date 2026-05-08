import { prisma } from "@/lib/prisma";

export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });
}

export async function notifyMany(
  userIds: string[],
  type: string,
  title: string,
  body: string,
  link?: string
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, body, link })),
  });
}
