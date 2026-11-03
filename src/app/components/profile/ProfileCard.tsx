import { useState, type ReactNode } from "react";
import { CalendarDays, UserRound } from "lucide-react";
import { GENDER_OPTIONS, type Profile } from "@/app/lib/profile";

type ProfileCardProps = {
  profile: Profile;
  coverAction?: ReactNode;
  nameAction?: ReactNode;
};

export default function ProfileCard({ profile, coverAction, nameAction }: ProfileCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [headerFailed, setHeaderFailed] = useState(false);
  const genderLabel =
    GENDER_OPTIONS.find((option) => option.value === profile.gender)?.label ?? "未設定";

  return (
    <div>
      <div className="relative">
        <div className="h-32 w-full overflow-hidden bg-gradient-to-br from-cyan-400 via-sky-500 to-sky-600">
          {profile.headerImageUrl && !headerFailed && (
            <img
              src={profile.headerImageUrl}
              alt=""
              onError={() => setHeaderFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {coverAction && <div className="absolute left-4 top-4">{coverAction}</div>}

        <div className="absolute -bottom-10 left-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg ring-4 ring-white">
          {profile.avatarImageUrl && !avatarFailed ? (
            <img
              src={profile.avatarImageUrl}
              alt=""
              onError={() => setAvatarFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="h-10 w-10 text-white" strokeWidth={2} />
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-14">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold tracking-tight text-slate-900">
              {profile.displayName}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">@{profile.loginId}</p>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700">
                No.{String(profile.accountNumber).padStart(4, "0")}
              </span>
              {profile.accountNumber === 1 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  オーナー
                </span>
              )}
            </div>
          </div>
          {nameAction}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <InfoChip icon={<CalendarDays className="h-4 w-4" />}>
            {profile.age !== null ? `${profile.age}歳` : "年齢 未設定"}
          </InfoChip>
          <InfoChip icon={<UserRound className="h-4 w-4" />}>{genderLabel}</InfoChip>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <h3 className="text-sm font-bold text-slate-900">一言</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-[1.5] text-slate-700">
            {profile.bio || "まだ一言が設定されていません"}
          </p>
        </section>

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <h3 className="text-sm font-bold text-slate-900">趣味</h3>
          {profile.hobbies.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.hobbies.map((hobby) => (
                <li
                  key={hobby}
                  className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900"
                >
                  {hobby}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">まだ趣味が設定されていません</p>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
      {icon}
      {children}
    </span>
  );
}
