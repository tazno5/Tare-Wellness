import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ GET /api/account/export — Export the user's personal data ============
//
// NDPA 2023 Section 32: Right to data portability
//
// Returns a JSON file containing all personal data we hold about the
// current user. The user can download this and use it however they want
// (e.g., transmit to another service provider).
//
// Data included:
//   - Profile (name, email, createdAt — password is excluded)
//   - All orders placed by the user (with order items, redemptions)
//   - All bookings made by the user
//   - All redemptions linked to the user
//
// Format: JSON (machine-readable, per NDPA requirement)
// Filename: tare-wellness-data-export-<email>-<date>.json
// Response time: < 5 seconds for typical users (per NDPA "without undue delay")

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    // Fetch the user with all related data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password — never export it
        orders: {
          include: {
            orderItems: {
              include: {
                redemption: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          include: {
            redemption: {
              include: {
                orderItem: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        redemptions: {
          include: {
            orderItem: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    // Build the export object — explicitly structured for portability
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: "Tare Wellness Enterprise Ltd",
        purpose: "NDPA 2023 Section 32 — Right to data portability",
        format: "JSON",
        version: "1.0",
        contact: "privacy@tarewellness.com",
      },
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberSince: user.createdAt.toISOString(),
        lastUpdated: user.updatedAt.toISOString(),
      },
      orders: user.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmountNaira: order.totalAmount,
        paymentMethod: order.paymentMethod,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        createdAt: order.createdAt.toISOString(),
        items: order.orderItems.map((item) => ({
          id: item.id,
          cardTitle: item.cardTitle,
          cardSessions: item.cardSessions,
          cardPriceNaira: item.cardPrice,
          quantity: item.quantity,
          recipientName: item.recipientName,
          recipientEmail: item.recipientEmail,
          occasion: item.occasion,
          deliveryMode: item.deliveryMode,
          personalNote: item.personalNote,
          confirmed: item.confirmed,
          emailSent: item.emailSent,
          redemption: item.redemption
            ? {
                code: item.redemption.code,
                status: item.redemption.status,
                creditAmountNaira: item.redemption.creditAmount,
                sessionsRemaining: item.redemption.sessionsRemaining,
                sessionsUsed: item.redemption.sessionsUsed,
                redeemedAt: item.redemption.redeemedAt?.toISOString() ?? null,
                createdAt: item.redemption.createdAt.toISOString(),
              }
            : null,
        })),
      })),
      bookings: user.bookings.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        sessionType: booking.sessionType,
        sessionTitle: booking.sessionTitle,
        sessionPriceNaira: booking.sessionPrice,
        therapistName: booking.therapistName,
        scheduledDate: booking.scheduledDate.toISOString(),
        scheduledTime: booking.scheduledTime,
        durationMinutes: booking.durationMinutes,
        status: booking.status,
        meetingUrl: booking.meetingUrl,
        createdAt: booking.createdAt.toISOString(),
        linkedRedemption: booking.redemption
          ? {
              code: booking.redemption.code,
              cardTitle: booking.redemption.orderItem?.cardTitle ?? null,
            }
          : null,
      })),
      redemptions: user.redemptions.map((redemption) => ({
        id: redemption.id,
        code: redemption.code,
        status: redemption.status,
        creditAmountNaira: redemption.creditAmount,
        sessionsRemaining: redemption.sessionsRemaining,
        sessionsUsed: redemption.sessionsUsed,
        redeemedAt: redemption.redeemedAt?.toISOString() ?? null,
        createdAt: redemption.createdAt.toISOString(),
        sourceCard: redemption.orderItem
          ? {
              cardTitle: redemption.orderItem.cardTitle,
              cardSessions: redemption.orderItem.cardSessions,
              recipientName: redemption.orderItem.recipientName,
              recipientEmail: redemption.orderItem.recipientEmail,
            }
          : null,
      })),
      summary: {
        totalOrders: user.orders.length,
        totalBookings: user.bookings.length,
        totalRedemptions: user.redemptions.length,
        totalSpentNaira: user.orders.reduce(
          (sum, o) => sum + (o.status === "completed" ? o.totalAmount : 0),
          0,
        ),
      },
    };

    // Set headers to trigger download as a .json file
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeEmail = user.email.replace(/[^a-zA-Z0-9@.-]/g, "_");
    const filename = `tare-wellness-data-export-${safeEmail}-${dateStr}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { error: "Failed to export data. Please try again or contact privacy@tarewellness.com." },
      { status: 500 },
    );
  }
}
