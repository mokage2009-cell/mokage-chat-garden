import { ArrowLeft, Pencil } from "lucide-react";
import ProfileCard from "@/app/components/profile/ProfileCard";
import type { Profile } from "@/app/lib/profile";

type ProfileViewProps = {
  profile: Profile;
  onBack: () => void;
  onEdit: () => void;
};

export default function ProfileView({ profile, onBack, onEdit }: ProfileViewProps) {
  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md">
        <ProfileCard
          profile={profile}
          coverAction={
            <button
              type="button"
              onClick={onBack}
              aria-label="戻る"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-md transition hover:bg-white active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
          nameAction={
            <button
              type="button"
              onClick={onEdit}
              className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95"
            >
              <Pencil className="h-4 w-4" />
              編集
            </button>
          }
        />
      </div>
    </div>
  );
}
