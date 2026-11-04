import { Trash2, UserRound } from "lucide-react";
import type { TimelinePost } from "@/app/lib/timeline";

type TimelinePostCardProps = {
  post: TimelinePost;
  isMine: boolean;
  onOpenProfile: (loginId: string) => void;
  onDelete: (post: TimelinePost) => void;
};

const VISIBILITY_LABEL = {
  all: "全員",
  friends: "フレンドのみ",
  self: "自分のみ",
  communities: "コミュニティ",
} as const;

export default function TimelinePostCard({
  post,
  isMine,
  onOpenProfile,
  onDelete,
}: TimelinePostCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenProfile(post.authorLoginId)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar name={post.authorName} imageUrl={post.authorAvatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{post.authorName}</p>
            <p className="text-xs text-slate-500">
              {formatPostedAt(post.createdAt)}
              {isMine && ` ・ ${VISIBILITY_LABEL[post.visibility]}`}
            </p>
          </div>
        </button>
        {isMine && (
          <button
            type="button"
            aria-label="投稿を削除"
            onClick={() => onDelete(post)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <h2 className="mt-3 break-words text-[17px] font-bold leading-snug text-slate-900">
        {post.title}
      </h2>
      {post.message && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-[1.5] text-slate-700">
          {post.message}
        </p>
      )}
      {post.media.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.media.map((m) =>
            m.type === "video" ? (
              <video key={m.url} src={m.url} controls playsInline className="w-full rounded-xl bg-slate-900" />
            ) : (
              <a key={m.url} href={m.url} target="_blank" rel="noreferrer">
                <img src={m.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
              </a>
            ),
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
