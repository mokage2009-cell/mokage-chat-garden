import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import ProfileCard from "@/app/components/profile/ProfileCard";
import { fetchProfile, type Profile } from "@/app/lib/profile";
import { supabase } from "@/app/lib/supabase";
import { sendDirectRequest } from "@/app/lib/search";

type ProfileModalProps = {
  loginId: string;
  viewerLoginId?: string;
  onClose: () => void;
};

type Status = "loading" | "none" | "pending" | "friends";

export default function ProfileModal({ loginId, viewerLoginId, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const showRequest = !!viewerLoginId && viewerLoginId !== loginId;

  useEffect(() => {
    let isActive = true;
    fetchProfile(loginId)
      .then((loaded) => {
        if (isActive) setProfile(loaded);
      })
      .catch((err: Error) => {
        if (isActive) setError(err.message);
      });
    if (showRequest) {
      supabase
        .from("friend_requests")
        .select("status, applicant_login_id, target_login_id, post_id, friend_posts(author_login_id)")
        .or(`applicant_login_id.eq.${viewerLoginId},applicant_login_id.eq.${loginId}`)
        .then(({ data }) => {
          if (!isActive) return;
          let s: Status = "none";
          for (const r of (data ?? []) as unknown as Array<{
            status: string;
            applicant_login_id: string;
            target_login_id: string | null;
            friend_posts: { author_login_id: string } | null;
          }>) {
            const target = r.target_login_id ?? r.friend_posts?.author_login_id;
            const pair =
              (r.applicant_login_id === viewerLoginId && target === loginId) ||
              (r.applicant_login_id === loginId && target === viewerLoginId);
            if (!pair) continue;
            if (r.status === "accepted") s = "friends";
            else if (r.status === "pending" && s !== "friends") s = "pending";
          }
          setStatus(s);
        });
    }
    return () => {
      isActive = false;
    };
  }, [loginId, viewerLoginId, showRequest]);

  const handleSend = async () => {
    if (!viewerLoginId) return;
    setSending(true);
    setSendError(null);
    try {
      await sendDirectRequest(loginId, viewerLoginId);
      setStatus("pending");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "申請に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal label="プロフィール" onClose={onClose}>
      {profile ? (
        <>
          <ProfileCard profile={profile} hideLoginId />
          {showRequest && status !== "loading" && (
            <div className="px-6 pb-6">
              {sendError && <p className="mb-2 text-sm text-rose-600">{sendError}</p>}
              <button
                type="button"
                onClick={handleSend}
                disabled={status !== "none" || sending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-bold text-white shadow-md disabled:from-slate-300 disabled:to-slate-400"
              >
                <UserPlus className="h-5 w-5" />
                {status === "friends"
                  ? "フレンドです"
                  : status === "pending"
                    ? "申請済み"
                    : sending
                      ? "送信中…"
                      : "フレンド申請する！"}
              </button>
            </div>
          )}
        </>
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
