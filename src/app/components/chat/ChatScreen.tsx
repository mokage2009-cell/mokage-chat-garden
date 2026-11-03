import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, UserRound, Bell } from "lucide-react";
import ChatConversation from "@/app/components/chat/ChatConversation";
import {
  fetchFriends,
  fetchPendingRequests,
  respondToFriendRequest,
  type Friend,
  type PendingRequest,
} from "@/app/lib/friends";

type ChatScreenProps = { loginId: string; onClose: () => void };

export default function ChatScreen({ loginId, onClose }: ChatScreenProps) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Friend | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  const reload = useCallback(() => {
    Promise.all([fetchFriends(loginId), fetchPendingRequests(loginId)])
      .then(([loadedFriends, loadedPending]) => {
        setFriends(loadedFriends);
        setPending(loadedPending);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [loginId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleRespond = async (requestId: string, status: "accepted" | "rejected") => {
    setResponding(requestId);
    try {
      await respondToFriendRequest(requestId, status);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "応答に失敗しました");
    } finally {
      setResponding(null);
    }
  };

  if (selected) {
    return (
      <ChatConversation
        context="dm"
        scopeId={selected.postId}
        loginId={loginId}
        title={selected.displayName}
        subtitle=""
        onBack={() => setSelected(null)}
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
          <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">チャット</h1>
          {pending.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPending((v) => !v)}
              className="relative flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
            >
              <Bell className="h-4 w-4" />
              申請{pending.length}件
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {pending.length}
              </span>
            </button>
          )}
        </header>
        <p className="pb-5 text-sm text-slate-600">フレンドを選んでチャットを始めましょう</p>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {showPending && pending.length > 0 && (
          <section className="mb-5 space-y-3">
            <h2 className="font-bold text-slate-900">フレンド申請</h2>
            {pending.map((req) => (
              <div
                key={req.requestId}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
              >
                <Avatar name={req.applicantName} imageUrl={req.applicantAvatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{req.applicantName}</p>
                  <p className="truncate text-xs text-slate-500">「{req.postTitle}」に申請</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRespond(req.requestId, "accepted")}
                  disabled={responding === req.requestId}
                  className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  承諾
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(req.requestId, "rejected")}
                  disabled={responding === req.requestId}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                >
                  拒否
                </button>
              </div>
            ))}
          </section>
        )}

        {!friends ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : friends.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <p className="font-bold text-slate-900">まだフレンドがいません</p>
            <p className="mt-1 text-sm text-slate-500">
              フレンド募集で申請を承諾するとチャットできます
            </p>
          </section>
        ) : (
          <ul className="space-y-3">
            {friends.map((friend) => (
              <li key={friend.loginId}>
                <button
                  type="button"
                  onClick={() => setSelected(friend)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md active:scale-[0.99]"
                >
                  <Avatar name={friend.displayName} imageUrl={friend.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{friend.displayName}</p>
                  </div>
                  <span className="text-sm font-semibold text-cyan-700">チャット</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : name ? (
        <span className="text-base font-bold">{Array.from(name)[0]}</span>
      ) : (
        <UserRound className="h-5 w-5" />
      )}
    </span>
  );
}
