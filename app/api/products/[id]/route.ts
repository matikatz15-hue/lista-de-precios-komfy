import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const product = await db.product.update({
    where: { id },
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
      order: body.order,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
