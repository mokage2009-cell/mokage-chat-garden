import { Camera } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES } from '@/app/lib/profile';

type ProfileImageFieldProps = {
  label: string;
  shape: 'wide' | 'round';
  previewUrl: string | null;
  onSelect: (file: File) => void;
};

export default function ProfileImageField({ label, shape, previewUrl, onSelect }: ProfileImageFieldProps) {
  const isRound = shape === 'round';

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <label
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-sky-200 to-cyan-300 transition hover:brightness-95 focus-within:ring-2 focus-within:ring-cyan-500 ${
          isRound ? 'mx-auto h-24 w-24 rounded-full' : 'h-36 w-full rounded-2xl'
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span
          className={`absolute inset-0 flex items-center justify-center transition ${
            previewUrl ? 'bg-slate-900/0 group-hover:bg-slate-900/40' : ''
          }`}
        >
          <span
            className={`flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition ${
              previewUrl ? 'opacity-0 group-hover:opacity-100' : ''
            }`}
          >
            <Camera className="h-4 w-4" />
            {previewUrl ? '変更する' : '画像を選ぶ'}
          </span>
        </span>
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onSelect(file);
          }}
        />
      </label>
    </div>
  );
}
