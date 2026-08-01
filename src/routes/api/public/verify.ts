import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const querySchema = z.object({
  code: z
    .string()
    .trim()
    .min(6)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/),
});

/**
 * Public verification of a hall ticket or certificate.
 * Returns only the minimum needed to prove a document is genuine.
 */
export const Route = createFileRoute("/api/public/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = querySchema.safeParse({ code: url.searchParams.get("code") ?? "" });
        if (!parsed.success) {
          return Response.json({ status: "invalid", reason: "Malformed code" }, { status: 400 });
        }
        const code = parsed.data.code.toUpperCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const [ticket, certificate] = await Promise.all([
          supabaseAdmin
            .from("hall_tickets")
            .select("ticket_number, issued_at, valid_until, is_revoked, payload")
            .eq("verification_code", code)
            .maybeSingle(),
          supabaseAdmin
            .from("certificates")
            .select("certificate_number, kind, issued_on, is_revoked, payload")
            .eq("verification_code", code)
            .maybeSingle(),
        ]);

        if (ticket.error || certificate.error) {
          return Response.json(
            { status: "error", reason: "Verification unavailable" },
            { status: 500 },
          );
        }

        if (ticket.data) {
          const payload = (ticket.data.payload ?? {}) as Record<string, unknown>;
          const expired = ticket.data.valid_until
            ? new Date(ticket.data.valid_until).getTime() < Date.now()
            : false;
          return Response.json({
            status: ticket.data.is_revoked ? "revoked" : expired ? "expired" : "valid",
            documentType: "hall_ticket",
            number: ticket.data.ticket_number,
            holder: (payload["student_name"] as string) ?? null,
            rollNumber: (payload["roll_number"] as string) ?? null,
            session: (payload["session"] as string) ?? null,
            issuedOn: ticket.data.issued_at,
            validUntil: ticket.data.valid_until,
          });
        }

        if (certificate.data) {
          const payload = (certificate.data.payload ?? {}) as Record<string, unknown>;
          return Response.json({
            status: certificate.data.is_revoked ? "revoked" : "valid",
            documentType: certificate.data.kind,
            number: certificate.data.certificate_number,
            holder: (payload["student_name"] as string) ?? null,
            rollNumber: (payload["roll_number"] as string) ?? null,
            session: (payload["session"] as string) ?? null,
            issuedOn: certificate.data.issued_on,
            validUntil: null,
          });
        }

        return Response.json({ status: "not_found" }, { status: 404 });
      },
    },
  },
});
