/*
  Warnings:

  - You are about to drop the column `company_email` on the `account_onboarding` table. All the data in the column will be lost.
  - You are about to drop the column `company_name` on the `account_onboarding` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `account_onboarding` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `account_onboarding` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth"."account_onboarding" DROP COLUMN "company_email",
DROP COLUMN "company_name",
DROP COLUMN "first_name",
DROP COLUMN "last_name";
