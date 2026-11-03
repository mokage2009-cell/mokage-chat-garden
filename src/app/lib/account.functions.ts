import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loginEmail, OWNER_LOGIN_ID } from "@/app/lib/accountRules";

type SignUpInput = { loginId: string; password: string; displayName: string };

export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((input: SignUpInput) => {
    if (
      !input ||
      typeof input.loginId !== "string" ||
      typeof input.password !== "string" ||
      typeof input.displayName !== "string"
    ) {
      throw new Error("invalid input");
    }
    return {
      loginId: input.loginId,
      password: input.password,
      displayName: input.displayName.trim(),
    };
  })
  .handler(async ({ data }): Promise<{ ok: true } | { error: string }> => {
    if (!/^[A-Za-z0-9]{1,30}$/.test(data.loginId))
      return { error: "ユーザーIDは半角英数字1〜30文字で入力してください" };
    if (data.password.length < 6) return { error: "パスワードは6文字以上で入力してください" };
    if (data.displayName.length < 1 || data.displayName.length > 30)
      return { error: "表示名は1〜30文字で入力してください" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: deleted } = await supabaseAdmin
      .from("deleted_user_ids")
      .select("deleted_at")
      .eq("login_id", data.loginId)
      .maybeSingle();
    if (deleted) {
      const elapsed = Date.now() - new Date(deleted.deleted_at).getTime();
      const day = 24 * 60 * 60 * 1000;
      if (elapsed < day) {
        return {
          error: `このユーザーIDは最近削除されたため、あと約${Math.ceil((day - elapsed) / 3600000)}時間後に再利用できます`,
        };
      }
    }

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("login_id")
      .ilike("login_id", data.loginId)
      .maybeSingle();
    if (existing) return { error: "このユーザーIDは既に使われています" };

    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail(data.loginId),
      password: data.password,
      email_confirm: true,
    });
    if (authError || !created.user) {
      const msg = authError?.message ?? "";
      if (/already|registered|exists/i.test(msg))
        return { error: "このユーザーIDは既に使われています" };
      if (/password/i.test(msg))
        return { error: "このパスワードは安全性が低いため使えません。別のパスワードにしてください" };
      return { error: "アカウントを作成できませんでした" };
    }

    let accountNumber: number;
    const { data: ownerRow } = await supabaseAdmin
      .from("profiles")
      .select("login_id")
      .eq("account_number", 1)
      .maybeSingle();
    if (data.loginId === OWNER_LOGIN_ID && !ownerRow) {
      accountNumber = 1;
    } else {
      const { data: maxRow } = await supabaseAdmin
        .from("profiles")
        .select("account_number")
        .order("account_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      accountNumber = Math.max(1, maxRow?.account_number ?? 1) + 1;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      login_id: data.loginId,
      user_id: created.user.id,
      display_name: data.displayName,
      account_number: accountNumber,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return {
        error:
          profileError.code === "23505"
            ? "このユーザーIDは既に使われています"
            : "アカウントを作成できませんでした",
      };
    }
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("login_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profile) {
      await supabaseAdmin
        .from("deleted_user_ids")
        .upsert({ login_id: profile.login_id, deleted_at: new Date().toISOString() });
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("アカウントを削除できませんでした");
    return { ok: true };
  });
