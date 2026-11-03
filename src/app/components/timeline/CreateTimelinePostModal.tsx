import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { createTimelinePost, TIMELINE_LIMITS } from '@/app/lib/timeline';

type CreateTimelinePostModalProps = { loginId: string; onClose: () => void; onCreated: () => void };

export default function CreateTimelinePostModal({ loginId, onClose, onCreated }: CreateTimelinePostModalProps) {
  const [title, setTitle] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
  const titleLength = Array.from(title.trim()).length; const messageLength = Array.from(message).length;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (titleLength < 1 || titleLength > TIMELINE_LIMITS.titleMax) { setError(`タイトルは1〜${TIMELINE_LIMITS.titleMax}文字で入力してください`); return; }
    if (messageLength > TIMELINE_LIMITS.messageMax) { setError(`一言は${TIMELINE_LIMITS.messageMax}文字以内で入力してください`); return; }
    setError(null); setIsSubmitting(true);
    try { await createTimelinePost(loginId, { title: title.trim(), message: message.trim() }); onCreated(); } catch (err) { setError(err instanceof Error ? err.message : '投稿できませんでした'); setIsSubmitting(false); }
  };
  return <Modal label="タイムラインに投稿" onClose={onClose}><form onSubmit={submit} className="space-y-5 p-6 pt-12"><div><h2 className="text-xl font-bold tracking-tight text-slate-900">タイムラインに投稿</h2><p className="mt-1 text-sm text-slate-500">今の気持ちや出来事を共有しましょう</p></div><label className="block space-y-2"><span className="flex justify-between text-sm font-semibold text-slate-700">タイトル<span className="text-xs font-normal text-slate-500">{titleLength}/{TIMELINE_LIMITS.titleMax}</span></span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：今日は楽しかった！" className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" /></label><label className="block space-y-2"><span className="flex justify-between text-sm font-semibold text-slate-700">一言<span className="text-xs font-normal text-slate-500">任意 ・ {messageLength}/{TIMELINE_LIMITS.messageMax}</span></span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="書かなくても投稿できます" className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" /></label>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="flex gap-3"><button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-800">キャンセル</button><button type="submit" disabled={isSubmitting} className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 font-bold text-white shadow-lg shadow-cyan-600/30 disabled:opacity-70">{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{isSubmitting ? '投稿中…' : '投稿する'}</button></div></form></Modal>;
}
