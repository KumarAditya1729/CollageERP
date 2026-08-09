import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteSchema = z.object({
  email: z.string().trim().email().max(255),
  tenantId: z.string().uuid(),
  roleId: z.string().uuid().optional(),
  redirectTo: z.string().url().max(500),
});

/**
 * Invites a person to a college workspace. The caller must hold the
 * `user.invite` permission in that tenant — verified server side against the
 * database, not the browser.
 */
export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: permissionError } = await context.supabase.rpc("has_permission", {
      _permission_key: "user.invite",
      _tenant_id: data.tenantId,
    });
    if (permissionError) throw new Error(permissionError.message);
    if (!allowed) throw new Error("You do not have permission to invite users to this college.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      { redirectTo: data.redirectTo },
    );
    if (inviteError) throw new Error(inviteError.message);

    const userId = invited.user?.id;
    if (!userId) throw new Error("The invitation could not be created.");

    const { error: memberError } = await supabaseAdmin
      .from("tenant_members")
      .upsert(
        { tenant_id: data.tenantId, user_id: userId, status: "invited", deleted_at: null },
        { onConflict: "tenant_id,user_id" },
      );
    if (memberError) throw new Error(memberError.message);

    if (data.roleId) {
      // Check if role assignment already exists (even if soft-deleted)
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id, deleted_at")
        .eq("user_id", userId)
        .eq("role_id", data.roleId)
        .eq("tenant_id", data.tenantId)
        .maybeSingle();

      if (existingRole) {
        if (existingRole.deleted_at) {
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .update({ deleted_at: null })
            .eq("id", existingRole.id);
          if (roleError) throw new Error(roleError.message);
        }
      } else {
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: userId,
          role_id: data.roleId,
          tenant_id: data.tenantId,
          scope: "tenant",
        });
        if (roleError) throw new Error(roleError.message);
      }
    }

    return { userId, email: data.email };
  });
