import { Check, Loader2, Users } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { JOIN_MODE_LABEL, type Community } from "@/app/lib/communities";

type CommunityDetailModalProps = {
  community: Community;
  isOwn: boolean;
  isApplied: boolean;
  isApplying: boolean;
  onApply: (communityId: string) => void;
  onOpenProfile: (loginId: string) => void;
  onClose: () => void;
};

export default function CommunityDetailModal({
  community,
  isOwn,
  isApplied,
  isApplying,
  onApply,
  onOpenProfile,
  onClose,
}: CommunityDetailModalProps) {
  return (
    <Modal label={`${community.name}の詳細`} onClose={onClose}>
      <div className="pb-6">
        <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-cyan-400 to-cyan-600">
          {community.headerImageUrl && (
            <img
              src={community.headerImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="px-6">
          <span className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg ring-4 ring-white">
            {community.avatarImageUrl ? (
              <img src={community.avatarImageUrl} alt="" className="h-full w-full object-cover" />
            ) : community.name ? (
              <span className="text-2xl font-bold">{Array.from(community.name)[0]}</span>
            ) : (
              <Users className="h-8 w-8" />
            )}
          </span>

          <h2 className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900">
            {community.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
              {JOIN_MODE_LABEL[community.joinMode]}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" />
              所属 {community.memberCount}名
            </span>
          </div>

          {community.ownerMessage && (
            <p className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-cyan-50 px-4 py-3 text-sm leading-[1.6] text-slate-800">
              {community.ownerMessage}
            </p>
          )}

          {community.description && (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-[1.6] text-slate-700">
              {community.description}
            </p>
          )}

          <button
            type="button"
            onClick={() => onOpenProfile(community.ownerLoginId)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left ring-1 ring-slate-200/70 transition hover:bg-slate-100 active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white">
              {community.ownerAvatarUrl ? (
                <img
                  src={community.ownerAvatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold">
                  {Array.from(community.ownerName)[0] ?? "?"}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900">
                {community.ownerName}
              </span>
              <span className="block text-xs text-slate-500">オーナーのプロフィールを見る</span>
            </span>
          </button>

          <div className="mt-5">
            {isOwn ? (
              <span className="flex w-full items-center justify-center rounded-2xl bg-emerald-100 py-3 text-sm font-semibold text-emerald-800">
                あなたがオーナーです
              </span>
            ) : isApplied ? (
              <span className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600">
                <Check className="h-4 w-4" />
                {community.joinMode === "open" ? "参加済み" : "申請済み"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApply(community.id)}
                disabled={isApplying}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
                {community.joinMode === "open" ? "参加する！" : "申請する！"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
