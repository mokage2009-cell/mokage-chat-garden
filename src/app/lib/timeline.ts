import { supabase, signedUrl } from "@/app/lib/supabase";

export const TIMELINE_LIMITS = { titleMax: 40, messageMax: 500, mediaMax: 20, fileMaxMb: 100 } as const;

export type Visibility = "all" | "friends" | "self" | "communities";
export type TimelineMedia = { url: string; type: "image" | "video" };

export type TimelinePost = {
  id: string;
  authorLoginId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
  message: string;
  createdAt: string;
  visibility: Visibility;
  media: TimelineMedia[];
};

type TimelinePostRow = {
  id: string;
  author_login_id: string;
  title: string;
  message: string;
  created_at: string;
  visibility: Visibility;
  media: TimelineMedia[] | null;
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
    visibility: row.visibility,
    media: Array.isArray(row.media) ? row.media : [],
  };
}

export async function fetchTimelinePosts(): Promise<TimelinePost[]> {
  const { data, error } = await supabase
    .from("timeline_posts")
    .select(
      "id, author_login_id, title, message, created_at, visibility, media, author:profiles!author_login_id(display_name, avatar_image_url)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("タイムラインを読み込めませんでした");
  return (data as unknown as TimelinePostRow[]).map(toTimelinePost);
}

export async function uploadTimelineMedia(loginId: string, file: File): Promise<TimelineMedia> {
  const type = file.type.startsWith("video/") ? "video" : "image";
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `timeline/${loginId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { contentType: file.type, cacheControl: "3600" });
  if (error) throw new Error("ファイルをアップロードできませんでした");
  return { url: await signedUrl("chat-media", path), type };
}

export async function createTimelinePost(
  loginId: string,
  input: {
    title: string;
    message: string;
    visibility: Visibility;
    communityIds: string[];
    media: TimelineMedia[];
  },
): Promise<void> {
  const { error } = await supabase.from("timeline_posts").insert({
    author_login_id: loginId,
    title: input.title,
    message: input.message,
    visibility: input.visibility,
    community_ids: input.visibility === "communities" ? input.communityIds : [],
    media: input.media,
  });
  if (error) throw new Error("投稿できませんでした");
}

export async function deleteTimelinePost(id: string): Promise<void> {
  const { error } = await supabase.from("timeline_posts").delete().eq("id", id);
  if (error) throw new Error("削除できませんでした");
}

export async function fetchMyCommunities(loginId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("community_memberships")
    .select("community:communities!inner(id, name, dissolved_at)")
    .eq("applicant_login_id", loginId)
    .in("role", ["owner", "member"]);
  if (error) throw new Error("コミュニティを読み込めませんでした");
  return (data as unknown as { community: { id: string; name: string } | null }[])
    .map((r) => r.community)
    .filter((c): c is { id: string; name: string } => !!c);
}
