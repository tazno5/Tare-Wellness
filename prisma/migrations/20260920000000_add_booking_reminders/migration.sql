-- Add reminder tracking fields to Booking
-- These prevent duplicate reminder emails from being sent.
-- The cron job sets reminder24hSent=true after sending the 24-hour
-- reminder, and reminder10minSent=true after sending the 10-minute
-- reminder.
ALTER TABLE "Booking" ADD COLUMN "reminder24hSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN "reminder10minSent" BOOLEAN NOT NULL DEFAULT false;
