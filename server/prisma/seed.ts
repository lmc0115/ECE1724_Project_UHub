import {
  EventStatus,
  PaymentStatus,
  PrismaClient,
  RedemptionStatus
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.ticket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.student.deleteMany();
  await prisma.organizer.deleteMany();

  const organizers = await Promise.all([
    prisma.organizer.create({
      data: {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Alice Organizer",
        email: "alice.organizer@uhub.test",
        hashedPassword: "hashed_password_1",
        organizationName: "Computer Science Club",
        avatarUrl: "https://example.com/organizers/alice.png"
      }
    }),
    prisma.organizer.create({
      data: {
        name: "Brian Organizer",
        email: "brian.organizer@uhub.test",
        hashedPassword: "hashed_password_2",
        organizationName: "Engineering Society",
        avatarUrl: "https://example.com/organizers/brian.png"
      }
    }),
    prisma.organizer.create({
      data: {
        name: "Cindy Organizer",
        email: "cindy.organizer@uhub.test",
        hashedPassword: "hashed_password_3",
        organizationName: "Campus Events Team",
        avatarUrl: "https://example.com/organizers/cindy.png"
      }
    })
  ]);

  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: "Sam Student",
        email: "sam.student@uhub.test",
        hashedPassword: "hashed_password_1",
        avatarUrl: "https://example.com/students/sam.png"
      }
    }),
    prisma.student.create({
      data: {
        name: "Taylor Student",
        email: "taylor.student@uhub.test",
        hashedPassword: "hashed_password_2",
        avatarUrl: "https://example.com/students/taylor.png"
      }
    }),
    prisma.student.create({
      data: {
        name: "Jordan Student",
        email: "jordan.student@uhub.test",
        hashedPassword: "hashed_password_3",
          avatarUrl: "https://example.com/students/jordan.png"
      }
    })
  ]);

  const staffMembers = await Promise.all([
    prisma.staff.create({
      data: {
        name: "Nina Staff",
        email: "nina.staff@uhub.test",
        hashedPassword: "hashed_password_1"
      }
    }),
    prisma.staff.create({
      data: {
        name: "Owen Staff",
        email: "owen.staff@uhub.test",
        hashedPassword: "hashed_password_2"
      }
    }),
    prisma.staff.create({
      data: {
        name: "Priya Staff",
        email: "priya.staff@uhub.test",
        hashedPassword: "hashed_password_3"
      }
    })
  ]);

  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: "Hackathon Kickoff",
        description: "Opening ceremony for the campus hackathon.",
        location: "BA 1130",
        dateTime: new Date("2026-04-01T18:00:00.000Z"),
        capacity: 120,
        ticketPrice: 0,
        coverImageUrl: "https://example.com/events/hackathon-kickoff.png",
        status: EventStatus.PUBLISHED,
        organizerId: organizers[0].id
      }
    }),
    prisma.event.create({
      data: {
        title: "Engineering Mixer",
        description: "Networking night for engineering students.",
        location: "Student Centre",
        dateTime: new Date("2026-04-05T23:00:00.000Z"),
        capacity: 80,
        ticketPrice: 15,
        coverImageUrl: "https://example.com/events/engineering-mixer.png",
        status: EventStatus.DRAFT,
        organizerId: organizers[1].id
      }
    }),
    prisma.event.create({
      data: {
        title: "Spring Career Panel",
        description: "Industry speakers answering student career questions.",
        location: "IC Atrium",
        dateTime: new Date("2026-04-10T17:30:00.000Z"),
        capacity: 150,
        ticketPrice: 5,
        coverImageUrl: "https://example.com/events/career-panel.png",
        status: EventStatus.CANCELLED,
        organizerId: organizers[2].id
      }
    })
  ]);

  const registrations = await Promise.all([
    prisma.registration.create({
      data: {
        studentId: students[0].id,
        eventId: events[0].id,
        paymentStatus: PaymentStatus.PAID
      }
    }),
    prisma.registration.create({
      data: {
        studentId: students[1].id,
        eventId: events[1].id,
        paymentStatus: PaymentStatus.PENDING
      }
    }),
    prisma.registration.create({
      data: {
        studentId: students[2].id,
        eventId: events[2].id,
        paymentStatus: PaymentStatus.REFUNDED
      }
    })
  ]);

  await Promise.all([
    prisma.ticket.create({
      data: {
        registrationId: registrations[0].id,
        qrCodeData: "QR-UHUB-001",
        redemptionStatus: RedemptionStatus.NOT_REDEEMED
      }
    }),
    prisma.ticket.create({
      data: {
        registrationId: registrations[1].id,
        qrCodeData: "QR-UHUB-002",
        redemptionStatus: RedemptionStatus.REDEEMED,
        redeemedAt: new Date("2026-04-05T23:30:00.000Z"),
        validatedByStaffId: staffMembers[0].id
      }
    }),
    prisma.ticket.create({
      data: {
        registrationId: registrations[2].id,
        qrCodeData: "QR-UHUB-003",
        redemptionStatus: RedemptionStatus.NOT_REDEEMED,
        validatedByStaffId: staffMembers[1].id
      }
    })
  ]);

  await Promise.all([
    prisma.notification.create({
      data: {
        studentId: students[0].id,
        eventId: events[0].id,
        messageContent: "Your hackathon registration is confirmed.",
        readStatus: false
      }
    }),
    prisma.notification.create({
      data: {
        studentId: students[1].id,
        eventId: events[1].id,
        messageContent: "Engineering Mixer schedule updated.",
        readStatus: true
      }
    }),
    prisma.notification.create({
      data: {
        studentId: students[2].id,
        eventId: events[2].id,
        messageContent: "Spring Career Panel has been cancelled.",
        readStatus: false
      }
    })
  ]);

  console.log("Seed completed with sample data for all models.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
