ALTER TABLE "sessions" ADD COLUMN "data" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "notes" ADD CONSTRAINT "notes_body_length_check"
  CHECK (char_length("body") <= 50000);
