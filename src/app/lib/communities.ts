import { supabase, signedUrl } from "@/app/lib/supabase";

export const COMMUNITY_LIMITS = {
  nameMax: 40,
  descriptionMax: 500,
} as const;

export type JoinMode = "open" | "approval";

export const JOIN_MODE_LABEL: Record<JoinMode, string> = {
  open: "自動参加制",
  approval: "申請制",
};

export type Community = {
  id: string;
  ownerLoginId: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  headerImageUrl: string | null;
  avatarImageUrl: string | null;
  ownerMessage: string;
  name: string;
  description: string;
  joinMode: JoinMode;
  memberCount: number;
  createdAt: string;
};

export type CommunityFeed = {
  communities: Community[];
  appliedCommunityIds: string[];
};

type CommunityRow = {
  id: string;
  owner_login_id: string;
  name: string;
  description: string;
  created_at: string;
  header_image_url: string | null;
  avatar_image_url: string | null;
  owner_message: string;
  join_mode: JoinMode;
  owner: { display_name: string; avatar_image_url: string | null } | null;
};

const UNIQUE_VIOLATION = "23505";

function toCommunity(row: CommunityRow, memberCount: number): Community {
  return {
    id: row.id,
    ownerLoginId: row.owner_login_id,
    ownerName: row.owner?.display_name ?? row.owner_login_id,
    ownerAvatarUrl: row.owner?.avatar_image_url ?? null,
    headerImageUrl: row.header_image_url,
    avatarImageUrl: row.avatar_image_url,
    ownerMessage: row.owner_message,
    name: row.name,
    description: row.description,
    joinMode: row.join_mode,
    memberCount,
    createdAt: row.created_at,
  };
}

type MembershipSummaryRow = {
  community_id: string;
  applicant_login_id: string;
  role: "owner" | "member" | "applicant";
};

export async function fetchCommunityFeed(loginId: string): Promise<CommunityFeed> {
  const [communitiesResult, membershipsResult] = await Promise.all([
    supabase
      .from("communities")
      .select(
        "id, owner_login_id, name, description, created_at, header_image_url, avatar_image_url, owner_message, join_mode, owner:profiles!owner_login_id(display_name, avatar_image_url)",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("community_memberships").select("community_id, applicant_login_id, role"),
  ]);

  if (communitiesResult.error) throw new Error(communitiesResult.error.message);
  if (membershipsResult.error) throw new Error(membershipsResult.error.message);

  const memberships = (membershipsResult.data as MembershipSummaryRow[] | null) ?? [];
  const counts = new Map<string, number>();
  const appliedCommunityIds: string[] = [];

  for (const row of memberships) {
    if (row.role === "owner" || row.role === "member") {
      counts.set(row.community_id, (counts.get(row.community_id) ?? 0) + 1);
    }
    if (row.applicant_login_id === loginId) appliedCommunityIds.push(row.community_id);
  }

  return {
    communities: (communitiesResult.data as unknown as CommunityRow[]).map((row) =>
      toCommunity(row, counts.get(row.id) ?? 0),
    ),
    appliedCommunityIds,
  };
}

export async function createCommunity(
  loginId: string,
  input: { name: string; description: string },
): Promise<void> {
  const { data, error } = await supabase
    .from("communities")
    .insert({ owner_login_id: loginId, name: input.name, description: input.description })
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("コミュニティを作成できませんでした");

  const { error: membershipError } = await supabase.from("community_memberships").insert({
    community_id: data.id,
    applicant_login_id: loginId,
    role: "owner",
  });

  if (membershipError) throw new Error(membershipError.message);
}

export async function updateCommunityOwnerProfile(
  communityId: string,
  actorLoginId: string,
  input: {
    name: string;
    ownerMessage: string;
    headerImageUrl: string | null;
    avatarImageUrl: string | null;
  },
): Promise<void> {
  const { error } = await supabase.rpc("update_community_owner_profile", {
    p_community_id: communityId,
    p_actor_login_id: actorLoginId,
    p_name: input.name,
    p_owner_message: input.ownerMessage,
    p_header_image_url: input.headerImageUrl,
    p_avatar_image_url: input.avatarImageUrl,
  });
  if (error) throw new Error("コミュニティ情報を保存できませんでした");
}

export async function uploadCommunityImage(
  communityId: string,
  kind: "header" | "avatar",
  file: File,
): Promise<string> {
  const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `communities/${communityId}/${kind}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("profile-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw new Error("画像をアップロードできませんでした");
  return signedUrl("profile-images", path);
}

export async function applyToCommunity(
  communityId: string,
  loginId: string,
  joinMode: JoinMode = "approval",
): Promise<void> {
  const { error } = await supabase.from("community_memberships").insert({
    community_id: communityId,
    applicant_login_id: loginId,
    role: joinMode === "open" ? "member" : "applicant",
  });

  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
}

export type CommunityMember = {
  id: string;
  loginId: string;
  displayName: string;
  avatarUrl: string | null;
  role: "owner" | "member" | "applicant";
  joinedAt: string;
};

type MembershipRow = {
  id: string;
  applicant_login_id: string;
  role: "owner" | "member" | "applicant";
  created_at: string;
  applicant: { display_name: string; avatar_image_url: string | null } | null;
};

export async function fetchCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const { data, error } = await supabase
    .from("community_memberships")
    .select(
      "id, applicant_login_id, role, created_at, applicant:profiles!applicant_login_id(display_name, avatar_image_url)",
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("メンバーを読み込めませんでした");
  return (data as unknown as MembershipRow[]).map((row) => ({
    id: row.id,
    loginId: row.applicant_login_id,
    displayName: row.applicant?.display_name ?? row.applicant_login_id,
    avatarUrl: row.applicant?.avatar_image_url ?? null,
    role: row.role,
    joinedAt: row.created_at,
  }));
}

export async function updateJoinMode(
  communityId: string,
  actorLoginId: string,
  joinMode: JoinMode,
): Promise<void> {
  const { error } = await supabase.rpc("update_community_join_mode", {
    p_community_id: communityId,
    p_actor_login_id: actorLoginId,
    p_join_mode: joinMode,
  });
  if (error) throw new Error("参加設定を変更できませんでした");
}

export async function approveMember(membershipId: string, actorLoginId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_community_member", {
    p_membership_id: membershipId,
    p_actor_login_id: actorLoginId,
  });
  if (error) throw new Error("メンバーを承認できませんでした");
}

export async function rejectMember(membershipId: string, actorLoginId: string): Promise<void> {
  const { error } = await supabase.rpc("reject_community_member", {
    p_membership_id: membershipId,
    p_actor_login_id: actorLoginId,
  });
  if (error) throw new Error("申請を拒否できませんでした");
}
