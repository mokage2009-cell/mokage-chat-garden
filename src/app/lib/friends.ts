import { supabase } from "@/app/lib/supabase";

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

const UNIQUE_VIOLATION = "23505";

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
      .from("friend_posts")
      .select(
        "id, author_login_id, title, message, created_at, author:profiles!author_login_id(display_name, avatar_image_url)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("friend_requests").select("post_id").eq("applicant_login_id", loginId),
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
  const { error } = await supabase.from("friend_posts").insert({
    author_login_id: loginId,
    title: input.title,
    message: input.message,
  });

  if (error) throw new Error(error.message);
}

export async function applyToFriendPost(postId: string, loginId: string): Promise<void> {
  const { error } = await supabase
    .from("friend_requests")
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

type AcceptedRow = {
  id: string;
  post_id: string | null;
  applicant_login_id: string;
  target_login_id: string | null;
  post: { author_login_id: string } | null;
};

export async function fetchFriends(loginId: string): Promise<Friend[]> {
  const myPostIds =
    (await supabase.from("friend_posts").select("id").eq("author_login_id", loginId)).data?.map(
      (r: { id: string }) => r.id,
    ) ?? [];
  const filters = [`applicant_login_id.eq.${loginId}`, `target_login_id.eq.${loginId}`];
  if (myPostIds.length) filters.push(`post_id.in.(${myPostIds.join(",")})`);
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, post_id, applicant_login_id, target_login_id, post:friend_posts!post_id(author_login_id)")
    .eq("status", "accepted")
    .or(filters.join(","))
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const pairs = (data as unknown as AcceptedRow[])
    .map((row) => {
      const other =
        row.applicant_login_id === loginId
          ? (row.target_login_id ?? row.post?.author_login_id ?? null)
          : row.applicant_login_id;
      return other && other !== loginId ? { other, scopeId: row.post_id ?? row.id } : null;
    })
    .filter((x): x is { other: string; scopeId: string } => x !== null);

  const seen = new Set<string>();
  const unique = pairs.filter((p) => (seen.has(p.other) ? false : (seen.add(p.other), true)));
  if (unique.length === 0) return [];
  const { data: profs } = await supabase
    .from("profiles")
    .select("login_id, display_name, avatar_image_url")
    .in("login_id", unique.map((p) => p.other));
  const byId = new Map(
    ((profs ?? []) as { login_id: string; display_name: string; avatar_image_url: string | null }[]).map(
      (p) => [p.login_id, p],
    ),
  );
  return unique.map((p) => ({
    loginId: p.other,
    displayName: byId.get(p.other)?.display_name ?? p.other,
    avatarUrl: byId.get(p.other)?.avatar_image_url ?? null,
    postId: p.scopeId,
  }));
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
  post_id: string | null;
  applicant_login_id: string;
  applicant: { display_name: string; avatar_image_url: string | null } | null;
  post: { title: string } | null;
};

export async function fetchPendingRequests(loginId: string): Promise<PendingRequest[]> {
  const myPostIds =
    (await supabase.from("friend_posts").select("id").eq("author_login_id", loginId)).data?.map(
      (r: { id: string }) => r.id,
    ) ?? [];
  const filters = [`target_login_id.eq.${loginId}`];
  if (myPostIds.length) filters.push(`post_id.in.(${myPostIds.join(",")})`);
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, post_id, applicant_login_id, applicant:profiles!applicant_login_id(display_name, avatar_image_url), post:friend_posts!post_id(title)",
    )
    .or(filters.join(","))
    .eq("status", "pending")
    .neq("applicant_login_id", loginId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as PendingRequestRow[]).map((row) => ({
    requestId: row.id,
    applicantLoginId: row.applicant_login_id,
    applicantName: row.applicant?.display_name ?? row.applicant_login_id,
    applicantAvatarUrl: row.applicant?.avatar_image_url ?? null,
    postTitle: row.post?.title ?? "",
    postId: row.post_id ?? row.id,
  }));
}

export async function respondToFriendRequest(
  requestId: string,
  status: "accepted" | "rejected",
): Promise<void> {
  const { error } = await supabase.from("friend_requests").update({ status }).eq("id", requestId);
  if (error) throw new Error("申請に応答できませんでした");
}
