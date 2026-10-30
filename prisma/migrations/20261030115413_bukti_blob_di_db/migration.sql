/*
  Warnings:

  - You are about to drop the column `filePath` on the `PaymentProof` table. All the data in the column will be lost.
  - Added the required column `data` to the `PaymentProof` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "originalName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "rejectReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PaymentProof" ("id", "mime", "orderId", "originalName", "rejectReason", "reviewedAt", "reviewedBy", "sizeBytes", "status", "uploadedAt") SELECT "id", "mime", "orderId", "originalName", "rejectReason", "reviewedAt", "reviewedBy", "sizeBytes", "status", "uploadedAt" FROM "PaymentProof";
DROP TABLE "PaymentProof";
ALTER TABLE "new_PaymentProof" RENAME TO "PaymentProof";
CREATE INDEX "PaymentProof_orderId_idx" ON "PaymentProof"("orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
