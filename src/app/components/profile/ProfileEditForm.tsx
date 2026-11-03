import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import HobbyTagInput from '@/app/components/profile/HobbyTagInput';
import ProfileImageField from '@/app/components/profile/ProfileImageField';
import { useObjectUrl } from '@/app/hooks/useObjectUrl';
import {
  GENDER_OPTIONS,
  PROFILE_LIMITS,
  saveProfile,
  uploadProfileImage,
  validateImageFile,
  type Gender,
  type Profile,
  type ProfileDraft,
} from '@/app/lib/profile';

type ProfileEditFormProps = {
  profile: Profile;
  onCancel: () => void;
  onSaved: (profile: Profile) => void;
};

function validateDraft(draft: ProfileDraft): string | null {
  if (draft.displayName.length < 1 || Array.from(draft.displayName).length > PROFILE_LIMITS.displayNameMax) {
    return `名前は1〜${PROFILE_LIMITS.displayNameMax}文字で入力してください`;
  }
  if (Array.from(draft.bio).length > PROFILE_LIMITS.bioMax) {
    return `一言は${PROFILE_LIMITS.bioMax}文字以内で入力してください`;
  }
  if (draft.age !== null && (draft.age < PROFILE_LIMITS.ageMin || draft.age > PROFILE_LIMITS.ageMax)) {
    return '年齢は0〜150の範囲で選んでください';
  }
  if (draft.hobbies.length > PROFILE_LIMITS.hobbyMax) {
    return `趣味は${PROFILE_LIMITS.hobbyMax}個まで設定できます`;
  }
  return null;
}

export default function ProfileEditForm({ profile, onCancel, onSaved }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [ageInput, setAgeInput] = useState(profile.age === null ? '' : String(profile.age));
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [hobbies, setHobbies] = useState<string[]>(profile.hobbies);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const headerPreview = useObjectUrl(headerFile);
  const avatarPreview = useObjectUrl(avatarFile);
  const bioLength = Array.from(bio).length;

  const handleImageSelect = (kind: 'header' | 'avatar', file: File) => {
    const imageError = validateImageFile(file);
    if (imageError) {
      setError(imageError);
      return;
    }
    setError(null);
    if (kind === 'header') setHeaderFile(file);
    else setAvatarFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const draft: ProfileDraft = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      age: ageInput === '' ? null : Number(ageInput),
      gender,
      hobbies,
      headerImageUrl: profile.headerImageUrl,
      avatarImageUrl: profile.avatarImageUrl,
    };

    const validationError = validateDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const headerImageUrl = headerFile
        ? await uploadProfileImage(profile.loginId, 'header', headerFile)
        : profile.headerImageUrl;
      const avatarImageUrl = avatarFile
        ? await uploadProfileImage(profile.loginId, 'avatar', avatarFile)
        : profile.avatarImageUrl;

      const saved = await saveProfile(profile.loginId, {
        ...draft,
        headerImageUrl,
        avatarImageUrl,
      });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの保存に失敗しました');
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-28">
      <div className="mx-auto max-w-md">
        <header className="flex items-center gap-3 px-5 pb-4 pt-8">
          <button
            type="button"
            onClick={onCancel}
            aria-label="編集をやめる"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">プロフィールを編集</h2>
        </header>

        <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-4 px-5">
          <Section title="画像">
            <ProfileImageField
              label="ヘッダー画像"
              shape="wide"
              previewUrl={headerPreview ?? profile.headerImageUrl}
              onSelect={(file) => handleImageSelect('header', file)}
            />
            <ProfileImageField
              label="アイコン画像"
              shape="round"
              previewUrl={avatarPreview ?? profile.avatarImageUrl}
              onSelect={(file) => handleImageSelect('avatar', file)}
            />
          </Section>

          <Section title="基本情報">
            <Field label="名前" hint={`${Array.from(displayName).length}/${PROFILE_LIMITS.displayNameMax}`}>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={PROFILE_LIMITS.displayNameMax * 2}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </Field>

            <Field label="年齢">
              <select
                value={ageInput}
                onChange={(event) => setAgeInput(event.target.value)}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">未設定</option>
                {Array.from({ length: PROFILE_LIMITS.ageMax - PROFILE_LIMITS.ageMin + 1 }, (_, index) => (
                  <option key={index} value={PROFILE_LIMITS.ageMin + index}>
                    {PROFILE_LIMITS.ageMin + index}歳
                  </option>
                ))}
              </select>
            </Field>

            <Field label="性別">
              <div role="radiogroup" aria-label="性別" className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = gender === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setGender(option.value)}
                      className={`rounded-2xl py-3 text-sm font-semibold transition active:scale-95 ${
                        isSelected
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Section>

          <Section title="自己紹介">
            <Field label="一言" hint={`${bioLength}/${PROFILE_LIMITS.bioMax}`}>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                placeholder="一言を入力してください"
                className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </Field>

            <Field label="趣味">
              <HobbyTagInput hobbies={hobbies} onChange={setHobbies} />
            </Field>
          </Section>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="submit"
            form="profile-edit-form"
            disabled={isSaving}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 py-3 font-bold text-white shadow-lg shadow-cyan-600/30 transition hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? '保存中…' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
