import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const product = await db.product.create({
    data: {
      groupId: body.groupId,
      name: body.name,
      sku: body.sku,
      color: body.color,
      colorHex: body.colorHex,
      colorHex2: body.colorHex2 || null,
      dimensions: body.dimensions,
      bulkQty: Number(body.bulkQty) || 1,
      price: Number(body.price),
      imageUrl: body.imageUrl || null,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
