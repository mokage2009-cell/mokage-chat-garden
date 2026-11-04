import { Check, Loader2, Users } from "lucide-react";
import { JOIN_MODE_LABEL, type Community } from "@/app/lib/communities";

type CommunityCardProps = {
  community: Community;
  isOwn: boolean;
  isApplied: boolean;
  isApplying: boolean;
  onOpenDetail: (communityId: string) => void;
  onApply: (communityId: string) => void;
};

export default function CommunityCard({
  community,
  isOwn,
  isApplied,
  isApplying,
  onOpenDetail,
  onApply,
}: CommunityCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpenDetail(community.id)}
        className="group flex flex-col items-start gap-3 p-5 pb-4 text-left transition"
      >
        <div className="flex w-full items-center gap-3">
          <CommunityAvatar name={community.name} imageUrl={community.avatarImageUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold leading-snug text-slate-900 group-hover:text-cyan-800">
              {community.name}
            </p>
            <p className="text-xs text-slate-500">コミュニティ</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-1.5">
          <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            オーナー：{community.ownerName}
          </span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
            {JOIN_MODE_LABEL[community.joinMode]}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <Users className="h-3.5 w-3.5" />
            {community.memberCount}名
          </span>
        </div>

        {community.description && (
          <p className="line-clamp-2 w-full whitespace-pre-wrap break-words text-sm leading-[1.5] text-slate-700">
            {community.description}
          </p>
        )}

        <span className="text-xs font-semibold text-cyan-700">コミュニティの詳細を見る</span>
      </button>

      <div className="border-t border-slate-100 px-5 py-3">
        {isOwn ? (
          <span className="flex w-full items-center justify-center rounded-2xl bg-emerald-100 py-2.5 text-sm font-semibold text-emerald-800">
            あなたがオーナーです
          </span>
        ) : isApplied ? (
          <span className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600">
            <Check className="h-4 w-4" />
            {community.joinMode === "open" ? "参加済み" : "申請済み"}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(community.id)}
            disabled={isApplying}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
            {community.joinMode === "open" ? "参加する！" : "申請する！"}
          </button>
        )}
      </div>
    </article>
  );
}

function CommunityAvatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : name ? (
        <span className="text-base font-bold">{Array.from(name)[0]}</span>
      ) : (
        <Users className="h-5 w-5" />
      )}
    </span>
  );
}
