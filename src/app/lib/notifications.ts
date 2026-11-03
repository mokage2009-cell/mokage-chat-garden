import { supabase } from '@/app/lib/supabase';

export type NotificationType = 'friend_accepted' | 'admin' | 'community' | 'system';

export type AppNotification = {
  id: string;
  recipientLoginId: string;
  type: NotificationType;
  title: string;
  body: string;
  actorLoginId: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  recipient_login_id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor_login_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: { display_name: string; avatar_image_url: string | null } | null;
};

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    recipientLoginId: row.recipient_login_id,
    type: row.type,
    title: row.title,
    body: row.body,
    actorLoginId: row.actor_login_id,
    actorName: row.actor?.display_name ?? null,
    actorAvatarUrl: row.actor?.avatar_image_url ?? null,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(loginId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, recipient_login_id, type, title, body, actor_login_id, is_read, created_at, actor:profiles!actor_login_id(display_name, avatar_image_url)',
    )
    .eq('recipient_login_id', loginId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('通知を読み込めませんでした');
  return (data as unknown as NotificationRow[]).map(toNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error('通知を既読にできませんでした');
}

export async function markAllNotificationsRead(loginId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_login_id', loginId)
    .eq('is_read', false);
  if (error) throw new Error('通知を一括既読にできませんでした');
}
