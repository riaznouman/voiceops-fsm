import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Users — one per role
  const adminPassword = await hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@voiceops.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@voiceops.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "+61 400 000 001",
    },
  });

  const managerPassword = await hash("Manager@1234", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@voiceops.com" },
    update: {},
    create: {
      name: "Rachel Torres",
      email: "manager@voiceops.com",
      password: managerPassword,
      role: "MANAGER",
      phone: "+61 400 000 002",
    },
  });

  const techPassword = await hash("Tech@1234", 12);
  const technician = await prisma.user.upsert({
    where: { email: "tech@voiceops.com" },
    update: {},
    create: {
      name: "Jake Miller",
      email: "tech@voiceops.com",
      password: techPassword,
      role: "TECHNICIAN",
      phone: "+61 400 000 003",
      hourlyRate: 65.0,
    },
  });

  const customerPassword = await hash("Customer@1234", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@voiceops.com" },
    update: {},
    create: {
      name: "John Smith",
      email: "customer@voiceops.com",
      password: customerPassword,
      role: "CUSTOMER",
      phone: "+61 400 000 004",
      address: "12 George St, Sydney NSW 2000",
    },
  });

  // Services
  const service1 = await prisma.service.upsert({
    where: { slug: "electrical-inspection" },
    update: {},
    create: {
      name: "Electrical Inspection",
      slug: "electrical-inspection",
      description: "Full residential electrical safety inspection",
      durationMinutes: 90,
      basePrice: 180.0,
    },
  });

  const service2 = await prisma.service.upsert({
    where: { slug: "ac-repair" },
    update: {},
    create: {
      name: "AC Repair",
      slug: "ac-repair",
      description: "Air conditioning unit diagnosis and repair",
      durationMinutes: 120,
      basePrice: 220.0,
    },
  });

  const service3 = await prisma.service.upsert({
    where: { slug: "plumbing-leak-fix" },
    update: {},
    create: {
      name: "Plumbing Leak Fix",
      slug: "plumbing-leak-fix",
      description: "Detect and fix household plumbing leaks",
      durationMinutes: 60,
      basePrice: 150.0,
    },
  });

  const service4 = await prisma.service.upsert({
    where: { slug: "general-maintenance" },
    update: {},
    create: {
      name: "General Maintenance",
      slug: "general-maintenance",
      description: "General handyman and maintenance services",
      durationMinutes: 60,
      basePrice: 120.0,
    },
  });

  // Work Orders
  await prisma.workOrder.upsert({
    where: { referenceNumber: "VO-00001" },
    update: {},
    create: {
      referenceNumber: "VO-00001",
      customerId: customer.id,
      technicianId: technician.id,
      serviceId: service1.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      scheduledAt: new Date("2026-04-21T09:00:00"),
      address: "12 George St, Sydney NSW 2000",
      issueDescription: "Flickering lights in living room and kitchen",
    },
  });

  await prisma.workOrder.upsert({
    where: { referenceNumber: "VO-00002" },
    update: {},
    create: {
      referenceNumber: "VO-00002",
      customerId: customer.id,
      technicianId: technician.id,
      serviceId: service2.id,
      status: "PENDING",
      priority: "NORMAL",
      scheduledAt: new Date("2026-04-23T13:00:00"),
      address: "12 George St, Sydney NSW 2000",
      issueDescription: "AC not cooling properly, making loud noise",
    },
  });

  console.log("Seed complete:");
  console.log(`  admin:      admin@voiceops.com     / Admin@1234`);
  console.log(`  manager:    manager@voiceops.com   / Manager@1234`);
  console.log(`  technician: tech@voiceops.com      / Tech@1234`);
  console.log(`  customer:   customer@voiceops.com  / Customer@1234`);
  console.log(`  services:   ${service1.name}, ${service2.name}, ${service3.name}, ${service4.name}`);
  console.log(`  work orders: VO-00001, VO-00002`);

  void admin; void manager;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
