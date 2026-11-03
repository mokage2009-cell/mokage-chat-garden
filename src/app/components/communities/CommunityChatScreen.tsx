import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import ChatConversation from "@/app/components/chat/ChatConversation";
import ProfileModal from "@/app/components/profile/ProfileModal";
import { supabase } from "@/app/lib/supabase";
import {
  approveMember,
  fetchCommunityFeed,
  fetchCommunityMembers,
  rejectMember,
  updateCommunityOwnerProfile,
  updateJoinMode,
  uploadCommunityImage,
  type Community,
  type CommunityFeed,
  type CommunityMember,
  type JoinMode,
} from "@/app/lib/communities";
import {
  COMMUNITY_CHAT_LIMITS,
  createChatRoom,
  deleteChatRoom,
  dissolveCommunity,
  fetchChatRooms,
  type ChatRoom,
} from "@/app/lib/communityChat";
import { PROFILE_LIMITS, validateImageFile } from "@/app/lib/profile";

type CommunityChatScreenProps = { loginId: string; onClose: () => void };

export default function CommunityChatScreen({ loginId, onClose }: CommunityChatScreenProps) {
  const [feed, setFeed] = useState<CommunityFeed | null>(null);
  const [selected, setSelected] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchCommunityFeed(loginId)
      .then(setFeed)
      .catch(() => setError("コミュニティを読み込めませんでした"));
  }, [loginId]);

  if (selected) {
    return (
      <CommunityChatDetail
        community={selected}
        loginId={loginId}
        onBack={() => setSelected(null)}
        onDissolved={() => {
          setSelected(null);
          setFeed(null);
          fetchCommunityFeed(loginId).then(setFeed);
        }}
      />
    );
  }

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-2 pt-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-bold text-slate-900">コミュニティチャット</h1>
        </header>
        <p className="pb-5 text-sm text-slate-600">コミュニティを選んでチャット欄を管理できます</p>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {!feed ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : feed.communities.length === 0 ? (
          <p className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-slate-600">
            参加できるコミュニティがありません
          </p>
        ) : (
          <ul className="space-y-4">
            {feed.communities.map((community) => (
              <li key={community.id}>
                <button
                  type="button"
                  onClick={() => setSelected(community)}
                  className="flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md active:scale-[0.99]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <Users className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-base text-slate-900">
                      {community.name}
                    </strong>
                    <span className="mt-1 block truncate text-sm text-slate-500">
                      オーナー：{community.ownerName}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-cyan-700">開く</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type TabId = "chat" | "members" | "settings";

function CommunityChatDetail({
  community,
  loginId,
  onBack,
  onDissolved,
}: {
  community: Community;
  loginId: string;
  onBack: () => void;
  onDissolved: () => void;
}) {
  const isOwner = community.ownerLoginId === loginId;
  const [localCommunity, setLocalCommunity] = useState<Community>(community);
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [roomName, setRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmDissolve, setConfirmDissolve] = useState(false);

  const reloadRooms = useCallback(() => {
    fetchChatRooms(community.id)
      .then(setRooms)
      .catch(() => setError("チャット欄を読み込めませんでした"));
  }, [community.id]);

  const reloadMembers = useCallback(() => {
    fetchCommunityMembers(community.id)
      .then(setMembers)
      .catch(() => setError("メンバーを読み込めませんでした"));
  }, [community.id]);

  useEffect(() => {
    reloadRooms();
    reloadMembers();
  }, [reloadRooms, reloadMembers]);

  const refreshCommunity = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("communities")
      .select(
        "id, owner_login_id, name, description, created_at, header_image_url, avatar_image_url, owner_message, join_mode, owner:profiles!owner_login_id(display_name, avatar_image_url)",
      )
      .eq("id", community.id)
      .maybeSingle();
    if (!fetchError && data) {
      const row = data as unknown as {
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
      setLocalCommunity({
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
        createdAt: row.created_at,
      });
    }
  }, [community.id]);

  const membersList = members.filter((m) => m.role !== "applicant");
  const applicants = members.filter((m) => m.role === "applicant");
  const shownCommunity = localCommunity;

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomName.trim();
    if (!trimmed || Array.from(trimmed).length > COMMUNITY_CHAT_LIMITS.roomNameMax) {
      setError(`チャット欄名は1〜${COMMUNITY_CHAT_LIMITS.roomNameMax}文字で入力してください`);
      return;
    }
    setIsCreatingRoom(true);
    setError(null);
    try {
      await createChatRoom(community.id, loginId, trimmed);
      setRoomName("");
      await reloadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "チャット欄を作成できませんでした");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("このチャット欄を削除しますか？")) return;
    try {
      await deleteChatRoom(roomId, loginId);
      await reloadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "チャット欄を削除できませんでした");
    }
  };

  const handleApprove = async (membershipId: string) => {
    try {
      await approveMember(membershipId, loginId);
      await reloadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "承認できませんでした");
    }
  };

  const handleReject = async (membershipId: string) => {
    try {
      await rejectMember(membershipId, loginId);
      await reloadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "拒否できませんでした");
    }
  };

  const handleDissolve = async () => {
    try {
      await dissolveCommunity(community.id, loginId);
      onDissolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "コミュニティを解散できませんでした");
    }
  };

  if (activeRoom) {
    return (
      <ChatConversation
        context="community"
        scopeId={activeRoom.id}
        loginId={loginId}
        title={activeRoom.name}
        subtitle={shownCommunity.name}
        onBack={() => setActiveRoom(null)}
      />
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof MessageSquare }[] = [
    { id: "chat", label: "チャット欄", icon: MessageSquare },
    { id: "members", label: "メンバー", icon: Users },
    { id: "settings", label: "設定", icon: Settings },
  ];

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-3 pt-8">
          <button
            type="button"
            onClick={onBack}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 truncate text-xl font-bold text-slate-900">
            {shownCommunity.name}
          </h1>
        </header>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="h-28 bg-gradient-to-br from-cyan-400 to-sky-600">
            {shownCommunity.headerImageUrl && (
              <img
                src={shownCommunity.headerImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cyan-100 text-cyan-700">
                {shownCommunity.avatarImageUrl ? (
                  <img
                    src={shownCommunity.avatarImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-slate-900">
                  {shownCommunity.name}
                </h2>
                <p className="text-xs text-slate-500">
                  オーナー：{shownCommunity.ownerName} ・ 参加人数：{membersList.length}人
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${shownCommunity.joinMode === "open" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {shownCommunity.joinMode === "open" ? "自動参加" : "申請制"}
              </span>
            </div>
            {shownCommunity.ownerMessage && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {shownCommunity.ownerMessage}
              </p>
            )}
          </div>
        </section>

        <nav className="mt-5 flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${activeTab === tab.id ? "bg-cyan-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === "members" && applicants.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {applicants.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {activeTab === "chat" && (
          <div className="mt-4">
            {isOwner && (
              <form onSubmit={handleCreateRoom} className="mb-3 flex gap-2">
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  placeholder="新しいチャット欄"
                  className="flex-1 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isCreatingRoom || rooms.length >= COMMUNITY_CHAT_LIMITS.maxRooms}
                  className="flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </button>
              </form>
            )}
            <ul className="space-y-3">
              {rooms.length ? (
                rooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveRoom(room)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <span className="flex-1 font-semibold text-slate-900">{room.name}</span>
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        aria-label={`${room.name}を削除`}
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500">
                  チャット欄はまだありません
                </li>
              )}
            </ul>
          </div>
        )}

        {activeTab === "members" && (
          <div className="mt-4 space-y-5">
            {isOwner && applicants.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <UserRound className="h-4 w-4 text-amber-600" />
                  参加申請 ({applicants.length}件)
                </h3>
                <ul className="space-y-2">
                  {applicants.map((app) => (
                    <li
                      key={app.id}
                      className="flex items-center gap-3 rounded-2xl bg-amber-50/80 p-3 ring-1 ring-amber-200/50"
                    >
                      <MemberAvatar member={app} onTap={() => setSelectedLoginId(app.loginId)} />
                      <span className="flex-1 truncate text-sm font-semibold text-slate-900">
                        {app.displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApprove(app.id)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        承認
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(app.id)}
                        className="flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        拒否
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h3 className="mb-2 text-sm font-bold text-slate-900">
                参加メンバー ({membersList.length}人)
              </h3>
              <ul className="space-y-2">
                {membersList.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70"
                  >
                    <MemberAvatar
                      member={member}
                      onTap={() => setSelectedLoginId(member.loginId)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {member.displayName}
                      </p>
                      <p className="truncate text-xs text-slate-500">@{member.loginId}</p>
                    </div>
                    {member.role === "owner" ? (
                      <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                        オーナー
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        メンバー
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="mt-4 space-y-4">
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md active:scale-[0.99]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                    <Settings className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-slate-900">コミュニティ設定</span>
                    <span className="block text-xs text-slate-500">
                      ヘッダー・アイコン・名前・一言・参加設定
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDissolve(true)}
                  className="w-full rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  コミュニティを解散する
                </button>
              </>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
                <Settings className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-900">設定はオーナーのみ</p>
                <p className="mt-1 text-xs text-slate-500">
                  コミュニティの設定変更はオーナーが行います
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <OwnerSettingsModal
          community={shownCommunity}
          loginId={loginId}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={async () => {
            setIsSettingsOpen(false);
            await refreshCommunity();
          }}
        />
      )}
      {confirmDissolve && (
        <Modal label="コミュニティ解散の確認" onClose={() => setConfirmDissolve(false)}>
          <div className="space-y-5 p-6 pt-12">
            <h2 className="text-lg font-bold text-slate-900">コミュニティを解散しますか？</h2>
            <p className="text-sm text-slate-600">
              一覧から非表示になり、チャット欄も利用できなくなります。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDissolve(false)}
                className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDissolve}
                className="flex-1 rounded-2xl bg-rose-600 py-3 font-bold text-white"
              >
                解散する
              </button>
            </div>
          </div>
        </Modal>
      )}
      {selectedLoginId && (
        <ProfileModal loginId={selectedLoginId} onClose={() => setSelectedLoginId(null)} />
      )}
    </div>
  );
}

function MemberAvatar({ member, onTap }: { member: CommunityMember; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white"
    >
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-bold">{Array.from(member.displayName)[0]}</span>
      )}
    </button>
  );
}

function OwnerSettingsModal({
  community,
  loginId,
  onClose,
  onSaved,
}: {
  community: Community;
  loginId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(community.name);
  const [message, setMessage] = useState(community.ownerMessage || community.description);
  const [joinMode, setJoinMode] = useState<JoinMode>(community.joinMode);
  const [header, setHeader] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !name.trim() ||
      Array.from(name.trim()).length > 40 ||
      Array.from(message).length > PROFILE_LIMITS.bioMax
    ) {
      setError("名前は1〜40文字、一言は500文字以内で入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const headerUrl = header
        ? await uploadCommunityImage(community.id, "header", header)
        : community.headerImageUrl;
      const avatarUrl = avatar
        ? await uploadCommunityImage(community.id, "avatar", avatar)
        : community.avatarImageUrl;
      await updateCommunityOwnerProfile(community.id, loginId, {
        name: name.trim(),
        ownerMessage: message,
        headerImageUrl: headerUrl,
        avatarImageUrl: avatarUrl,
      });
      if (joinMode !== community.joinMode) {
        await updateJoinMode(community.id, loginId, joinMode);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存できませんでした");
      setSaving(false);
    }
  };

  const pick = (kind: "header" | "avatar", file: File) => {
    const fileError = validateImageFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    if (kind === "header") setHeader(file);
    else setAvatar(file);
  };

  return (
    <Modal label="コミュニティ設定" onClose={onClose}>
      <form onSubmit={save} className="space-y-4 p-6 pt-12">
        <h2 className="text-xl font-bold text-slate-900">コミュニティ設定</h2>

        <label className="block text-sm font-semibold text-slate-800">
          コミュニティ名
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl bg-slate-100 px-4 py-3 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-800">
          一言
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-slate-800">参加方法</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setJoinMode("open")}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${joinMode === "open" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"}`}
            >
              自動参加
            </button>
            <button
              type="button"
              onClick={() => setJoinMode("approval")}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${joinMode === "approval" ? "bg-amber-500 text-white shadow-sm" : "bg-slate-100 text-slate-700"}`}
            >
              申請制
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {joinMode === "open" ? "誰でもすぐに参加できます" : "オーナーの承認が必要です"}
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-800">
          <ImagePlus className="h-5 w-5 text-cyan-600" />
          ヘッダー画像を変更
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick("header", f);
            }}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-800">
          <ImagePlus className="h-5 w-5 text-cyan-600" />
          アイコン画像を変更
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick("avatar", f);
            }}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 font-bold text-white disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "保存中…" : "保存する"}
        </button>
      </form>
    </Modal>
  );
}
