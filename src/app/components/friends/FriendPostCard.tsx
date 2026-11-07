import { Check, Loader2, UserRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FriendPost } from "@/app/lib/friends";

type FriendPostCardProps = {
  post: FriendPost;
  isOwn: boolean;
  isApplied: boolean;
  isFriend: boolean;
  isApplying: boolean;
  onOpenProfile: (loginId: string) => void;
  onApply: (postId: string) => void;
  onDelete: (postId: string) => void;
};

export default function FriendPostCard({
  post,
  isOwn,
  isApplied,
  isFriend,
  isApplying,
  onOpenProfile,
  onApply,
  onDelete,
}: FriendPostCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpenProfile(post.authorLoginId)}
        className="group flex flex-col items-start gap-3 p-5 pb-4 text-left transition"
      >
        <div className="flex w-full items-center gap-3">
          <Avatar name={post.authorName} imageUrl={post.authorAvatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{post.authorName}</p>
            <p className="text-xs text-slate-500">{formatPostedAt(post.createdAt)}</p>
          </div>
          {isOwn && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              あなたの投稿
            </span>
          )}
        </div>

        <div className="w-full">
          <h3 className="break-words text-[17px] font-bold leading-snug text-slate-900 group-hover:text-cyan-800">
            {post.title}
          </h3>
          {post.message && (
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-[1.5] text-slate-700">
              {post.message}
            </p>
          )}
        </div>

        <span className="text-xs font-semibold text-cyan-700">プロフィールを見る</span>
      </button>

      {isOwn && <div className="flex justify-end border-t border-border px-5 py-2">
        <Button variant="ghost" size="icon" aria-label="募集投稿を削除" title="募集投稿を削除" onClick={() => onDelete(post.id)}><Trash2 /></Button>
      </div>}
      {!isOwn && (
        <div className="border-t border-slate-100 px-5 py-3">
          {isApplied || isFriend ? (
            <span className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600">
              <Check className="h-4 w-4" />
              {isFriend ? "フレンド済み" : "申請済み"}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onApply(post.id)}
              disabled={isApplying}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
              申請する！
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
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

function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
