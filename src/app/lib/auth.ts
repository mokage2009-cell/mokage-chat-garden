import { supabase } from "@/app/lib/supabase";
import { PASSWORD_MIN, authPassword, loginEmail } from "@/app/lib/accountRules";
import { createAccount } from "@/app/lib/account.functions";

export type User = {
  id: string;
  name: string;
  accountNumber: number;
};

export async function loadCurrentUser(): Promise<User | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("profiles")
    .select("login_id, display_name, account_number")
    .eq("user_id", uid)
    .maybeSingle();
  if (!data) return null;
  const row = data as { login_id: string; display_name: string; account_number: number };
  return { id: row.login_id, name: row.display_name, accountNumber: row.account_number };
}

export async function signIn(id: string, password: string): Promise<User | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(id), password: authPassword(password) });
  if (error) return null;
  const user = await loadCurrentUser();
  if (!user) await supabase.auth.signOut();
  return user;
}

export async function signUp(
  id: string,
  password: string,
  displayName: string,
): Promise<{ user: User } | { error: string }> {
  const result = await createAccount({ data: { loginId: id, password, displayName } });
  if ("error" in result) return { error: result.error };
  const user = await signIn(id, password);
  if (!user) return { error: "アカウントを作成しましたが、ログインできませんでした" };
  return { user };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function changePassword(newPassword: string): Promise<void> {
  if (newPassword.length < PASSWORD_MIN) throw new Error(`パスワードは${PASSWORD_MIN}文字以上で入力してください`);
  const { error } = await supabase.auth.updateUser({ password: authPassword(newPassword) });
  if (error) throw new Error("パスワードを変更できませんでした");
}
