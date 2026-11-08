export const CHAT_TEXT_MAX = 200000;
export const MEDIA_BATCH_MAX = 50;

export function validateChatText(text: string): string | null {
  return Array.from(text).length > CHAT_TEXT_MAX ? `メッセージは${CHAT_TEXT_MAX.toLocaleString()}文字以内にしてください` : null;
}

export function parseGalleryUrls(text: string): string[] {
  const parts = text.trim() ? text.trim().split(/\s+/) : [];
  if (parts.length > MEDIA_BATCH_MAX) throw new Error(`URLは${MEDIA_BATCH_MAX}件までです`);
  return [...new Set(parts.map((part) => {
    let url: URL;
    try { url = new URL(part); } catch { throw new Error("URL・写真・動画のみ送信できます"); }
    if (!['https:', 'http:'].includes(url.protocol) || part.length > 12000) throw new Error("httpまたはhttpsのURLを入力してください");
    return url.href;
  }))];
}

export async function mapMediaBatch<T, R>(items: T[], action: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = [];
  for (let i = 0; i < items.length; i += 3) result.push(...await Promise.all(items.slice(i, i + 3).map(action)));
  return result;
}