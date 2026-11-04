import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import {
  createTimelinePost,
  fetchMyCommunities,
  uploadTimelineMedia,
  TIMELINE_LIMITS,
  type Visibility,
} from "@/app/lib/timeline";

type CreateTimelinePostModalProps = { loginId: string; onClose: () => void; onCreated: () => void };

const VISIBILITY_OPTIONS: { id: Visibility; label: string }[] = [
  { id: "all", label: "全員" },
  { id: "friends", label: "フレンドのみ" },
  { id: "self", label: "自分のみ" },
  { id: "communities", label: "コミュニティメンバーのみ" },
];

export default function CreateTimelinePostModal({
  loginId,
  onClose,
  onCreated,
}: CreateTimelinePostModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [communities, setCommunities] = useState<{ id: string; name: string }[] | null>(null);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleLength = Array.from(title.trim()).length;
  const messageLength = Array.from(message).length;

  const previews = useMemo(
    () => files.map((f) => ({ url: URL.createObjectURL(f), video: f.type.startsWith("video/") })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  useEffect(() => {
    if (visibility === "communities" && !communities) {
      fetchMyCommunities(loginId)
        .then(setCommunities)
        .catch(() => setCommunities([]));
    }
  }, [visibility, communities, loginId]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    const tooBig = picked.find((f) => f.size > TIMELINE_LIMITS.fileMaxMb * 1024 * 1024);
    if (tooBig) {
      setError(`ファイルは${TIMELINE_LIMITS.fileMaxMb}MB以下にしてください`);
      return;
    }
    const next = [...files, ...picked];
    if (next.length > TIMELINE_LIMITS.mediaMax) {
      setError(`画像・動画は${TIMELINE_LIMITS.mediaMax}個までです`);
    } else setError(null);
    setFiles(next.slice(0, TIMELINE_LIMITS.mediaMax));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (titleLength < 1 || titleLength > TIMELINE_LIMITS.titleMax) {
      setError(`タイトルは1〜${TIMELINE_LIMITS.titleMax}文字で入力してください`);
      return;
    }
    if (messageLength > TIMELINE_LIMITS.messageMax) {
      setError(`一言は${TIMELINE_LIMITS.messageMax}文字以内で入力してください`);
      return;
    }
    if (visibility === "communities" && selectedCommunities.length === 0) {
      setError("公開するコミュニティを選んでください");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const media = await Promise.all(files.map((f) => uploadTimelineMedia(loginId, f)));
      await createTimelinePost(loginId, {
        title: title.trim(),
        message: message.trim(),
        visibility,
        communityIds: selectedCommunities,
        media,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿できませんでした");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal label="タイムラインに投稿" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5 p-6 pt-12">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">タイムラインに投稿</h2>
          <p className="mt-1 text-sm text-slate-500">今の気持ちや出来事を共有しましょう</p>
        </div>
        <label className="block space-y-2">
          <span className="flex justify-between text-sm font-semibold text-slate-700">
            タイトル
            <span className="text-xs font-normal text-slate-500">
              {titleLength}/{TIMELINE_LIMITS.titleMax}
            </span>
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例：今日は楽しかった！"
            className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>
        <label className="block space-y-2">
          <span className="flex justify-between text-sm font-semibold text-slate-700">
            一言
            <span className="text-xs font-normal text-slate-500">
              任意 ・ {messageLength}/{TIMELINE_LIMITS.messageMax}
            </span>
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="書かなくても投稿できます"
            className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        <div className="space-y-2">
          <span className="flex justify-between text-sm font-semibold text-slate-700">
            画像・動画
            <span className="text-xs font-normal text-slate-500">
              任意 ・ {files.length}/{TIMELINE_LIMITS.mediaMax}
            </span>
          </span>
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {previews.map((p, i) => (
                <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl bg-slate-200">
                  {p.video ? (
                    <video src={p.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    aria-label="削除"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length < TIMELINE_LIMITS.mediaMax && (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600">
              <ImagePlus className="h-4 w-4" />
              画像・動画を追加
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">公開範囲</span>
          <div className="grid grid-cols-2 gap-2">
            {VISIBILITY_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setVisibility(o.id)}
                className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
                  visibility === o.id ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {visibility === "communities" && (
            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-semibold text-slate-600">公開するコミュニティ（複数可）</p>
              {!communities ? (
                <p className="text-xs text-slate-500">読み込み中…</p>
              ) : communities.length === 0 ? (
                <p className="text-xs text-slate-500">参加しているコミュニティがありません</p>
              ) : (
                <ul className="space-y-1">
                  {communities.map((c) => (
                    <li key={c.id}>
                      <label className="flex items-center gap-2 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedCommunities.includes(c.id)}
                          onChange={(e) =>
                            setSelectedCommunities(
                              e.target.checked
                                ? [...selectedCommunities, c.id]
                                : selectedCommunities.filter((id) => id !== c.id),
                            )
                          }
                        />
                        {c.name}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
            className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-800"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 font-bold text-white shadow-lg shadow-cyan-600/30 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
