-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('NOT_REDEEMED', 'REDEEMED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "organization_name" VARCHAR(160) NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "date_time" TIMESTAMPTZ(6) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "ticket_price" DECIMAL(10,2) NOT NULL,
    "cover_image_url" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "organizer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "registration_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "qr_code_data" TEXT NOT NULL,
    "redemption_status" "RedemptionStatus" NOT NULL DEFAULT 'NOT_REDEEMED',
    "redeemed_at" TIMESTAMPTZ(6),
    "validated_by_staff_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "message_content" TEXT NOT NULL,
    "read_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_email_key" ON "organizers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_date_time_idx" ON "events"("date_time");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "registrations_event_id_idx" ON "registrations"("event_id");

-- CreateIndex
CREATE INDEX "registrations_student_id_idx" ON "registrations"("student_id");

-- CreateIndex
CREATE INDEX "registrations_payment_status_idx" ON "registrations"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_student_id_event_id_key" ON "registrations"("student_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_registration_id_key" ON "tickets"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_code_data_key" ON "tickets"("qr_code_data");

-- CreateIndex
CREATE INDEX "tickets_validated_by_staff_id_idx" ON "tickets"("validated_by_staff_id");

-- CreateIndex
CREATE INDEX "tickets_redemption_status_idx" ON "tickets"("redemption_status");

-- CreateIndex
CREATE INDEX "notifications_student_id_read_status_idx" ON "notifications"("student_id", "read_status");

-- CreateIndex
CREATE INDEX "notifications_event_id_idx" ON "notifications"("event_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_validated_by_staff_id_fkey" FOREIGN KEY ("validated_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
