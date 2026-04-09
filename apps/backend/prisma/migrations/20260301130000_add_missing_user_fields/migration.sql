-- AlterTable: add firstName and lastName (NOT NULL with default to handle existing rows)
ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "inviteToken" TEXT,
ADD COLUMN "inviteTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");
