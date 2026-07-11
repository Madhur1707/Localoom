-- CreateEnum
CREATE TYPE "DocumentInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "DocumentInvitation" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "status" "DocumentInvitationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "DocumentInvitation_documentId_status_idx" ON "DocumentInvitation"("documentId", "status");
