-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Redemption" ADD COLUMN     "sessionsRemaining" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessionsUsed" INTEGER NOT NULL DEFAULT 0;
