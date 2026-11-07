import { supabase } from "@/app/lib/supabase";
import { adminConversationPairs, type AdminRelationship, type AdminScopeMessage } from "@/app/lib/adminChatRules";

export type AdminAccount = {
  loginId: string;
  displayName: string;
  accountNumber: number;
  avatarUrl: string | null;
  createdAt: string;
};

type AccountRow = {
  login_id: string;
  display_name: string;
  account_number: number;
  avatar_image_url: string | null;
  updated_at: string;
};

export async function fetchAllAccounts(): Promise<AdminAccount[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("login_id, display_name, account_number, avatar_image_url, updated_at")
    .order("account_number", { ascending: true });
  if (error) throw new Error("アカウント一覧を取得できませんでした");
  return (data as AccountRow[]).map((row) => ({
    loginId: row.login_id,
    displayName: row.display_name,
    accountNumber: row.account_number,
    avatarUrl: row.avatar_image_url,
    createdAt: row.updated_at,
  }));
}

export type ChatPartner = {
  loginId: string;
  displayName: string;
  avatarUrl: string | null;
  scopeId: string;
  scopeIds: string[];
  context: "dm" | "community" | "timeline";
  lastMessageAt: string;
};

export async function fetchChatPartners(loginId: string): Promise<ChatPartner[]> {
  const [requests, messages, profiles] = await Promise.all([
    supabase.from("friend_requests").select("id, post_id, conversation_scope_id, applicant_login_id, target_login_id, post:friend_posts!post_id(author_login_id)"),
    supabase.from("chat_messages").select("scope_id, context, created_at, sender_login_id, sender:profiles!sender_login_id(display_name, avatar_image_url)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("login_id, display_name, avatar_image_url"),
  ]);
  if (requests.error || messages.error || profiles.error) throw new Error("チャット相手を取得できませんでした");
  const rows = (messages.data ?? []) as unknown as AdminScopeMessage[];
  const pairs = adminConversationPairs(loginId, (requests.data ?? []) as unknown as AdminRelationship[]);
  // A shared legacy recruitment scope may hold several conversations: filter DM senders when reading history.
  for (const msg of rows.filter(r => r.context === "dm" && r.sender_login_id === loginId)) {
    for (const other of rows.filter(r => r.context === "dm" && r.scope_id === msg.scope_id && r.sender_login_id !== loginId)) {
      const scopes = pairs.get(other.sender_login_id) ?? new Set<string>();
      scopes.add(msg.scope_id);
      pairs.set(other.sender_login_id, scopes);
    }
  }
  const partners: ChatPartner[] = [];
  for (const [other, scopes] of pairs) {
    const scopeIds = [...scopes];
    const latest = rows.find(r => r.context === "dm" && scopes.has(r.scope_id) && [loginId, other].includes(r.sender_login_id));
    if (!latest) continue;
    const profile = profiles.data?.find(p => p.login_id === other);
    partners.push({ loginId: other, displayName: profile?.display_name ?? other, avatarUrl: profile?.avatar_image_url ?? null, scopeId: latest.scope_id, scopeIds, context: "dm", lastMessageAt: latest.created_at });
  }
  const ownGroupScopes = new Set(rows.filter(r => r.context !== "dm" && r.sender_login_id === loginId).map(r => `${r.context}:${r.scope_id}`));
  for (const row of rows) {
    if (row.context === "dm" || row.sender_login_id === loginId || !ownGroupScopes.has(`${row.context}:${row.scope_id}`)) continue;
    if (partners.some(p => p.context === row.context && p.scopeId === row.scope_id && p.loginId === row.sender_login_id)) continue;
    partners.push({ loginId: row.sender_login_id, displayName: row.sender?.display_name ?? row.sender_login_id, avatarUrl: row.sender?.avatar_image_url ?? null, scopeId: row.scope_id, scopeIds: [row.scope_id], context: row.context, lastMessageAt: row.created_at });
  }
  return partners.sort((a,b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export type AdminChatMessage = {
  id: string;
  senderLoginId: string;
  senderName: string;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
};

export async function fetchChatMessagesByScope(partner: ChatPartner, accountLoginId: string): Promise<AdminChatMessage[]> {
  let query = supabase
    .from("chat_messages")
    .select(
      "id, sender_login_id, body, media_url, media_type, created_at, sender:profiles!sender_login_id(display_name)",
    )
    .in("scope_id", partner.scopeIds)
    .eq("context", partner.context);
  if (partner.context === "dm") query = query.in("sender_login_id", [accountLoginId, partner.loginId]);
  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) throw new Error("メッセージを取得できませんでした");

  return (
    (data as unknown as {
      id: string;
      sender_login_id: string;
      body: string;
      media_url: string | null;
      media_type: string | null;
      created_at: string;
      sender: { display_name: string } | null;
    }[]) ?? []
  ).map((row) => ({
    id: row.id,
    senderLoginId: row.sender_login_id,
    senderName: row.sender?.display_name ?? row.sender_login_id,
    body: row.body,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    createdAt: row.created_at,
  }));
}

export type AdminPhoto = {
  id: string;
  senderLoginId: string;
  senderName: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
};

export async function fetchAllPhotos(): Promise<AdminPhoto[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, sender_login_id, media_url, media_type, created_at, sender:profiles!sender_login_id(display_name)",
    )
    .not("media_url", "is", null)
    .like("media_type", "image/%")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error("写真を取得できませんでした");

  return (
    (data as unknown as {
      id: string;
      sender_login_id: string;
      media_url: string;
      media_type: string;
      created_at: string;
      sender: { display_name: string } | null;
    }[]) ?? []
  ).map((row) => ({
    id: row.id,
    senderLoginId: row.sender_login_id,
    senderName: row.sender?.display_name ?? row.sender_login_id,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    createdAt: row.created_at,
  }));
}

export type AdminFeedback = {
  id: string;
  senderLoginId: string;
  senderName: string;
  message: string;
  createdAt: string;
};

export async function fetchAllFeedback(): Promise<AdminFeedback[]> {
  const { data, error } = await supabase
    .from("user_feedback")
    .select(
      "id, sender_login_id, message, created_at, sender:profiles!sender_login_id(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error("意見を取得できませんでした");

  return (
    (data as unknown as {
      id: string;
      sender_login_id: string;
      message: string;
      created_at: string;
      sender: { display_name: string } | null;
    }[]) ?? []
  ).map((row) => ({
    id: row.id,
    senderLoginId: row.sender_login_id,
    senderName: row.sender?.display_name ?? row.sender_login_id,
    message: row.message,
    createdAt: row.created_at,
  }));
}

export async function sendAdminNotification(
  recipientLoginId: string,
  title: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    recipient_login_id: recipientLoginId,
    type: "admin",
    title,
    body,
    actor_login_id: null,
  });
  if (error) throw new Error("通知を送信できませんでした");
}

export async function sendBroadcastNotification(title: string, body: string): Promise<void> {
  const { data: accounts, error: fetchError } = await supabase
    .from("profiles")
    .select("login_id")
    .neq("login_id", "mokou1101");

  if (fetchError || !accounts) throw new Error("アカウント一覧を取得できませんでした");

  const inserts = (accounts as { login_id: string }[]).map((acc) => ({
    recipient_login_id: acc.login_id,
    type: "admin" as const,
    title,
    body,
    actor_login_id: null,
  }));

  if (inserts.length === 0) return;

  const { error } = await supabase.from("notifications").insert(inserts);
  if (error) throw new Error("通知の一斉送信に失敗しました");
}
