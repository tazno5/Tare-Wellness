import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          include: { redemption: true },
        },
      },
    });

    if (!order) {
      // Try by order number
      const orderByNumber = await db.order.findUnique({
        where: { orderNumber: params.id },
        include: {
          orderItems: {
            include: { redemption: true },
          },
        },
      });

      if (!orderByNumber) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(orderByNumber);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
