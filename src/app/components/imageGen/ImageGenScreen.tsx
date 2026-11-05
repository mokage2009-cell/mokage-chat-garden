import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import { generateImage } from "@/app/lib/imageGen.functions";

export const DAILY_IMAGE_LIMIT = 3;
const SYSTEM_MONTHLY_REMAINING = 842; // モックアップ用のダミー数値

function todayKey(loginId: string) {
  const d = new Date();
  return `imggen:${loginId}:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** 画像がほぼ真っ黒か（セーフティフィルターの黒塗り判定） */
function isMostlyBlack(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(false);
      ctx.drawImage(img, 0, 0, 32, 32);
      const px = ctx.getImageData(0, 0, 32, 32).data;
      let sum = 0;
      for (let i = 0; i < px.length; i += 4) sum += px[i]! + px[i + 1]! + px[i + 2]!;
      resolve(sum / (32 * 32 * 3) < 8);
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

export default function ImageGenScreen({ loginId, onClose }: { loginId: string; onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setUsed(Number(window.localStorage.getItem(todayKey(loginId)) ?? 0));
  }, [loginId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const remaining = Math.max(0, DAILY_IMAGE_LIMIT - used);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (remaining <= 0) {
      setToast("生成上限です！　明日また生成可能です");
      return;
    }
    if (!prompt.trim()) {
      setError("作りたい画像を入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    setBlocked(false);
    setImage(null);
    try {
      const res = await generateImage({ data: { prompt } });
      if (!res.ok) {
        if (res.reason === "nsfw") setBlocked(true);
        else setError(res.message);
        return;
      }
      const next = used + 1;
      window.localStorage.setItem(todayKey(loginId), String(next));
      setUsed(next);
      if (await isMostlyBlack(res.dataUrl)) setBlocked(true);
      else setImage(res.dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像を生成できませんでした");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-screen-in min-h-screen bg-gradient-to-b from-pink-50 via-violet-50 to-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-4 pt-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm ring-1 ring-violet-100 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-bold text-violet-900">画像生成</h1>
        </header>

        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="例：かわいい猫のイラスト、宇宙を飛ぶペンギン"
            className="w-full resize-none rounded-3xl bg-white/90 px-4 py-3 text-sm text-slate-800 shadow-sm ring-2 ring-pink-100 placeholder:text-slate-400 focus:outline-none focus:ring-violet-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-300 via-violet-300 to-sky-300 py-3.5 text-base font-bold text-violet-950 shadow-md transition hover:shadow-lg active:scale-[0.97] disabled:opacity-60"
          >
            <Sparkles className="h-5 w-5" />
            画像を生み出す！
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-white/70 shadow-inner ring-2 ring-violet-100">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-violet-700">
              <span className="text-5xl animate-bounce">🎨</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink-300"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="text-sm font-bold">AIが一生懸命お絵描き中...🎨</p>
            </div>
          ) : blocked ? (
            <div className="mx-6 rounded-3xl bg-amber-50 p-6 text-center ring-1 ring-amber-200">
              <ShieldAlert className="mx-auto h-8 w-8 text-amber-500" />
              <p className="mt-3 text-sm font-bold text-amber-800">
                不適切な表現が含まれていたため表示できませんでした
              </p>
              <p className="mt-1 text-sm text-amber-700">別の言葉で試してください</p>
            </div>
          ) : image ? (
            <img src={image} alt={prompt} className="h-full w-full object-cover" />
          ) : (
            <p className="text-sm text-violet-300">ここに画像が表示されます</p>
          )}
        </div>

        <div className="mt-4 space-y-0.5 text-center text-[11px] text-slate-400">
          <p>本日残り：{remaining}回</p>
          <p>今月のシステム全体の余力：あと{SYSTEM_MONTHLY_REMAINING}枚</p>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="animate-fade-in fixed inset-x-0 top-6 z-50 mx-auto w-fit rounded-full bg-violet-900/90 px-5 py-3 text-sm font-bold text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
