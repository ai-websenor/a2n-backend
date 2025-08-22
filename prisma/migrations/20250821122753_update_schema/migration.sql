/*
  Warnings:

  - You are about to drop the column `company_email_confirmed` on the `account_onboarding` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verified_at` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "auth"."users_phone_key";

-- AlterTable
ALTER TABLE "auth"."account_onboarding" DROP COLUMN "company_email_confirmed";

-- AlterTable
ALTER TABLE "auth"."users" DROP COLUMN "email_verified_at",
DROP COLUMN "phone",
DROP COLUMN "phone_verified",
DROP COLUMN "phone_verified_at";
