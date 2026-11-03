import { useState, type FormEvent } from 'react';
import { AtSign, Eye, EyeOff, Lock, MessageCircle, UserCircle, Loader2 } from 'lucide-react';
import { signIn, signUp, type User } from '@/app/lib/auth';

type LoginScreenProps = {
  onLogin: (user: User) => void;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'login') {
      if (!userId.trim() || !password) {
        setError('ユーザーIDとパスワードを入力してください');
        return;
      }
      setError(null);
      setIsSubmitting(true);
      const user = await signIn(userId.trim(), password);
      setIsSubmitting(false);
      if (!user) {
        setError('ユーザーIDまたはパスワードが正しくありません');
        return;
      }
      onLogin(user);
    } else {
      if (!userId.trim() || !password || !displayName.trim()) {
        setError('すべての項目を入力してください');
        return;
      }
      setError(null);
      setIsSubmitting(true);
      const result = await signUp(userId.trim(), password, displayName.trim());
      setIsSubmitting(false);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      onLogin(result.user);
    }
  };

  const accentRing = mode === 'login' ? 'focus-within:ring-cyan-500' : 'focus-within:ring-emerald-500';

  return (
    <div className="animate-screen-in flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-sky-50 to-white px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-600/30">
            <MessageCircle className="h-10 w-10 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">ブラウザチャット</h1>
          <p className="mt-1 text-2xl font-bold tracking-tight text-cyan-700">【Convo】</p>
          <p className="mt-3 text-sm text-slate-600">
            {mode === 'login' ? '登録不要で今すぐ話せる無料ツール' : '新しいアカウントを作成してチャットを始めましょう'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/5 ring-1 ring-slate-200/60"
        >
          <label className={`flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 transition focus-within:bg-white focus-within:ring-2 ${accentRing}`}>
            <AtSign className="h-5 w-5 shrink-0 text-slate-500" />
            <span className="sr-only">ユーザーID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="ユーザーID（半角英数字）"
              maxLength={30}
              autoComplete="username"
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          <label className={`flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 transition focus-within:bg-white focus-within:ring-2 ${accentRing}`}>
            <Lock className="h-5 w-5 shrink-0 text-slate-500" />
            <span className="sr-only">パスワード</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="パスワード"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              className="shrink-0 rounded-full p-1 text-slate-500 transition hover:text-slate-800"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </label>

          {mode === 'signup' && (
            <label className={`flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 transition focus-within:bg-white focus-within:ring-2 ${accentRing}`}>
              <UserCircle className="h-5 w-5 shrink-0 text-slate-500" />
              <span className="sr-only">名前</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="名前（1〜30文字）"
                maxLength={30}
                autoComplete="name"
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 shadow-cyan-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30'
            }`}
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSubmitting
              ? mode === 'login' ? 'ログイン中…' : '作成中…'
              : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
          </button>

          <div className="pt-1 text-center">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                アカウントを作成する
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm font-semibold text-cyan-600 transition hover:text-cyan-700"
              >
                ログイン画面に戻る
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
