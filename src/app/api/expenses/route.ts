import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let userId: string | undefined;
  if (me.role === "TECHNICIAN" || me.role === "CUSTOMER") {
    userId = me.userId;
  } else if (userIdParam) {
    userId = userIdParam;
  }

  const where: {
    userId?: string;
    date?: { gte?: Date; lte?: Date };
  } = {};
  if (userId) where.userId = userId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  const data = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      workOrder: { select: { id: true, referenceNumber: true } },
      user: { select: { id: true, name: true } },
    },
  });

  const totalAmount = data.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ data, totalAmount });
}

export async function POST(request: NextRequest) {
  let me;
  try {
    me = await getCurrentUser(request);
  } catch (err: unknown) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let date: Date;
  let description: string;
  let amount: number;
  let workOrderId: string | null = null;
  let receiptPath: string | null = null;

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await request.formData();
    const dateRaw = formData.get("date");
    const descriptionRaw = formData.get("description");
    const amountRaw = formData.get("amount");
    const workOrderIdRaw = formData.get("workOrderId");
    const receipt = formData.get("receipt") as File | null;

    if (!dateRaw || !descriptionRaw || !amountRaw) {
      return NextResponse.json(
        { error: "date, description, amount are required" },
        { status: 400 }
      );
    }
    date = new Date(String(dateRaw));
    description = String(descriptionRaw);
    amount = parseFloat(String(amountRaw));
    if (workOrderIdRaw) workOrderId = String(workOrderIdRaw);

    if (receipt) {
      const bytes = await receipt.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const safeName = (receipt.name || "receipt.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${timestamp}_${safeName}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "expenses", me.userId);
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      receiptPath = `/uploads/expenses/${me.userId}/${filename}`;
    }
  } else {
    const body = await request.json();
    if (!body.date || !body.description || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "date, description, amount are required" },
        { status: 400 }
      );
    }
    date = new Date(body.date);
    description = body.description;
    amount = body.amount;
    if (body.workOrderId) workOrderId = body.workOrderId;
  }

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
  }
  if (!description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      userId: me.userId,
      workOrderId,
      date,
      description: description.trim(),
      amount,
      receiptPath,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
