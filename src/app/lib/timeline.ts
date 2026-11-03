import { supabase } from '@/app/lib/supabase';

export const TIMELINE_LIMITS = { titleMax: 40, messageMax: 500 } as const;

export type TimelinePost = {
  id: string;
  authorLoginId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
  message: string;
  createdAt: string;
};

type TimelinePostRow = {
  id: string;
  author_login_id: string;
  title: string;
  message: string;
  created_at: string;
  author: { display_name: string; avatar_image_url: string | null } | null;
};

function toTimelinePost(row: TimelinePostRow): TimelinePost {
  return {
    id: row.id,
    authorLoginId: row.author_login_id,
    authorName: row.author?.display_name ?? row.author_login_id,
    authorAvatarUrl: row.author?.avatar_image_url ?? null,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function fetchTimelinePosts(): Promise<TimelinePost[]> {
  const { data, error } = await supabase
    .from('timeline_posts')
    .select('id, author_login_id, title, message, created_at, author:profiles!author_login_id(display_name, avatar_image_url)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('タイムラインを読み込めませんでした');
  return (data as unknown as TimelinePostRow[]).map(toTimelinePost);
}

export async function createTimelinePost(
  loginId: string,
  input: { title: string; message: string },
): Promise<void> {
  const { error } = await supabase.from('timeline_posts').insert({
    author_login_id: loginId,
    title: input.title,
    message: input.message,
  });
  if (error) throw new Error('投稿できませんでした');
}
