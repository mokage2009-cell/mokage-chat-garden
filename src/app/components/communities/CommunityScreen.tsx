import { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import CommunityCard from '@/app/components/communities/CommunityCard';
import CreateCommunityModal from '@/app/components/communities/CreateCommunityModal';
import ProfileModal from '@/app/components/profile/ProfileModal';
import { applyToCommunity, fetchCommunityFeed, type CommunityFeed } from '@/app/lib/communities';

type CommunityScreenProps = {
  loginId: string;
  onClose: () => void;
};

export default function CommunityScreen({ loginId, onClose }: CommunityScreenProps) {
  const [feed, setFeed] = useState<CommunityFeed | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);
  const [applyingCommunityId, setApplyingCommunityId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    fetchCommunityFeed(loginId)
      .then((loaded) => {
        if (!isActive) return;
        setFeed(loaded);
        setLoadError(null);
      })
      .catch((err: Error) => {
        if (isActive) setLoadError(err.message);
      });
    return () => {
      isActive = false;
    };
  }, [loginId, reloadKey]);

  const handleApply = async (communityId: string) => {
    setApplyError(null);
    setApplyingCommunityId(communityId);
    try {
      await applyToCommunity(communityId, loginId);
      setFeed((prev) =>
        prev && { ...prev, appliedCommunityIds: [...prev.appliedCommunityIds, communityId] },
      );
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '申請に失敗しました');
    } finally {
      setApplyingCommunityId(null);
    }
  };

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-2 pt-8">
          <button type="button" onClick={onClose} aria-label="戻る" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">コミュニティ</h1>
          <button type="button" onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:shadow-lg active:scale-95">
            <Plus className="h-4 w-4" />
            作成
          </button>
        </header>
        <p className="pb-5 text-sm text-slate-600">興味のある場所に参加申請してみましょう</p>

        {applyError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{applyError}</p>}
        {loadError ? (
          <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{loadError}</p>
        ) : !feed ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">読み込み中…</p>
        ) : feed.communities.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <p className="font-bold text-slate-900">まだコミュニティがありません</p>
            <p className="mt-1 text-sm text-slate-500">最初のコミュニティを作ってみましょう</p>
          </section>
        ) : (
          <ul className="space-y-4">
            {feed.communities.map((community) => (
              <li key={community.id}>
                <CommunityCard
                  community={community}
                  isOwn={community.ownerLoginId === loginId}
                  isApplied={feed.appliedCommunityIds.includes(community.id)}
                  isApplying={applyingCommunityId === community.id}
                  onOpenProfile={setSelectedLoginId}
                  onApply={handleApply}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCreating && (
        <CreateCommunityModal
          loginId={loginId}
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            setReloadKey((key) => key + 1);
          }}
        />
      )}
      {selectedLoginId && <ProfileModal loginId={selectedLoginId} onClose={() => setSelectedLoginId(null)} />}
    </div>
  );
}
