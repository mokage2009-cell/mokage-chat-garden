import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import CreateTimelinePostModal from "@/app/components/timeline/CreateTimelinePostModal";
import TimelinePostCard from "@/app/components/timeline/TimelinePostCard";
import ChatConversation from "@/app/components/chat/ChatConversation";
import ProfileModal from "@/app/components/profile/ProfileModal";
import { fetchTimelinePosts, type TimelinePost } from "@/app/lib/timeline";

type TimelineScreenProps = { loginId: string; onClose: () => void };

export default function TimelineScreen({ loginId, onClose }: TimelineScreenProps) {
  const [posts, setPosts] = useState<TimelinePost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);
  const [chatPost, setChatPost] = useState<TimelinePost | null>(null);

  useEffect(() => {
    let active = true;
    fetchTimelinePosts()
      .then((loaded) => {
        if (active) setPosts(loaded);
      })
      .catch(() => {
        if (active) setError("タイムラインを読み込めませんでした");
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (chatPost) {
    return (
      <ChatConversation
        context="timeline"
        scopeId={chatPost.id}
        loginId={loginId}
        title={chatPost.title}
        subtitle={chatPost.authorName}
        onBack={() => setChatPost(null)}
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
          <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">タイムライン</h1>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            投稿
          </button>
        </header>
        <p className="pb-5 text-sm text-slate-600">みんなの投稿を見てみましょう</p>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {!posts ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : posts.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <p className="font-bold text-slate-900">まだ投稿がありません</p>
            <p className="mt-1 text-sm text-slate-500">最初の投稿をしてみましょう</p>
          </section>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <TimelinePostCard
                  post={post}
                  onOpenProfile={setSelectedLoginId}
                  onOpenChat={setChatPost}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCreating && (
        <CreateTimelinePostModal
          loginId={loginId}
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            setReloadKey((key) => key + 1);
          }}
        />
      )}
      {selectedLoginId && (
        <ProfileModal loginId={selectedLoginId} onClose={() => setSelectedLoginId(null)} />
      )}
    </div>
  );
}
