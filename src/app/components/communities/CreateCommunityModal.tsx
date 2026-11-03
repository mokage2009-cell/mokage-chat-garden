import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { COMMUNITY_LIMITS, createCommunity } from '@/app/lib/communities';

type CreateCommunityModalProps = {
  loginId: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateCommunityModal({ loginId, onClose, onCreated }: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameLength = Array.from(name.trim()).length;
  const descriptionLength = Array.from(description).length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nameLength < 1 || nameLength > COMMUNITY_LIMITS.nameMax) {
      setError(`コミュニティ名は1〜${COMMUNITY_LIMITS.nameMax}文字で入力してください`);
      return;
    }
    if (descriptionLength > COMMUNITY_LIMITS.descriptionMax) {
      setError(`説明は${COMMUNITY_LIMITS.descriptionMax}文字以内で入力してください`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createCommunity(loginId, { name: name.trim(), description: description.trim() });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コミュニティを作成できませんでした');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal label="コミュニティを作成" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-12">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">コミュニティを作成</h2>
          <p className="mt-1 text-sm text-slate-500">作成者にはコミュニティオーナー権限が付与されます</p>
        </div>

        <label className="block space-y-2">
          <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
            コミュニティ名
            <span className="text-xs font-normal text-slate-500">{nameLength}/{COMMUNITY_LIMITS.nameMax}</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例：読書好きの集い"
            className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
            説明
            <span className="text-xs font-normal text-slate-500">任意 ・ {descriptionLength}/{COMMUNITY_LIMITS.descriptionMax}</span>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="どんなコミュニティか紹介してください"
            className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </label>

        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60">
            キャンセル
          </button>
          <button type="submit" disabled={isSubmitting} className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 font-bold text-white shadow-lg shadow-cyan-600/30 transition hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? '作成中…' : '作成する'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
