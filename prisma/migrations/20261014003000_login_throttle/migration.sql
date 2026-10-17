ALTER TABLE "users" ADD COLUMN "login_failures" INTEGER NOT NULL DEFAULT 0 CHECK ("login_failures" >= 0);
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMPTZ(6);
