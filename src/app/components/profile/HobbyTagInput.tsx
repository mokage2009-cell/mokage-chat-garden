import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { PROFILE_LIMITS } from '@/app/lib/profile';

type HobbyTagInputProps = {
  hobbies: string[];
  onChange: (hobbies: string[]) => void;
};

export default function HobbyTagInput({ hobbies, onChange }: HobbyTagInputProps) {
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const isFull = hobbies.length >= PROFILE_LIMITS.hobbyMax;

  const addHobby = () => {
    const value = draft.trim();
    if (!value) return;

    if (hobbies.includes(value)) {
      setHint('同じ趣味が既に追加されています');
      return;
    }
    if (Array.from(value).length > PROFILE_LIMITS.hobbyLengthMax) {
      setHint(`趣味は${PROFILE_LIMITS.hobbyLengthMax}文字以内で入力してください`);
      return;
    }

    onChange([...hobbies, value]);
    setDraft('');
    setHint(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addHobby();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setHint(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isFull}
          placeholder={isFull ? '追加できるのは10個までです' : '例：読書'}
          className="min-w-0 flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={addHobby}
          disabled={isFull || !draft.trim()}
          className="shrink-0 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          追加
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span role="status" className="text-rose-700">
          {hint}
        </span>
        <span className="text-slate-500">
          {hobbies.length}/{PROFILE_LIMITS.hobbyMax}
        </span>
      </div>

      {hobbies.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {hobbies.map((hobby) => (
            <li
              key={hobby}
              className="flex items-center gap-1 rounded-full bg-sky-100 py-1 pl-3 pr-1 text-sm font-medium text-sky-900"
            >
              {hobby}
              <button
                type="button"
                onClick={() => onChange(hobbies.filter((item) => item !== hobby))}
                aria-label={`${hobby}を削除`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-sky-800 transition hover:bg-sky-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
