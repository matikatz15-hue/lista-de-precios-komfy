import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const group = await db.productGroup.create({
    data: {
      lineId: body.lineId,
      name: body.name,
      dimensions: body.dimensions,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(group, { status: 201 });
}
