import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { notify } from "@/lib/notify";

export async function check_availability(date: string, serviceType: string) {
  const baseDate = new Date(date);
  if (isNaN(baseDate.getTime())) {
    return { error: "Invalid date" };
  }

  const slots: string[] = [];

  for (let dayOffset = 0; dayOffset < 3 && slots.length < 3; dayOffset++) {
    const day = new Date(baseDate);
    day.setDate(day.getDate() + dayOffset);

    for (let hour = 9; hour < 17 && slots.length < 3; hour++) {
      const slotTime = new Date(day);
      slotTime.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotTime);
      slotEnd.setHours(slotEnd.getHours() + 1);

      const busyTechs = await prisma.workOrder.findMany({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS", "EN_ROUTE", "ON_SITE"] },
          scheduledAt: { gte: slotTime, lt: slotEnd },
          technicianId: { not: null },
        },
        select: { technicianId: true },
      });

      const busyIds = busyTechs.map((w) => w.technicianId as string);

      const availableTech = await prisma.user.findFirst({
        where: {
          role: "TECHNICIAN",
          status: "ACTIVE",
          id: { notIn: busyIds },
        },
      });

      if (availableTech) {
        slots.push(slotTime.toISOString());
      }
    }
  }

  void serviceType;
  return { availableSlots: slots };
}

export async function create_booking(
  customerName: string,
  customerPhone: string,
  serviceId: string,
  scheduledAt: string,
  address: string
) {
  const normalizedPhone = customerPhone.replace(/\D/g, "");
  const tempEmail = `${normalizedPhone}@voiceops.local`;

  let customer = await prisma.user.findFirst({
    where: { phone: customerPhone, role: "CUSTOMER" },
  });

  if (!customer) {
    const { hash } = await import("bcryptjs");
    const tempPassword = await hash(Math.random().toString(36).slice(2), 10);
    customer = await prisma.user.create({
      data: {
        name: customerName,
        email: tempEmail,
        password: tempPassword,
        phone: customerPhone,
        role: "CUSTOMER",
      },
    });
  }

  const count = await prisma.workOrder.count();
  const referenceNumber = `VO-${String(count + 1).padStart(5, "0")}`;

  const workOrder = await prisma.workOrder.create({
    data: {
      referenceNumber,
      customerId: customer.id,
      serviceId: serviceId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      address,
      status: "PENDING",
      priority: "NORMAL",
    },
  });

  let suggestedTechnicianId: string | null = null;

  if (serviceId) {
    const serviceSkills = await prisma.serviceSkill.findMany({
      where: { serviceId },
      select: { skillId: true },
    });
    const requiredSkillIds = serviceSkills.map((s) => s.skillId);

    const techs = await prisma.user.findMany({
      where: { role: "TECHNICIAN", status: "ACTIVE" },
      include: { technicianSkills: { select: { skillId: true } } },
    });

    for (const tech of techs) {
      const techSkillIds = tech.technicianSkills.map((ts) => ts.skillId);
      const hasAll = requiredSkillIds.every((id) => techSkillIds.includes(id));
      if (hasAll) {
        suggestedTechnicianId = tech.id;
        break;
      }
    }
  }

  await logActivity(workOrder.id, customer.id, "CREATED", undefined, "PENDING", "Booked via voice");

  const manager = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  if (manager) {
    await notify(
      manager.id,
      "NEW_BOOKING",
      "New booking via voice",
      `Work order ${referenceNumber} created for ${customerName}`,
      `/admin/work-orders/${workOrder.id}`
    );
  }

  return { referenceNumber, workOrderId: workOrder.id, suggestedTechnicianId };
}

export async function get_customer(phone: string) {
  const customer = await prisma.user.findFirst({
    where: { phone, role: "CUSTOMER" },
    select: { id: true, name: true, phone: true, email: true },
  });
  return customer ?? null;
}
