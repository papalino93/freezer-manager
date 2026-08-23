import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccessibleFreezers } from "@/lib/api-auth";
import type { ConsumptionLogDTO } from "@/lib/types";

// Elenca i consumi PARZIALI (es. "1 scatola" su "5 scatole") su tutti i
// congelatori dell'utente: sono l'altra metà dello Storico, insieme ai
// prodotti consumati del tutto (GET /api/products?status=consumed).
export async function GET() {
  const ctx = await requireAccessibleFreezers();
  if ("error" in ctx) return ctx.error;

  const logs = await prisma.consumptionLog.findMany({
    where: { freezerId: { in: ctx.freezerIds } },
    orderBy: { consumedAt: "desc" },
  });

  const freezerNames = new Map(ctx.freezers.map((f) => [f.id, f.name]));
  const dto: ConsumptionLogDTO[] = logs.map((log) => ({
    id: log.id,
    productId: log.productId,
    freezerId: log.freezerId,
    freezerName: freezerNames.get(log.freezerId),
    name: log.name,
    category: log.category,
    kind: log.kind,
    amount: log.amount,
    unit: log.unit,
    consumedAt: log.consumedAt.toISOString(),
  }));

  return NextResponse.json({ logs: dto });
}
