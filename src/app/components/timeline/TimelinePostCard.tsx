import { MessageCircle, UserRound } from 'lucide-react';
import type { TimelinePost } from '@/app/lib/timeline';

type TimelinePostCardProps = {
  post: TimelinePost;
  onOpenProfile: (loginId: string) => void;
  onOpenChat: (post: TimelinePost) => void;
};

export default function TimelinePostCard({ post, onOpenProfile, onOpenChat }: TimelinePostCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md">
      <button type="button" onClick={() => onOpenProfile(post.authorLoginId)} className="group flex w-full flex-col items-start gap-3 p-5 pb-3 text-left">
        <div className="flex w-full items-center gap-3">
          <Avatar name={post.authorName} imageUrl={post.authorAvatarUrl} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{post.authorName}</p><p className="text-xs text-slate-500">{formatPostedAt(post.createdAt)}</p></div>
        </div>
        <div className="w-full"><h2 className="break-words text-[17px] font-bold leading-snug text-slate-900 group-hover:text-cyan-800">{post.title}</h2>{post.message && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-[1.5] text-slate-700">{post.message}</p>}</div>
        <span className="text-xs font-semibold text-cyan-700">プロフィールを見る</span>
      </button>
      <div className="border-t border-slate-100 px-5 py-2.5">
        <button type="button" onClick={() => onOpenChat(post)} className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          <MessageCircle className="h-4 w-4" />
          チャットする
        </button>
      </div>
    </article>
  );
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">{imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : name ? <span className="text-base font-bold">{Array.from(name)[0]}</span> : <UserRound className="h-5 w-5" />}</span>;
}

function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
