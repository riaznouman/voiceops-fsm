import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  void user;
  const { id } = await params;

  const photos = await prisma.workOrderPhoto.findMany({
    where: { workOrderId: id },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(photos);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder) {
    return NextResponse.json({ error: "We couldn't find that work order." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Please attach a photo before uploading." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Store the photo as a base64 data URL on the row, so uploads work on a
  // read-only serverless filesystem (e.g. Vercel) instead of public/uploads.
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${timestamp}_${safeName}`;
  const mimeType = file.type || "image/jpeg";
  const url = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const photo = await prisma.workOrderPhoto.create({
    data: {
      workOrderId: id,
      uploadedById: user.userId,
      url,
      filename,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  await logActivity(id, user.userId, "PHOTO_UPLOADED", undefined, undefined, filename);

  return NextResponse.json({ url, photo }, { status: 201 });
}
