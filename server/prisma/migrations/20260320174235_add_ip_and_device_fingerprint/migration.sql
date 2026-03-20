-- AlterTable
ALTER TABLE "organizers" ADD COLUMN     "device_fingerprint" VARCHAR(64),
ADD COLUMN     "ip_address" VARCHAR(45);

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "device_fingerprint" VARCHAR(64),
ADD COLUMN     "ip_address" VARCHAR(45);

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "device_fingerprint" VARCHAR(64),
ADD COLUMN     "ip_address" VARCHAR(45);
