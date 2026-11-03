import { supabase } from "@/app/lib/supabase";
import { deleteMyAccount } from "@/app/lib/account.functions";

export const FEEDBACK_LIMITS = { messageMax: 2000 } as const;

export async function sendFeedback(loginId: string, message: string): Promise<void> {
  const { error } = await supabase.from("user_feedback").insert({
    sender_login_id: loginId,
    message,
  });
  if (error) throw new Error("意見を送信できませんでした");
}

export async function deleteOwnAccount(_loginId: string): Promise<void> {
  try {
    await deleteMyAccount();
  } catch {
    throw new Error("アカウントを削除できませんでした");
  }
  await supabase.auth.signOut();
}
