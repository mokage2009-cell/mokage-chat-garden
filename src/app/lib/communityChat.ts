import { supabase } from "@/app/lib/supabase";

export const COMMUNITY_CHAT_LIMITS = { roomNameMax: 40, maxRooms: 50 } as const;

export type ChatRoom = { id: string; communityId: string; name: string; createdAt: string };

type ChatRoomRow = { id: string; community_id: string; name: string; created_at: string };

export async function fetchChatRooms(communityId: string): Promise<ChatRoom[]> {
  const { data, error } = await supabase
    .from("community_chat_rooms")
    .select("id, community_id, name, created_at")
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("チャット欄を読み込めませんでした");
  return (data as ChatRoomRow[]).map((row) => ({
    id: row.id,
    communityId: row.community_id,
    name: row.name,
    createdAt: row.created_at,
  }));
}

export async function createChatRoom(
  communityId: string,
  actorLoginId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase.rpc("create_community_chat_room", {
    p_community_id: communityId,
    p_actor_login_id: actorLoginId,
    p_name: name,
  });
  if (error) throw new Error("チャット欄を作成できませんでした");
}

export async function deleteChatRoom(roomId: string, actorLoginId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_community_chat_room", {
    p_room_id: roomId,
    p_actor_login_id: actorLoginId,
  });
  if (error) throw new Error("チャット欄を削除できませんでした");
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const { error } = await supabase.rpc("leave_community", { p_community_id: communityId });
  if (error) throw new Error("退会できませんでした");
}

export async function dissolveCommunity(communityId: string, actorLoginId: string): Promise<void> {
  const { error } = await supabase.rpc("dissolve_community", {
    p_community_id: communityId,
    p_actor_login_id: actorLoginId,
  });
  if (error) throw new Error("コミュニティを解散できませんでした");
}
