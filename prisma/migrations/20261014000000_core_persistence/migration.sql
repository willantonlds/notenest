CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'MODERATOR');
CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "ModerationAction" AS ENUM ('HIDE', 'RESTORE');
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "display_name" VARCHAR(80) NOT NULL CHECK (length(btrim("display_name")) > 0),
  "email" VARCHAR(254) NOT NULL UNIQUE CHECK ("email" = lower(btrim("email")) AND "email" ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  "password_hash" VARCHAR(255) NOT NULL CHECK (length("password_hash") > 0),
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "sessions" (
  "id" VARCHAR(128) PRIMARY KEY CHECK (length("id") > 0),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE TABLE "notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" VARCHAR(200) NOT NULL CHECK (length(btrim("title")) > 0),
  "body" TEXT NOT NULL DEFAULT '',
  "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
  "is_hidden" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "notes_owner_updated_id_idx" ON "notes"("owner_id", "updated_at" DESC, "id");
CREATE INDEX "notes_feed_updated_id_idx" ON "notes"("visibility", "is_hidden", "updated_at" DESC, "id");
CREATE TABLE "moderation_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "note_id" UUID NOT NULL REFERENCES "notes"("id") ON DELETE CASCADE,
  "moderator_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "action" "ModerationAction" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "moderation_events_note_created_idx" ON "moderation_events"("note_id", "created_at" DESC);
CREATE INDEX "moderation_events_moderator_created_idx" ON "moderation_events"("moderator_id", "created_at" DESC);
