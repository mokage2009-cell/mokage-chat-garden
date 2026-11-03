import { useState, type FormEvent } from 'react';
import { AlertTriangle, Check, LogOut, MessageSquare, Send, Trash2, X, Loader2, type LucideIcon } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { FEEDBACK_LIMITS, deleteOwnAccount, sendFeedback } from '@/app/lib/feedback';

type SettingsModalProps = {
  loginId: string;
  onLogout: () => void;
  onAccountDeleted: () => void;
  onClose: () => void;
};

type Phase = 'menu' | 'feedback' | 'delete';

export default function SettingsModal({ loginId, onLogout, onAccountDeleted, onClose }: SettingsModalProps) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = feedbackMessage.trim();
    if (!trimmed || Array.from(trimmed).length > FEEDBACK_LIMITS.messageMax) return;
    setFeedbackSending(true);
    setError(null);
    try {
      await sendFeedback(loginId, trimmed);
      setFeedbackSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteOwnAccount(loginId);
      onAccountDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <Modal label="設定" onClose={onClose}>
      <div className="p-6 pt-12">
        <h2 className="text-xl font-bold text-app">設定</h2>

        {phase === 'menu' && (
          <div className="mt-5 space-y-3">
            <SettingsRow icon={MessageSquare} label="管理者に意見を送る" onClick={() => setPhase('feedback')} />
            <SettingsRow icon={LogOut} label="ログアウト" onClick={onLogout} />
            <button
              type="button"
              onClick={() => setPhase('delete')}
              className="flex w-full items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-rose-50 active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-rose-700">アカウントを削除</span>
            </button>
          </div>
        )}

        {phase === 'feedback' && (
          <div className="mt-5">
            <BackHeader onBack={() => { setPhase('menu'); setFeedbackSent(false); setFeedbackMessage(''); }} title="意見を送る" />
            {feedbackSent ? (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center">
                <Check className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-3 text-sm font-bold text-emerald-800">意見を送信しました</p>
                <p className="mt-1 text-xs text-emerald-600">ご協力ありがとうございます</p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="意見・要望・不具合報告などをお書きください"
                  rows={5}
                  className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                <button
                  type="submit"
                  disabled={feedbackSending || !feedbackMessage.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  {feedbackSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  送信する
                </button>
              </form>
            )}
          </div>
        )}

        {phase === 'delete' && (
          <div className="mt-5">
            <BackHeader onBack={() => { setPhase('menu'); setConfirmDelete(false); setError(null); }} title="アカウント削除" />
            <div className="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200">
              <AlertTriangle className="h-8 w-8 text-rose-600" />
              <p className="mt-3 text-sm font-bold text-rose-800">アカウントを削除すると元に戻せません</p>
              <p className="mt-2 text-xs text-rose-600">プロフィール、投稿、チャットなどすべてのデータが完全に削除されます。</p>
            </div>
            {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-5 w-full rounded-2xl bg-rose-600 py-3 font-bold text-white active:scale-[0.98]"
              >
                アカウントを削除する
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-center text-sm font-bold text-rose-700">本当に削除しますか？</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-700 py-3 font-bold text-white disabled:opacity-60"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    削除を実行する
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function SettingsRow({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-slate-100 active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-bold text-app">{label}</span>
    </button>
  );
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-95">
        <X className="h-4 w-4" />
      </button>
      <h3 className="text-base font-bold text-app">{title}</h3>
    </div>
  );
}


