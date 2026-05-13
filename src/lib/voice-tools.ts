import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { notify } from "@/lib/notify";
import { createWithRef } from "@/lib/ref-number";
import type { Prisma } from "@prisma/client";

export async function check_availability(date: string, serviceType: string) {
  console.log("[VAPI:tool] check_availability →", { date, serviceType });

  const baseDate = new Date(date);
  if (isNaN(baseDate.getTime())) {
    console.warn("[VAPI:tool] check_availability invalid date", date);
    return { error: "Invalid date" };
  }

  let requiredSkillIds: string[] = [];
  if (serviceType) {
    const service =
      (await prisma.service.findFirst({
        where: {
          OR: [
            { id: serviceType },
            { slug: serviceType },
            { name: { equals: serviceType, mode: "insensitive" } },
          ],
        },
        include: { serviceSkills: { select: { skillId: true } } },
      })) ??
      (await prisma.service.findFirst({
        where: { name: { contains: serviceType, mode: "insensitive" } },
        include: { serviceSkills: { select: { skillId: true } } },
      }));
    if (service) {
      requiredSkillIds = service.serviceSkills.map((s) => s.skillId);
      console.log("[VAPI:tool] check_availability matched service", {
        id: service.id,
        name: service.name,
        requiredSkillIds,
      });
    } else {
      console.log("[VAPI:tool] check_availability no service matched for", serviceType);
    }
  }

  const skillFilter: Prisma.UserWhereInput = requiredSkillIds.length
    ? { AND: requiredSkillIds.map((skillId) => ({ technicianSkills: { some: { skillId } } })) }
    : {};

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
          ...skillFilter,
        },
      });

      if (availableTech) {
        slots.push(slotTime.toISOString());
      }
    }
  }

  console.log("[VAPI:tool] check_availability ← slots:", slots);
  return { availableSlots: slots };
}

export async function create_booking(
  customerName: string,
  customerPhone: string,
  serviceId: string,
  scheduledAt: string,
  address: string,
  customerId?: string | null
) {
  console.log("[VAPI:tool] create_booking →", {
    customerName,
    customerPhone,
    serviceId,
    scheduledAt,
    address,
    customerId,
  });

  // Service: AI usually passes a name like "plumbing", not a UUID. Try id, slug,
  // exact name, then a fuzzy `contains` match so partial names still attach.
  let resolvedServiceId: string | null = null;
  if (serviceId) {
    const service =
      (await prisma.service.findFirst({
        where: {
          OR: [
            { id: serviceId },
            { slug: serviceId },
            { name: { equals: serviceId, mode: "insensitive" } },
          ],
        },
      })) ??
      (await prisma.service.findFirst({
        where: { name: { contains: serviceId, mode: "insensitive" } },
      }));
    if (service) {
      resolvedServiceId = service.id;
      console.log("[VAPI:tool] create_booking resolved service", {
        input: serviceId,
        id: service.id,
        name: service.name,
      });
    } else {
      console.warn("[VAPI:tool] create_booking no service matched for", serviceId);
    }
  }

  // Customer: if we already know who the caller is (web-call user passed their
  // own id), use that account directly. Otherwise fall back to phone lookup,
  // then create a new customer as a last resort.
  let customer = null;
  if (customerId) {
    customer = await prisma.user.findFirst({
      where: { id: customerId, role: "CUSTOMER" },
    });
    if (customer) {
      console.log("[VAPI:tool] create_booking matched known customerId", {
        id: customer.id,
        name: customer.name,
      });
    } else {
      console.warn("[VAPI:tool] create_booking customerId not found, falling back to phone lookup", customerId);
    }
  }

  if (!customer && customerPhone) {
    customer = await prisma.user.findFirst({
      where: { phone: customerPhone, role: "CUSTOMER" },
    });
    if (customer) {
      console.log("[VAPI:tool] create_booking matched by phone", { id: customer.id, name: customer.name });
    }
  }

  if (!customer) {
    const normalizedPhone = customerPhone.replace(/\D/g, "");
    const tempEmail = `${normalizedPhone}@voiceops.local`;
    console.log("[VAPI:tool] create_booking creating new customer", { name: customerName, phone: customerPhone });
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

  let suggestedTechnicianId: string | null = null;

  if (resolvedServiceId) {
    const serviceSkills = await prisma.serviceSkill.findMany({
      where: { serviceId: resolvedServiceId },
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
    console.log("[VAPI:tool] create_booking technician match", {
      serviceId: resolvedServiceId,
      requiredSkillIds,
      candidateCount: techs.length,
      suggestedTechnicianId,
    });
  }

  const workOrder = await createWithRef(
    "VO",
    () => prisma.workOrder.count(),
    (referenceNumber) =>
      prisma.workOrder.create({
        data: {
          referenceNumber,
          customerId: customer.id,
          serviceId: resolvedServiceId,
          technicianId: suggestedTechnicianId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          address,
          status: "PENDING",
          priority: "NORMAL",
        },
      })
  );

  console.log("[VAPI:tool] create_booking work order created", {
    id: workOrder.id,
    ref: workOrder.referenceNumber,
  });

  await logActivity(workOrder.id, customer.id, "CREATED", undefined, "PENDING", "Booked via voice");
  if (suggestedTechnicianId) {
    await logActivity(workOrder.id, customer.id, "ASSIGNED", undefined, suggestedTechnicianId, "Auto-assigned via voice");
  }

  const manager = await prisma.user.findFirst({ where: { role: "MANAGER" } });
  if (manager) {
    await notify(
      manager.id,
      "NEW_BOOKING",
      "New booking via voice",
      `Work order ${workOrder.referenceNumber} created for ${customerName}`,
      `/admin/work-orders/${workOrder.id}`
    );
    console.log("[VAPI:tool] create_booking notified manager", manager.id);
  }

  const result = {
    referenceNumber: workOrder.referenceNumber,
    workOrderId: workOrder.id,
    suggestedTechnicianId,
  };
  console.log("[VAPI:tool] create_booking ←", result);
  return result;
}

export async function get_customer(phone: string) {
  console.log("[VAPI:tool] get_customer →", { phone });
  const customer = await prisma.user.findFirst({
    where: { phone, role: "CUSTOMER" },
    select: { id: true, name: true, phone: true, email: true },
  });
  console.log("[VAPI:tool] get_customer ←", customer ?? "not found");
  return customer ?? null;
}
