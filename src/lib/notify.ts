import { prisma } from "@/lib/prisma";
import { sendExpoPush } from "@/lib/expo-push";

export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (user?.pushToken) {
    await sendExpoPush({
      to: user.pushToken,
      title,
      body,
      data: { type, link },
    });
  }
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

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, pushToken: { not: null } },
    select: { pushToken: true },
  });

  await Promise.all(
    users
      .filter((u): u is { pushToken: string } => u.pushToken !== null)
      .map((u) =>
        sendExpoPush({ to: u.pushToken, title, body, data: { type, link } })
      )
  );
}
