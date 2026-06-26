import type { Request } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

type AuditLogInput = {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
};

function readHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    const first = value[0]?.trim();
    return first ? first : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  return null;
}

function getClientIp(req: Request) {
  const forwardedFor = readHeaderValue(req.headers["x-forwarded-for"]);
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return (
    readHeaderValue(req.headers["x-real-ip"]) ??
    req.ip ??
    req.socket.remoteAddress ??
    null
  );
}

async function resolveActor(userId?: number) {
  if (!userId) {
    return null;
  }

  const [user] = await db
    .select({
      fullName: schema.usersTable.fullName,
      email: schema.usersTable.email,
      role: schema.usersTable.role,
    })
    .from(schema.usersTable)
    .where(eq(schema.usersTable.id, userId))
    .limit(1);

  return user ?? null;
}

export async function logAudit(
  req: Request,
  opts: AuditLogInput,
): Promise<void> {
  try {
    const actorUserId = opts.userId ?? req.user?.userId;
    const actor = await resolveActor(actorUserId);
    const userAgent = readHeaderValue(req.headers["user-agent"]);

    await db.insert(schema.auditLogsTable).values({
      userId: actorUserId,
      actorName:
        actor?.fullName ?? (actorUserId ? `Utilisateur #${actorUserId}` : null),
      actorEmail: actor?.email ?? req.user?.email ?? null,
      actorRole: actor?.role ?? req.user?.role ?? null,
      ipAddress: getClientIp(req),
      userAgent,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      details: opts.details,
    });
  } catch {
    // Non-critical — don't throw
  }
}
