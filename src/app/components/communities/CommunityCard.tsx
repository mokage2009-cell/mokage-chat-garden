import { Check, Loader2, Users, UserRound } from "lucide-react";
import type { Community } from "@/app/lib/communities";

type CommunityCardProps = {
  community: Community;
  isOwn: boolean;
  isApplied: boolean;
  isApplying: boolean;
  onOpenProfile: (loginId: string) => void;
  onApply: (communityId: string) => void;
};

export default function CommunityCard({
  community,
  isOwn,
  isApplied,
  isApplying,
  onOpenProfile,
  onApply,
}: CommunityCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpenProfile(community.ownerLoginId)}
        className="group flex flex-col items-start gap-4 p-5 pb-4 text-left transition"
      >
        <div className="flex w-full items-center gap-3">
          <Avatar name={community.ownerName} imageUrl={community.ownerAvatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{community.ownerName}</p>
            <p className="text-xs text-slate-500">コミュニティオーナー</p>
          </div>
          <Users className="h-5 w-5 shrink-0 text-cyan-600" />
        </div>

        <div className="w-full">
          <h3 className="break-words text-[17px] font-bold leading-snug text-slate-900 group-hover:text-cyan-800">
            {community.name}
          </h3>
          {community.description && (
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-[1.5] text-slate-700">
              {community.description}
            </p>
          )}
        </div>

        <span className="text-xs font-semibold text-cyan-700">オーナーのプロフィールを見る</span>
      </button>

      <div className="border-t border-slate-100 px-5 py-3">
        {isOwn ? (
          <span className="flex w-full items-center justify-center rounded-2xl bg-emerald-100 py-2.5 text-sm font-semibold text-emerald-800">
            あなたがオーナーです
          </span>
        ) : isApplied ? (
          <span className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600">
            <Check className="h-4 w-4" />
            申請済み
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(community.id)}
            disabled={isApplying}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
            申請する！
          </button>
        )}
      </div>
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
