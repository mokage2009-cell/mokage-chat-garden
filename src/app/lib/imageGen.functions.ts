import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";

export type ImageGenResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "nsfw" | "no_key" | "busy" | "error"; message: string };

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { prompt: string }) => {
    const prompt = String(input?.prompt ?? "").trim();
    if (prompt.length < 1 || prompt.length > 300) throw new Error("1〜300文字で入力してください");
    return { prompt };
  })
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const token = process.env["HUGGINGFACE_API_KEY"];
    if (!token) {
      return { ok: false, reason: "no_key", message: "画像生成の準備がまだできていません" };
    }
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({ inputs: data.prompt }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("HF error", res.status, text.slice(0, 300));
      if (/nsfw|unsafe|inappropriate/i.test(text)) {
        return { ok: false, reason: "nsfw", message: "nsfw" };
      }
      if (res.status === 503 || res.status === 429) {
        return { ok: false, reason: "busy", message: "AIが混み合っています。少し待ってからもう一度お試しください" };
      }
      return { ok: false, reason: "error", message: "画像を生成できませんでした" };
    }
    const type = res.headers.get("content-type") ?? "image/png";
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return { ok: true, dataUrl: `data:${type};base64,${btoa(bin)}` };
  });
