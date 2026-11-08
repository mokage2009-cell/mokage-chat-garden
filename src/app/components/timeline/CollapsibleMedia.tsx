import { useState } from 'react';
import { Image, ChevronUp, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CollapsibleMedia({ url, video = false }: { url: string; video?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="min-w-0 rounded-lg border border-border bg-muted p-2">
    <Button variant="outline" size="sm" onClick={() => setOpen(value => !value)} aria-expanded={open}>
      {open ? <ChevronUp /> : video ? <Video /> : <Image />}{open ? '閉じる' : '表示'}
    </Button>
    {open && (video ? <video src={url} controls playsInline preload="none" className="mt-2 max-h-[70dvh] w-full rounded-lg object-contain" /> : <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="投稿画像" loading="lazy" decoding="async" className="mt-2 max-h-[70dvh] w-full rounded-lg object-contain" /></a>)}
  </div>;
}