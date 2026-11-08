import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Images, Link, Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchGallery, sendGallery, GALLERY_PAGE_SIZE, type GalleryFilter, type GalleryItem } from '@/app/lib/gallery';
import { MEDIA_BATCH_MAX } from '@/app/lib/mediaRules';
import { validateMediaFile } from '@/app/lib/chat';
import { supabase } from '@/app/lib/supabase';

export default function GalleryScreen({ loginId, onClose }: { loginId: string; onClose: () => void }) {
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const version = generation.current;
    try {
      const next = await fetchGallery(filter);
      if (version !== generation.current) return;
      setItems(next); setHasOlder(next.length === GALLERY_PAGE_SIZE); setError(null);
    } catch (err) { if (version === generation.current) setError(err instanceof Error ? err.message : '読み込めませんでした'); }
    finally { if (version === generation.current) setLoading(false); }
  }, [filter]);

  useEffect(() => {
    generation.current += 1;
    setLoading(true); setItems([]); void refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`gallery-${crypto.randomUUID()}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gallery_items' }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!document.hidden) void refresh(); }, 500);
    }).subscribe();
    const poll = setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    const onFocus = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => { generation.current += 1; if (timer) clearTimeout(timer); clearInterval(poll); document.removeEventListener('visibilitychange', onFocus); void supabase.removeChannel(channel); };
  }, [refresh]);

  const older = async () => {
    const last = items.at(-1); if (!last || olderLoading) return;
    const version = generation.current;
    setOlderLoading(true);
    try { const next = await fetchGallery(filter, last); if (version === generation.current) { setItems(prev => [...prev, ...next.filter(item => !prev.some(existing => existing.id === item.id))]); setHasOlder(next.length === GALLERY_PAGE_SIZE); } }
    catch { setError('以前の投稿を読み込めませんでした'); }
    finally { setOlderLoading(false); }
  };

  return <div className="min-h-dvh bg-gallery text-foreground">
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <Button variant="ghost" size="icon" aria-label="戻る" onClick={onClose}><ArrowLeft /></Button>
      <h1 className="font-bold">ギャラリー</h1><Images className="ml-auto text-gallery-accent" />
    </header>
    <div className="mx-auto max-w-xl px-4 py-4">
      <div className="mb-4 flex flex-wrap gap-2" aria-label="表示を絞る">
        {([['all', 'すべて'], ['media', '写真・動画のみ'], ['url', 'URLのみ']] as const).map(([id, label]) => <Button key={id} variant={filter === id ? 'default' : 'outline'} aria-pressed={filter === id} onClick={() => setFilter(id)}>{id === 'media' ? <Images /> : id === 'url' ? <Link /> : null}{label}</Button>)}
      </div>
      <form className="mb-6 space-y-3 border-b border-border pb-5" onSubmit={async event => {
        event.preventDefault(); if (sending) return; setSending(true); setError(null);
        try { await sendGallery(loginId, text, files); setText(''); setFiles([]); await refresh(); }
        catch (err) { setError(err instanceof Error ? err.message : '送信できませんでした'); }
        finally { setSending(false); }
      }}>
        <textarea aria-label="URL" placeholder="https://…" value={text} disabled={sending} onChange={event => setText(event.target.value)} rows={2} className="w-full resize-y rounded-lg border border-input bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        {files.length > 0 && <ul className="max-h-36 overflow-y-auto text-xs">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{file.name}</span><Button disabled={sending} variant="ghost" size="icon" aria-label={`${file.name}を取り消す`} onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}><X /></Button></li>)}</ul>}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={sending}><Images />写真・動画</Button>
          <span className="text-xs text-sub">{files.length}/{MEDIA_BATCH_MAX}</span>
          <Button type="submit" className="ml-auto" disabled={sending || (!text.trim() && !files.length)}>{sending ? <Loader2 className="animate-spin" /> : <Send />}{sending ? '送信中…' : '送信'}</Button>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={event => {
          const picked = Array.from(event.target.files ?? []); event.target.value = '';
          if (files.length + picked.length > MEDIA_BATCH_MAX) { setError(`写真・動画は${MEDIA_BATCH_MAX}個までです`); return; }
          for (const file of picked) { const invalid = validateMediaFile(file); if (invalid) { setError(invalid); return; } }
          setFiles(prev => [...prev, ...picked]); setError(null);
        }} />
        {error && <p role="alert" className="rounded-lg border border-border bg-surface p-3 text-sm">{error}</p>}
      </form>
      {loading ? <Loader2 aria-label="読み込み中" className="mx-auto animate-spin text-primary" /> : !items.length ? <p className="py-10 text-center text-sm text-sub">まだ投稿がありません</p> : <ul className="space-y-4">
        {items.map(item => <li key={item.id} className="overflow-hidden rounded-lg border border-border bg-surface p-3">
          <div className="mb-2 flex min-w-0 items-center gap-2 text-xs text-sub">{item.sender?.avatar_image_url && <img src={item.sender.avatar_image_url} alt="" loading="lazy" className="h-7 w-7 rounded-full object-cover" />}<span className="min-w-0 flex-1 truncate font-semibold text-foreground">{item.sender?.display_name ?? 'ユーザー'}</span><time>{new Date(item.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div>
          {item.kind === 'url' ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-primary underline">{item.url}</a> : item.kind === 'image' ? <a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt="ギャラリー画像" loading="lazy" decoding="async" className="max-h-96 w-full rounded-lg object-contain" /></a> : <video src={item.url} controls playsInline preload="none" className="max-h-96 w-full rounded-lg" />}
        </li>)}
      </ul>}
      {hasOlder && <Button className="mt-4 w-full" variant="outline" disabled={olderLoading} onClick={() => void older()}>{olderLoading && <Loader2 className="animate-spin" />}以前の投稿</Button>}
    </div>
  </div>;
}