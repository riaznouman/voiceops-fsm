import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
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
  console.log(`  admin:      ${admin.email}`);

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
  console.log(`  manager:    ${manager.email}`);

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
      lat: -33.8688,
      lng: 151.2093,
    },
  });
  console.log(`  technician: ${technician.email}`);

  const tech2Password = await hash("Tech@1234", 12);
  const technician2 = await prisma.user.upsert({
    where: { email: "tech2@voiceops.com" },
    update: {},
    create: {
      name: "Amy Chen",
      email: "tech2@voiceops.com",
      password: tech2Password,
      role: "TECHNICIAN",
      phone: "+61 400 000 005",
      hourlyRate: 70.0,
      lat: -33.8650,
      lng: 151.2150,
    },
  });
  console.log(`  technician2: ${technician2.email}`);

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
  console.log(`  customer:   ${customer.email}`);

  const catElectrical = await prisma.category.upsert({
    where: { slug: "electrical" },
    update: {},
    create: {
      name: "Electrical",
      slug: "electrical",
      description: "Electrical installation, inspection and repair services",
    },
  });

  const catHVAC = await prisma.category.upsert({
    where: { slug: "hvac-cooling" },
    update: {},
    create: {
      name: "HVAC & Cooling",
      slug: "hvac-cooling",
      description: "Air conditioning, heating and ventilation services",
    },
  });

  const catPlumbing = await prisma.category.upsert({
    where: { slug: "plumbing" },
    update: {},
    create: {
      name: "Plumbing",
      slug: "plumbing",
      description: "Plumbing installation, repair and maintenance",
    },
  });

  const catGeneral = await prisma.category.upsert({
    where: { slug: "general-maintenance" },
    update: {},
    create: {
      name: "General Maintenance",
      slug: "general-maintenance",
      description: "General handyman and property maintenance services",
    },
  });

  console.log(`  categories: Electrical, HVAC & Cooling, Plumbing, General Maintenance`);

  const skillElecWiring = await prisma.skill.upsert({
    where: { id: "skill-elec-wiring" },
    update: {},
    create: { id: "skill-elec-wiring", name: "Electrical Wiring", description: "Residential and commercial wiring" },
  });

  const skillCircuit = await prisma.skill.upsert({
    where: { id: "skill-circuit-testing" },
    update: {},
    create: { id: "skill-circuit-testing", name: "Circuit Testing", description: "Fault finding and circuit diagnostics" },
  });

  const skillACRepair = await prisma.skill.upsert({
    where: { id: "skill-ac-repair" },
    update: {},
    create: { id: "skill-ac-repair", name: "AC Repair", description: "Air conditioning unit repair and servicing" },
  });

  const skillRefrigerant = await prisma.skill.upsert({
    where: { id: "skill-refrigerant" },
    update: {},
    create: { id: "skill-refrigerant", name: "Refrigerant Handling", description: "Certified refrigerant gas handling" },
  });

  const skillPipeFitting = await prisma.skill.upsert({
    where: { id: "skill-pipe-fitting" },
    update: {},
    create: { id: "skill-pipe-fitting", name: "Pipe Fitting", description: "Plumbing pipe installation and fitting" },
  });

  const skillLeakDetect = await prisma.skill.upsert({
    where: { id: "skill-leak-detect" },
    update: {},
    create: { id: "skill-leak-detect", name: "Leak Detection", description: "Water and gas leak detection" },
  });

  const skillHandyman = await prisma.skill.upsert({
    where: { id: "skill-handyman" },
    update: {},
    create: { id: "skill-handyman", name: "General Handyman", description: "General maintenance and repair tasks" },
  });

  console.log(`  skills: 7 skills created`);

  const service1 = await prisma.service.upsert({
    where: { slug: "electrical-inspection" },
    update: { categoryId: catElectrical.id },
    create: {
      name: "Electrical Inspection",
      slug: "electrical-inspection",
      description: "Full residential electrical safety inspection",
      durationMinutes: 90,
      basePrice: 180.0,
      categoryId: catElectrical.id,
    },
  });

  const service2 = await prisma.service.upsert({
    where: { slug: "ac-repair" },
    update: { categoryId: catHVAC.id },
    create: {
      name: "AC Repair",
      slug: "ac-repair",
      description: "Air conditioning unit diagnosis and repair",
      durationMinutes: 120,
      basePrice: 220.0,
      categoryId: catHVAC.id,
    },
  });

  const service3 = await prisma.service.upsert({
    where: { slug: "plumbing-leak-fix" },
    update: { categoryId: catPlumbing.id },
    create: {
      name: "Plumbing Leak Fix",
      slug: "plumbing-leak-fix",
      description: "Detect and fix household plumbing leaks",
      durationMinutes: 60,
      basePrice: 150.0,
      categoryId: catPlumbing.id,
    },
  });

  const service4 = await prisma.service.upsert({
    where: { slug: "general-maintenance" },
    update: { categoryId: catGeneral.id },
    create: {
      name: "General Maintenance",
      slug: "general-maintenance",
      description: "General handyman and maintenance services",
      durationMinutes: 60,
      basePrice: 120.0,
      categoryId: catGeneral.id,
    },
  });

  console.log(`  services: ${service1.name}, ${service2.name}, ${service3.name}, ${service4.name}`);

  const serviceSkillPairs = [
    { serviceId: service1.id, skillId: skillElecWiring.id, key: `${service1.id}-${skillElecWiring.id}` },
    { serviceId: service1.id, skillId: skillCircuit.id, key: `${service1.id}-${skillCircuit.id}` },
    { serviceId: service2.id, skillId: skillACRepair.id, key: `${service2.id}-${skillACRepair.id}` },
    { serviceId: service2.id, skillId: skillRefrigerant.id, key: `${service2.id}-${skillRefrigerant.id}` },
    { serviceId: service3.id, skillId: skillPipeFitting.id, key: `${service3.id}-${skillPipeFitting.id}` },
    { serviceId: service3.id, skillId: skillLeakDetect.id, key: `${service3.id}-${skillLeakDetect.id}` },
    { serviceId: service4.id, skillId: skillHandyman.id, key: `${service4.id}-${skillHandyman.id}` },
  ];

  for (const pair of serviceSkillPairs) {
    const existing = await prisma.serviceSkill.findUnique({
      where: { serviceId_skillId: { serviceId: pair.serviceId, skillId: pair.skillId } },
    });
    if (!existing) {
      await prisma.serviceSkill.create({ data: { serviceId: pair.serviceId, skillId: pair.skillId } });
    }
  }

  console.log(`  service skills assigned`);

  const jakeSkills = [skillElecWiring.id, skillCircuit.id, skillACRepair.id, skillRefrigerant.id];
  for (const skillId of jakeSkills) {
    const existing = await prisma.technicianSkill.findUnique({
      where: { userId_skillId: { userId: technician.id, skillId } },
    });
    if (!existing) {
      await prisma.technicianSkill.create({ data: { userId: technician.id, skillId } });
    }
  }

  const amySkills = [skillPipeFitting.id, skillLeakDetect.id, skillHandyman.id];
  for (const skillId of amySkills) {
    const existing = await prisma.technicianSkill.findUnique({
      where: { userId_skillId: { userId: technician2.id, skillId } },
    });
    if (!existing) {
      await prisma.technicianSkill.create({ data: { userId: technician2.id, skillId } });
    }
  }

  console.log(`  technician skills: Jake (4 skills), Amy (3 skills)`);

  const wo1 = await prisma.workOrder.upsert({
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

  const wo2 = await prisma.workOrder.upsert({
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

  console.log(`  work orders: VO-00001, VO-00002`);

  const call1 = await prisma.callSession.upsert({
    where: { id: "seed-call-001" },
    update: {},
    create: {
      id: "seed-call-001",
      fromNumber: "+61 400 111 222",
      startedAt: new Date("2026-04-29T10:00:00"),
      endedAt: new Date("2026-04-29T10:03:45"),
      durationSec: 225,
      summary: "Customer requested electrical inspection. Booking created.",
      transcript: [
        { role: "assistant", content: "Hello, this is VoiceOps. How can I help you today?" },
        { role: "user", content: "Hi, I need an electrical inspection at my home." },
        { role: "assistant", content: "I can help with that. What is your name and address?" },
        { role: "user", content: "My name is David Lee, 45 Park Rd, Parramatta." },
      ],
    },
  });

  const call2 = await prisma.callSession.upsert({
    where: { id: "seed-call-002" },
    update: {},
    create: {
      id: "seed-call-002",
      fromNumber: "+61 400 333 444",
      startedAt: new Date("2026-04-29T14:30:00"),
      endedAt: new Date("2026-04-29T14:34:20"),
      durationSec: 260,
      summary: "Customer enquired about AC repair. Appointment scheduled.",
      transcript: [
        { role: "assistant", content: "VoiceOps, how may I assist you?" },
        { role: "user", content: "My AC stopped working yesterday." },
        { role: "assistant", content: "I can arrange an AC repair visit. Can I get your details?" },
      ],
    },
  });

  const call3 = await prisma.callSession.upsert({
    where: { id: "seed-call-003" },
    update: {},
    create: {
      id: "seed-call-003",
      fromNumber: "+61 400 555 666",
      startedAt: new Date("2026-04-30T09:15:00"),
      transcript: [],
    },
  });

  console.log(`  call sessions: ${call1.id}, ${call2.id}, ${call3.id} (in progress)`);

  const notifs = [
    {
      userId: admin.id,
      type: "NEW_BOOKING",
      title: "New work order submitted",
      body: "VO-00001 has been created and is awaiting assignment.",
      link: `/admin/work-orders/${wo1.id}`,
    },
    {
      userId: admin.id,
      type: "ASSIGNMENT",
      title: "Technician assigned",
      body: "Jake Miller has been assigned to VO-00002.",
      link: `/admin/work-orders/${wo2.id}`,
    },
    {
      userId: admin.id,
      type: "CALL",
      title: "New voice booking",
      body: "A voice call resulted in a new service request.",
      link: `/admin/voice/calls/${call1.id}`,
    },
  ];

  for (const n of notifs) {
    const exists = await prisma.notification.findFirst({ where: { userId: n.userId, title: n.title } });
    if (!exists) {
      await prisma.notification.create({ data: n });
    }
  }

  console.log(`  notifications: 3 created for admin`);

  const invoiceExists = await prisma.invoice.findFirst({ where: { workOrderId: wo1.id } });
  if (!invoiceExists) {
    const invCount = await prisma.invoice.count();
    const invoice = await prisma.invoice.create({
      data: {
        referenceNumber: `INV-${String(invCount + 1).padStart(5, "0")}`,
        customerId: customer.id,
        workOrderId: wo1.id,
        dueDate: new Date("2026-05-21"),
        subtotal: 180.0,
        taxRate: 0.1,
        taxAmount: 18.0,
        total: 198.0,
        status: "SENT",
        notes: "Payment due within 30 days.",
        lineItems: {
          create: [
            {
              description: "Electrical Inspection - Full residential",
              quantity: 1,
              unitPrice: 180.0,
              lineTotal: 180.0,
            },
          ],
        },
      },
    });
    console.log(`  invoice: ${invoice.referenceNumber} for VO-00001`);
  }

  console.log("\nSeed complete:");
  console.log(`  admin:      admin@voiceops.com     / Admin@1234`);
  console.log(`  manager:    manager@voiceops.com   / Manager@1234`);
  console.log(`  technician: tech@voiceops.com      / Tech@1234`);
  console.log(`  technician: tech2@voiceops.com     / Tech@1234`);
  console.log(`  customer:   customer@voiceops.com  / Customer@1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
