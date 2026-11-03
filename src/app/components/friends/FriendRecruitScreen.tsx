import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Plus, UserRound } from 'lucide-react';
import CreatePostModal from '@/app/components/friends/CreatePostModal';
import FriendPostCard from '@/app/components/friends/FriendPostCard';
import ProfileModal from '@/app/components/profile/ProfileModal';
import { applyToFriendPost, fetchFriendFeed, fetchPendingRequests, respondToFriendRequest, type FriendFeed, type PendingRequest } from '@/app/lib/friends';

type FriendRecruitScreenProps = {
  loginId: string;
  onClose: () => void;
};

export default function FriendRecruitScreen({ loginId, onClose }: FriendRecruitScreenProps) {
  const [feed, setFeed] = useState<FriendFeed | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);
  const [applyingPostId, setApplyingPostId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [showPending, setShowPending] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    Promise.all([fetchFriendFeed(loginId), fetchPendingRequests(loginId)])
      .then(([loaded, loadedPending]) => {
        if (!isActive) return;
        setFeed(loaded);
        setPending(loadedPending);
        setLoadError(null);
      })
      .catch((err: Error) => {
        if (isActive) setLoadError(err.message);
      });
    return () => { isActive = false; };
  }, [loginId, reloadKey]);

  const handleApply = async (postId: string) => {
    setApplyError(null);
    setApplyingPostId(postId);
    try {
      await applyToFriendPost(postId, loginId);
      setFeed((prev) => prev && { ...prev, appliedPostIds: [...prev.appliedPostIds, postId] });
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '申請に失敗しました');
    } finally {
      setApplyingPostId(null);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    setResponding(requestId);
    try {
      await respondToFriendRequest(requestId, status);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '応答に失敗しました');
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-2 pt-8">
          <button type="button" onClick={onClose} aria-label="戻る" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">フレンド募集</h1>
          {pending.length > 0 && (
            <button type="button" onClick={() => setShowPending((v) => !v)} className="relative flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95">
              <Bell className="h-4 w-4" />
              申請{pending.length}件
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{pending.length}</span>
            </button>
          )}
          <button type="button" onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg active:scale-95">
            <Plus className="h-4 w-4" />
            投稿
          </button>
        </header>
        <p className="pb-5 text-sm text-slate-600">気の合う人を見つけて、フレンド申請してみましょう</p>

        {applyError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{applyError}</p>}

        {showPending && pending.length > 0 && (
          <section className="mb-5 space-y-3">
            <h2 className="font-bold text-slate-900">フレンド申請</h2>
            {pending.map((req) => (
              <div key={req.requestId} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                  {req.applicantAvatarUrl ? <img src={req.applicantAvatarUrl} alt="" className="h-full w-full object-cover" /> : req.applicantName ? <span className="text-sm font-bold">{Array.from(req.applicantName)[0]}</span> : <UserRound className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{req.applicantName}</p>
                  <p className="truncate text-xs text-slate-500">「{req.postTitle}」に申請</p>
                </div>
                <button type="button" onClick={() => handleRespond(req.requestId, 'accepted')} disabled={responding === req.requestId} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">承諾</button>
                <button type="button" onClick={() => handleRespond(req.requestId, 'rejected')} disabled={responding === req.requestId} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">拒否</button>
              </div>
            ))}
          </section>
        )}

        {loadError ? (
          <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{loadError}</p>
        ) : !feed ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">読み込み中…</p>
        ) : feed.posts.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <p className="font-bold text-slate-900">まだ投稿がありません</p>
            <p className="mt-1 text-sm text-slate-500">最初の投稿をしてみましょう</p>
          </section>
        ) : (
          <ul className="space-y-4">
            {feed.posts.map((post) => (
              <li key={post.id}>
                <FriendPostCard
                  post={post}
                  isOwn={post.authorLoginId === loginId}
                  isApplied={feed.appliedPostIds.includes(post.id)}
                  isApplying={applyingPostId === post.id}
                  onOpenProfile={setSelectedLoginId}
                  onApply={handleApply}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCreating && (
        <CreatePostModal
          loginId={loginId}
          onClose={() => setIsCreating(false)}
          onCreated={() => { setIsCreating(false); setReloadKey((key) => key + 1); }}
        />
      )}

      {selectedLoginId && <ProfileModal loginId={selectedLoginId} onClose={() => setSelectedLoginId(null)} />}
    </div>
  );
}
