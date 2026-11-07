import { useEffect, useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/app/components/ui/Modal";
import ProfileCard from "@/app/components/profile/ProfileCard";
import { fetchProfile, type Profile } from "@/app/lib/profile";
import { fetchRelationships, removeFriend } from "@/app/lib/friends";
import { relationshipStatus } from "@/app/lib/friendshipRules";
import { sendDirectRequest } from "@/app/lib/search";

type ProfileModalProps = {
  loginId: string;
  viewerLoginId?: string;
  onClose: () => void;
};

type Status = "loading" | "none" | "pending" | "accepted";

export default function ProfileModal({ loginId, viewerLoginId, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [removeStep, setRemoveStep] = useState<0 | 1 | 2>(0);
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
      fetchRelationships(viewerLoginId ?? "").then(rows => {
        if (isActive && viewerLoginId) setStatus(relationshipStatus(rows, viewerLoginId, loginId));
      }).catch(() => { if (isActive) setSendError("フレンド状態を確認できませんでした"); });
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

  const handleRemove = async () => {
    setSending(true);
    setSendError(null);
    try {
      await removeFriend(loginId);
      setStatus("none");
      setRemoveStep(0);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "フレンドを削除できませんでした");
    } finally { setSending(false); }
  };

  return (
    <Modal label="プロフィール" onClose={onClose}>
      {profile ? (
        <>
          <ProfileCard profile={profile} hideLoginId nameAction={showRequest && status !== "loading" ? (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {status === "accepted" ? <>
                <span className="text-xs font-bold text-accent">フレンド済み</span>
                <Button size="sm" variant="outline" onClick={() => setRemoveStep(1)} disabled={sending}>
                  <UserMinus />フレンド削除
                </Button>
              </> : <Button size="sm" onClick={handleSend} disabled={status !== "none" || sending} className="h-auto max-w-36 whitespace-normal py-2">
                <UserPlus />{status === "pending" ? "申請済み" : sending ? "送信中…" : "フレンド申請する！"}
              </Button>}
            </div>
          ) : undefined} />
          {sendError && <p role="alert" className="px-6 pb-4 text-sm text-foreground">{sendError}</p>}
          {removeStep > 0 && <Modal label="フレンド削除の確認" onClose={() => { if (!sending) setRemoveStep(0); }}>
            <div className="space-y-4 p-6 pt-12 text-foreground">
              <h2 className="font-bold">{removeStep === 1 ? "フレンドを削除しますか？" : "本当にフレンドを削除しますか？"}</h2>
              <p className="break-words text-sm">{profile.displayName}さんとのフレンド関係を双方から解除します。</p>
              {sendError && <p role="alert">{sendError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={sending} onClick={() => setRemoveStep(0)}>キャンセル</Button>
                <Button disabled={sending} onClick={() => removeStep === 1 ? setRemoveStep(2) : handleRemove()}>{removeStep === 1 ? "次へ" : sending ? "削除中…" : "削除する"}</Button>
              </div>
            </div>
          </Modal>}
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
