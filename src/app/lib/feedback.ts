import { supabase } from '@/app/lib/supabase';

export const FEEDBACK_LIMITS = { messageMax: 2000 } as const;

export async function sendFeedback(loginId: string, message: string): Promise<void> {
  const { error } = await supabase.from('user_feedback').insert({
    sender_login_id: loginId,
    message,
  });
  if (error) throw new Error('意見を送信できませんでした');
}

export async function deleteOwnAccount(loginId: string): Promise<void> {
  const { error: recordError } = await supabase
    .from('deleted_user_ids')
    .upsert({ login_id: loginId, deleted_at: new Date().toISOString() });
  if (recordError) throw new Error('アカウントを削除できませんでした');

  const { error } = await supabase.from('profiles').delete().eq('login_id', loginId);
  if (error) throw new Error('アカウントを削除できませんでした');
}
