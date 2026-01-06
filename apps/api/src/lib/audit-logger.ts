import { db, auditLogs } from "@repo/db";
import { log } from "utils";

export type AuditEventType =
  | "workflow_created"
  | "workflow_updated"
  | "workflow_deleted"
  | "workflow_enabled"
  | "workflow_disabled";

export interface AuditLogParams {
  workflowId?: string;
  eventType: AuditEventType;
  eventData: Record<string, unknown>;
  actorId?: string;
  actorType?: "system" | "user" | "api";
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      workflowId: params.workflowId,
      eventType: params.eventType,
      eventData: params.eventData,
      actorId: params.actorId,
      actorType: params.actorType || "user",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    log.debug("Audit log created", {
      service: "api",
      eventType: params.eventType,
      workflowId: params.workflowId,
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main operation
    log.error("Failed to create audit log", error as Error, {
      service: "api",
      eventType: params.eventType,
      workflowId: params.workflowId,
    });
  }
}

/**
 * Helper to extract client info from request context
 */
export function extractClientInfo(c: { req: { header: (name: string) => string | undefined } }): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  };
}
