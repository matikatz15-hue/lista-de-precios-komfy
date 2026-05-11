import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const conds = await db.condition.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(conds);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await req.json() as Array<{
    id: string; code: string; label: string; detail: string; value: string; hot: boolean; order: number;
  }>;

  await db.$transaction(
    items.map((item) =>
      db.condition.upsert({
        where: { id: item.id },
        update: { code: item.code, label: item.label, detail: item.detail, value: item.value, hot: item.hot, order: item.order },
        create: { id: item.id, code: item.code, label: item.label, detail: item.detail, value: item.value, hot: item.hot, order: item.order },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
