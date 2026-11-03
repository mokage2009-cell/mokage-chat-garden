import { supabase } from '@/app/lib/supabase';

export const FRIEND_POST_LIMITS = {
  titleMax: 40,
  messageMax: 500,
} as const;

export type FriendPost = {
  id: string;
  authorLoginId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
  message: string;
  createdAt: string;
};

type FriendPostRow = {
  id: string;
  author_login_id: string;
  title: string;
  message: string;
  created_at: string;
  author: { display_name: string; avatar_image_url: string | null } | null;
};

export type FriendFeed = {
  posts: FriendPost[];
  appliedPostIds: string[];
};

const UNIQUE_VIOLATION = '23505';

function toFriendPost(row: FriendPostRow): FriendPost {
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

export async function fetchFriendFeed(loginId: string): Promise<FriendFeed> {
  const [postsResult, requestsResult] = await Promise.all([
    supabase
      .from('friend_posts')
      .select(
        'id, author_login_id, title, message, created_at, author:profiles!author_login_id(display_name, avatar_image_url)',
      )
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('friend_requests').select('post_id').eq('applicant_login_id', loginId),
  ]);

  if (postsResult.error) throw new Error(postsResult.error.message);
  if (requestsResult.error) throw new Error(requestsResult.error.message);

  return {
    posts: (postsResult.data as unknown as FriendPostRow[]).map(toFriendPost),
    appliedPostIds: (requestsResult.data as { post_id: string }[]).map((row) => row.post_id),
  };
}

export async function createFriendPost(
  loginId: string,
  input: { title: string; message: string },
): Promise<void> {
  const { error } = await supabase.from('friend_posts').insert({
    author_login_id: loginId,
    title: input.title,
    message: input.message,
  });

  if (error) throw new Error(error.message);
}

export async function applyToFriendPost(postId: string, loginId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .insert({ post_id: postId, applicant_login_id: loginId });

  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
}

export type Friend = {
  loginId: string;
  displayName: string;
  avatarUrl: string | null;
  postId: string;
};

type FriendRow = {
  post_id: string;
  applicant_login_id: string;
  applicant: { display_name: string; avatar_image_url: string | null } | null;
};

type IncomingFriendRow = {
  post_id: string;
  applicant_login_id: string;
  applicant: { display_name: string; avatar_image_url: string | null } | null;
};

export async function fetchFriends(loginId: string): Promise<Friend[]> {
  const [outgoing, incoming] = await Promise.all([
    supabase
      .from('friend_requests')
      .select('post_id, applicant_login_id, applicant:profiles!applicant_login_id(display_name, avatar_image_url)')
      .eq('applicant_login_id', loginId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false }),
    supabase
      .from('friend_requests')
      .select('post_id, applicant_login_id, applicant:profiles!applicant_login_id(display_name, avatar_image_url)')
      .in('post_id', (await supabase.from('friend_posts').select('id').eq('author_login_id', loginId)).data?.map((r: { id: string }) => r.id) ?? [])
      .eq('status', 'accepted')
      .neq('applicant_login_id', loginId)
      .order('created_at', { ascending: false }),
  ]);

  if (outgoing.error) throw new Error(outgoing.error.message);
  if (incoming.error) throw new Error(incoming.error.message);

  const outgoingFriends = (outgoing.data as unknown as FriendRow[]).map((row) => ({
    loginId: row.applicant_login_id,
    displayName: row.applicant?.display_name ?? row.applicant_login_id,
    avatarUrl: row.applicant?.avatar_image_url ?? null,
    postId: row.post_id,
  }));

  const incomingFriends = (incoming.data as unknown as IncomingFriendRow[]).map((row) => ({
    loginId: row.applicant_login_id,
    displayName: row.applicant?.display_name ?? row.applicant_login_id,
    avatarUrl: row.applicant?.avatar_image_url ?? null,
    postId: row.post_id,
  }));

  const seen = new Set<string>();
  return [...outgoingFriends, ...incomingFriends].filter((f) => {
    if (seen.has(f.loginId)) return false;
    seen.add(f.loginId);
    return true;
  });
}

export type PendingRequest = {
  requestId: string;
  applicantLoginId: string;
  applicantName: string;
  applicantAvatarUrl: string | null;
  postTitle: string;
  postId: string;
};

type PendingRequestRow = {
  id: string;
  post_id: string;
  applicant_login_id: string;
  applicant: { display_name: string; avatar_image_url: string | null } | null;
  post: { title: string } | null;
};

export async function fetchPendingRequests(loginId: string): Promise<PendingRequest[]> {
  const { data: postIds } = await supabase
    .from('friend_posts')
    .select('id')
    .eq('author_login_id', loginId);
  if (!postIds || postIds.length === 0) return [];

  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, post_id, applicant_login_id, applicant:profiles!applicant_login_id(display_name, avatar_image_url), post:friend_posts!post_id(title)')
    .in('post_id', postIds.map((r: { id: string }) => r.id))
    .eq('status', 'pending')
    .neq('applicant_login_id', loginId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as PendingRequestRow[]).map((row) => ({
    requestId: row.id,
    applicantLoginId: row.applicant_login_id,
    applicantName: row.applicant?.display_name ?? row.applicant_login_id,
    applicantAvatarUrl: row.applicant?.avatar_image_url ?? null,
    postTitle: row.post?.title ?? '',
    postId: row.post_id,
  }));
}

export async function respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw new Error('申請に応答できませんでした');
}
