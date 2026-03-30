-- AlterTable
ALTER TABLE "organizers" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_token" VARCHAR(255);

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_token" VARCHAR(255);

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_token" VARCHAR(255);
