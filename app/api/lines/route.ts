import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const lines = await db.line.findMany({
    orderBy: { order: "asc" },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: { products: { orderBy: { order: "asc" } } },
      },
    },
  });
  return NextResponse.json(lines);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const line = await db.line.create({
    data: {
      name: body.name,
      eyebrow: body.eyebrow,
      description: body.description,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(line, { status: 201 });
}
