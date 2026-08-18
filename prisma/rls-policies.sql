-- ============================================================
-- Row Level Security (RLS) Policies for Tare Wellness
-- ============================================================
-- This migration enables Row Level Security on all tables and
-- creates policies that restrict access to the authenticated
-- user's own data.
--
-- IMPORTANT: These policies use Supabase Auth's auth.uid()
-- function. If you're using NextAuth (not Supabase Auth),
-- these policies will block ALL access via the Supabase
-- connection string. In that case, the application-level
-- checks in the API routes (using getServerSession) are the
-- primary access control.
--
-- To apply: Run this SQL in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftCardType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redemption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GiftCardType: publicly readable (anyone can see gift card options)
-- ============================================================
CREATE POLICY "Gift cards are publicly readable" ON "GiftCardType"
  FOR SELECT USING (true);

-- ============================================================
-- User: users can only see their own record
-- ============================================================
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = "id");
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = "id");

-- ============================================================
-- Order: users can only see their own orders
-- ============================================================
CREATE POLICY "Users can view own orders" ON "Order"
  FOR SELECT USING (
    auth.uid()::text = "userId" OR auth.email() = "buyerEmail"
  );
CREATE POLICY "Users can create orders" ON "Order"
  FOR INSERT WITH CHECK (
    auth.uid()::text = "userId" OR auth.email() = "buyerEmail"
  );

-- ============================================================
-- OrderItem: users can only see items from their orders
-- ============================================================
CREATE POLICY "Users can view own order items" ON "OrderItem"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order"."id" = "OrderItem"."orderId"
      AND (
        "Order"."userId" = auth.uid()::text
        OR "Order"."buyerEmail" = auth.email()
      )
    )
  );

-- ============================================================
-- Redemption: users can only see redemptions from their orders
-- ============================================================
CREATE POLICY "Users can view own redemptions" ON "Redemption"
  FOR SELECT USING (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order"."id" = "Redemption"."orderId"
      AND (
        "Order"."userId" = auth.uid()::text
        OR "Order"."buyerEmail" = auth.email()
      )
    )
  );
CREATE POLICY "Users can update own redemptions" ON "Redemption"
  FOR UPDATE USING (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order"."id" = "Redemption"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ============================================================
-- Booking: users can only see/manage their own bookings
-- ============================================================
CREATE POLICY "Users can view own bookings" ON "Booking"
  FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can create own bookings" ON "Booking"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update own bookings" ON "Booking"
  FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "Users can delete own bookings" ON "Booking"
  FOR DELETE USING (auth.uid()::text = "userId");

-- ============================================================
-- Account, Session, VerificationToken: managed by NextAuth
-- (only the application should access these, not direct DB queries)
-- ============================================================
CREATE POLICY "No direct access to accounts" ON "Account"
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "No direct access to sessions" ON "Session"
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "No direct access to tokens" ON "VerificationToken"
  FOR ALL USING (false) WITH CHECK (false);
