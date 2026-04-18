-- CreateEnum
CREATE TYPE "InvitationRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "InvitationRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "role" TEXT,
    "message" TEXT,
    "status" "InvitationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationRequest_email_key" ON "InvitationRequest"("email");

-- CreateIndex
CREATE INDEX "InvitationRequest_status_createdAt_idx" ON "InvitationRequest"("status", "createdAt" DESC);
