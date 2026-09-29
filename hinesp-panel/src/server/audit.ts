import type { AuditAction, Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";

type Tx = Prisma.TransactionClient | PrismaClient;

export type AuditEntry = {
  actorId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  summary: string;
  data?: Prisma.InputJsonValue;
};

/** Record who did what, and when. Pass the transaction client to keep it atomic with the change. */
export async function audit(entry: AuditEntry, tx: Tx = db): Promise<void> {
  await tx.auditLog.create({ data: entry });
}
