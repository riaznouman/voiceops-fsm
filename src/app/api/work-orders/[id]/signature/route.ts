import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    select: { id: true, technicianId: true },
  });
  if (!wo) {
    return NextResponse.json({ error: "We couldn't find that work order." }, { status: 404 });
  }

  // Permission: admin/manager OR the assigned technician
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes(me.role);
  const isAssignedTech = me.role === "TECHNICIAN" && wo.technicianId === me.userId;
  if (!isAdminOrManager && !isAssignedTech) {
    return NextResponse.json({ error: "Only the assigned technician or a manager can save a signature." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("signature") as File | null;
  if (!file) {
    return NextResponse.json({ error: "A signature is required to complete the job." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Store the signature as a base64 data URL on the row. This works on a
  // read-only serverless filesystem (e.g. Vercel) where writing into
  // public/uploads is not possible.
  const mimeType = file.type || "image/png";
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const filename = file.name || "signature.png";
  const signedAt = new Date();

  const updated = await prisma.workOrder.update({
    where: { id },
    data: {
      customerSignaturePath: dataUrl,
      customerSignatureAt: signedAt,
    },
    select: {
      id: true,
      referenceNumber: true,
      customerSignaturePath: true,
      customerSignatureAt: true,
    },
  });

  await logActivity(id, me.userId, "SIGNATURE_CAPTURED", undefined, undefined, filename);

  return NextResponse.json({
    url: updated.customerSignaturePath,
    signedAt: updated.customerSignatureAt,
    workOrder: updated,
  });
}
