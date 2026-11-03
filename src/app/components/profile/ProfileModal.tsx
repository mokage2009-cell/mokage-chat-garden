import { useEffect, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import ProfileCard from "@/app/components/profile/ProfileCard";
import { fetchProfile, type Profile } from "@/app/lib/profile";

type ProfileModalProps = {
  loginId: string;
  onClose: () => void;
};

export default function ProfileModal({ loginId, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Modal label="プロフィール" onClose={onClose}>
      {profile ? (
        <ProfileCard profile={profile} />
      ) : (
        <p
          role={error ? "alert" : "status"}
          className="px-6 py-16 text-center text-sm text-slate-600"
        >
          {error ?? "読み込み中…"}
        </p>
      )}
    </Modal>
  );
}
