import { supabase } from '@/app/lib/supabase';

export type User = {
  id: string;
  name: string;
  accountNumber: number;
};

export async function signIn(id: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('login_id, display_name, password, account_number')
    .eq('login_id', id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as { login_id: string; display_name: string; password: string; account_number: number };
  if (row.password !== password) return null;

  return { id: row.login_id, name: row.display_name, accountNumber: row.account_number };
}

export async function signUp(
  id: string,
  password: string,
  displayName: string,
): Promise<{ user: User } | { error: string }> {
  if (!/^[A-Za-z0-9]{1,30}$/.test(id)) {
    return { error: 'ユーザーIDは半角英数字1〜30文字で入力してください' };
  }
  if (password.length < 1) {
    return { error: 'パスワードを入力してください' };
  }
  if (displayName.trim().length < 1 || displayName.trim().length > 30) {
    return { error: '表示名は1〜30文字で入力してください' };
  }

  const { data: deletedRecord } = await supabase
    .from('deleted_user_ids')
    .select('deleted_at')
    .eq('login_id', id)
    .maybeSingle();

  if (deletedRecord) {
    const deletedAt = new Date((deletedRecord as { deleted_at: string }).deleted_at).getTime();
    const elapsed = Date.now() - deletedAt;
    if (elapsed < 24 * 60 * 60 * 1000) {
      const remainingMs = 24 * 60 * 60 * 1000 - elapsed;
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      return { error: `このユーザーIDは最近削除されたため、あと約${remainingHours}時間後に再利用できます` };
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      login_id: id,
      password,
      display_name: displayName.trim(),
    })
    .select('login_id, display_name, account_number')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return { error: 'このユーザーIDは既に使われています' };
    }
    return { error: 'アカウントを作成できませんでした' };
  }
  if (!data) {
    return { error: 'アカウントを作成できませんでした' };
  }

  const row = data as { login_id: string; display_name: string; account_number: number };
  return {
    user: { id: row.login_id, name: row.display_name, accountNumber: row.account_number },
  };
}
