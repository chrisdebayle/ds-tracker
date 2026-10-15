ALTER TABLE "engagements" ADD COLUMN "show_progress_update" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "engagements" ADD COLUMN "progress_note" text DEFAULT '';