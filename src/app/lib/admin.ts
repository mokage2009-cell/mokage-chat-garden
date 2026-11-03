import { supabase } from "@/app/lib/supabase";

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
  context: "dm" | "community" | "timeline";
  lastMessageAt: string;
};

type ScopeRow = {
  scope_id: string;
  context: string;
  created_at: string;
  partner: { display_name: string; avatar_image_url: string | null } | null;
  partner_login_id: string;
};

export async function fetchChatPartners(loginId: string): Promise<ChatPartner[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "scope_id, context, created_at, sender_login_id, partner:profiles!sender_login_id(display_name, avatar_image_url)",
    )
    .or(`sender_login_id.eq.${loginId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error("チャット相手を取得できませんでした");

  const dmPartners = new Map<string, ChatPartner>();

  for (const row of (data as unknown as ScopeRow[]) ?? []) {
    const partnerLoginId = row.partner_login_id;
    if (!partnerLoginId || partnerLoginId === loginId) continue;
    const key = `${row.context}:${row.scope_id}:${partnerLoginId}`;
    if (!dmPartners.has(key)) {
      dmPartners.set(key, {
        loginId: partnerLoginId,
        displayName: row.partner?.display_name ?? partnerLoginId,
        avatarUrl: row.partner?.avatar_image_url ?? null,
        scopeId: row.scope_id,
        context: row.context as ChatPartner["context"],
        lastMessageAt: row.created_at,
      });
    }
  }

  const { data: incomingData, error: incomingError } = await supabase
    .from("chat_messages")
    .select(
      "scope_id, context, created_at, sender_login_id, sender:profiles!sender_login_id(display_name, avatar_image_url)",
    )
    .neq("sender_login_id", loginId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!incomingError) {
    for (const row of (incomingData as unknown as {
      scope_id: string;
      context: string;
      created_at: string;
      sender_login_id: string;
      sender: { display_name: string; avatar_image_url: string | null } | null;
    }[]) ?? []) {
      const key = `${row.context}:${row.scope_id}:${row.sender_login_id}`;
      if (!dmPartners.has(key)) {
        dmPartners.set(key, {
          loginId: row.sender_login_id,
          displayName: row.sender?.display_name ?? row.sender_login_id,
          avatarUrl: row.sender?.avatar_image_url ?? null,
          scopeId: row.scope_id,
          context: row.context as ChatPartner["context"],
          lastMessageAt: row.created_at,
        });
      }
    }
  }

  return Array.from(dmPartners.values()).sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
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

export async function fetchChatMessagesByScope(scopeId: string): Promise<AdminChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, sender_login_id, body, media_url, media_type, created_at, sender:profiles!sender_login_id(display_name)",
    )
    .eq("scope_id", scopeId)
    .order("created_at", { ascending: true })
    .limit(500);

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
