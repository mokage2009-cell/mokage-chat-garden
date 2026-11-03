import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { createFriendPost, FRIEND_POST_LIMITS } from "@/app/lib/friends";

type CreatePostModalProps = {
  loginId: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreatePostModal({ loginId, onClose, onCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedTitle = title.trim();
  const titleLength = Array.from(trimmedTitle).length;
  const messageLength = Array.from(message).length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (titleLength < 1 || titleLength > FRIEND_POST_LIMITS.titleMax) {
      setError(`タイトルは1〜${FRIEND_POST_LIMITS.titleMax}文字で入力してください`);
      return;
    }
    if (messageLength > FRIEND_POST_LIMITS.messageMax) {
      setError(`一言は${FRIEND_POST_LIMITS.messageMax}文字以内で入力してください`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createFriendPost(loginId, { title: trimmedTitle, message: message.trim() });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal label="投稿する" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-12">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">投稿する</h2>
          <p className="mt-1 text-sm text-slate-500">
            募集内容を書いて、フレンドを呼びかけましょう
          </p>
        </div>

        <label className="block space-y-2">
          <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
            タイトル
            <span className="text-xs font-normal text-slate-500">
              {titleLength}/{FRIEND_POST_LIMITS.titleMax}
            </span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例：週末に映画を観られる人募集"
            className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
            一言
            <span className="text-xs font-normal text-slate-500">
              任意 ・ {messageLength}/{FRIEND_POST_LIMITS.messageMax}
            </span>
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="書かなくても投稿できます"
            className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
