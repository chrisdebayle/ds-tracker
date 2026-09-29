ALTER TABLE "segments" ADD COLUMN "is_reallocation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "segments" ADD COLUMN "source_segment_id" uuid;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_source_segment_id_segments_id_fk" FOREIGN KEY ("source_segment_id") REFERENCES "public"."segments"("id") ON DELETE set null ON UPDATE no action;