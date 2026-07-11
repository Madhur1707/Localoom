-- CreateTable
CREATE TABLE "DocumentInvitation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "DocumentRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,

    CONSTRAINT "DocumentInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentInvitation_email_idx" ON "DocumentInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentInvitation_documentId_email_key" ON "DocumentInvitation"("documentId", "email");

-- AddForeignKey
ALTER TABLE "DocumentInvitation" ADD CONSTRAINT "DocumentInvitation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentInvitation" ADD CONSTRAINT "DocumentInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
