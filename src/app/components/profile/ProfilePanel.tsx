import { useEffect, useState, type ReactNode } from 'react';
import { fetchProfile, type Profile } from '@/app/lib/profile';
import ProfileEditForm from '@/app/components/profile/ProfileEditForm';
import ProfileView from '@/app/components/profile/ProfileView';

type ProfilePanelProps = {
  loginId: string;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
};

export default function ProfilePanel({ loginId, onClose, onSaved }: ProfilePanelProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let isActive = true;
    fetchProfile(loginId)
      .then((loaded) => {
        if (isActive) setProfile(loaded);
      })
      .catch((err: Error) => {
        if (isActive) setError(err.message);
      });
    return () => {
      isActive = false;
    };
  }, [loginId]);

  if (error) {
    return (
      <StatusScreen onClose={onClose}>
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      </StatusScreen>
    );
  }

  if (!profile) {
    return (
      <StatusScreen onClose={onClose}>
        <p className="text-sm text-slate-600">読み込み中…</p>
      </StatusScreen>
    );
  }

  if (isEditing) {
    return (
      <ProfileEditForm
        profile={profile}
        onCancel={() => setIsEditing(false)}
        onSaved={(saved) => {
          setProfile(saved);
          setIsEditing(false);
          onSaved(saved);
        }}
      />
    );
  }

  return <ProfileView profile={profile} onBack={onClose} onEdit={() => setIsEditing(true)} />;
}

function StatusScreen({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="animate-screen-in flex min-h-screen flex-col items-center justify-center gap-6 bg-sky-50 px-6 text-center">
      {children}
      <button
        type="button"
        onClick={onClose}
        className="rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95"
      >
        戻る
      </button>
    </div>
  );
}
