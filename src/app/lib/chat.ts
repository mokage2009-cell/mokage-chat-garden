import { supabase, signedUrl } from "@/app/lib/supabase";

export const CHAT_LIMITS = {
  textMax: 10000,
  mediaMaxBytes: 100 * 1024 * 1024,
} as const;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

export type ChatContext = "dm" | "community" | "timeline";

export type CallStatus = "request" | "accepted" | "rejected" | "cancelled" | "ended" | null;

export type ChatMessage = {
  id: string;
  context: ChatContext;
  scopeId: string;
  senderLoginId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  callType: "audio" | "video" | null;
  callDurationSec: number | null;
  callStatus: CallStatus;
  createdAt: string;
};

type ChatMessageRow = {
  id: string;
  context: ChatContext;
  scope_id: string;
  sender_login_id: string;
  body: string;
  media_url: string | null;
  media_type: string | null;
  call_type: "audio" | "video" | null;
  call_duration_sec: number | null;
  call_status: CallStatus;
  created_at: string;
  sender: { display_name: string; avatar_image_url: string | null } | null;
};

function toMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    context: row.context,
    scopeId: row.scope_id,
    senderLoginId: row.sender_login_id,
    senderName: row.sender?.display_name ?? row.sender_login_id,
    senderAvatarUrl: row.sender?.avatar_image_url ?? null,
    body: row.body,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    callType: row.call_type,
    callDurationSec: row.call_duration_sec,
    callStatus: row.call_status ?? null,
    createdAt: row.created_at,
  };
}

export async function fetchMessages(context: ChatContext, scopeId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, context, scope_id, sender_login_id, body, media_url, media_type, call_type, call_duration_sec, call_status, created_at, sender:profiles!sender_login_id(display_name, avatar_image_url)",
    )
    .eq("context", context)
    .eq("scope_id", scopeId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error("メッセージを読み込めませんでした");
  return (data as unknown as ChatMessageRow[]).map(toMessage);
}

export async function sendTextMessage(
  context: ChatContext,
  scopeId: string,
  senderLoginId: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from("chat_messages").insert({
    context,
    scope_id: scopeId,
    sender_login_id: senderLoginId,
    body,
  });
  if (error) throw new Error("メッセージを送信できませんでした");
}

export async function sendMediaMessage(
  context: ChatContext,
  scopeId: string,
  senderLoginId: string,
  file: File,
  mediaUrl: string,
): Promise<void> {
  const { error } = await supabase.from("chat_messages").insert({
    context,
    scope_id: scopeId,
    sender_login_id: senderLoginId,
    body: "",
    media_url: mediaUrl,
    media_type: file.type,
  });
  if (error) throw new Error("メディアを送信できませんでした");
}

export async function sendCallMessage(
  context: ChatContext,
  scopeId: string,
  senderLoginId: string,
  callType: "audio" | "video",
  durationSec: number,
): Promise<void> {
  const { error } = await supabase.from("chat_messages").insert({
    context,
    scope_id: scopeId,
    sender_login_id: senderLoginId,
    body: "",
    call_type: callType,
    call_duration_sec: durationSec,
    call_status: "ended",
  });
  if (error) throw new Error("通話記録を保存できませんでした");
}

export async function sendCallRequest(
  context: ChatContext,
  scopeId: string,
  senderLoginId: string,
  callType: "audio" | "video",
): Promise<string> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      context,
      scope_id: scopeId,
      sender_login_id: senderLoginId,
      body: "",
      call_type: callType,
      call_status: "request",
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error("通話申し込みを送信できませんでした");
  if (!data) throw new Error("通話申し込みを作成できませんでした");
  return data.id;
}

export async function updateCallStatus(
  messageId: string,
  status: "accepted" | "rejected" | "cancelled",
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .update({ call_status: status })
    .eq("id", messageId);
  if (error) throw new Error("通話ステータスを更新できませんでした");
}

export async function endCallRequest(messageId: string, durationSec: number): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .update({ call_status: "ended", call_duration_sec: durationSec })
    .eq("id", messageId);
  if (error) throw new Error("通話記録を保存できませんでした");
}

export async function fetchPendingCallRequest(
  context: ChatContext,
  scopeId: string,
  senderLoginId: string,
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, context, scope_id, sender_login_id, body, media_url, media_type, call_type, call_duration_sec, call_status, created_at, sender:profiles!sender_login_id(display_name, avatar_image_url)",
    )
    .eq("context", context)
    .eq("scope_id", scopeId)
    .eq("sender_login_id", senderLoginId)
    .eq("call_status", "request")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ? toMessage(data as unknown as ChatMessageRow) : null;
}

export async function fetchIncomingCallRequest(
  context: ChatContext,
  scopeId: string,
  receiverLoginId: string,
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, context, scope_id, sender_login_id, body, media_url, media_type, call_type, call_duration_sec, call_status, created_at, sender:profiles!sender_login_id(display_name, avatar_image_url)",
    )
    .eq("context", context)
    .eq("scope_id", scopeId)
    .neq("sender_login_id", receiverLoginId)
    .eq("call_status", "request")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ? toMessage(data as unknown as ChatMessageRow) : null;
}

export function validateMediaFile(file: File): string | null {
  if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
    return "対応形式は JPEG・PNG・WebP・GIF・MP4・WebM です";
  }
  if (file.size > CHAT_LIMITS.mediaMaxBytes) {
    return "ファイルは100MB以下にしてください";
  }
  return null;
}

export async function uploadChatMedia(
  context: ChatContext,
  scopeId: string,
  senderLoginId: string,
  file: File,
): Promise<string> {
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : (file.type.split("/")[1] ?? "bin");
  const path = `chat/${context}/${scopeId}/${senderLoginId}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw new Error("ファイルをアップロードできませんでした");
  return signedUrl("chat-media", path);
}

export function isImageMessage(mediaType: string | null): boolean {
  return mediaType !== null && mediaType.startsWith("image/");
}

export function isVideoMessage(mediaType: string | null): boolean {
  return mediaType !== null && mediaType.startsWith("video/");
}
