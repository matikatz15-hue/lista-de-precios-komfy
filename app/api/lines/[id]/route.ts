import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const line = await db.line.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: { products: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!line) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(line);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const line = await db.line.update({
    where: { id },
    data: {
      name: body.name,
      eyebrow: body.eyebrow,
      description: body.description,
      order: body.order,
    },
  });
  return NextResponse.json(line);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.line.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
