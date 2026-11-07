import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
  MessageSquare,
  Search,
  Send,
  UserRound,
  Users,
  Loader2,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@/app/lib/auth";
import {
  fetchAllAccounts,
  fetchChatPartners,
  fetchChatMessagesByScope,
  fetchAllPhotos,
  fetchAllFeedback,
  sendBroadcastNotification,
  type AdminAccount,
  type ChatPartner,
  type AdminChatMessage,
  type AdminPhoto,
  type AdminFeedback,
} from "@/app/lib/admin";

type AdminScreenProps = {
  user: User;
  onLogout: () => void;
  onSwitchToChat: () => void;
};

type Section = "home" | "accounts" | "photos" | "notify" | "feedback";

export default function AdminScreen({ user, onLogout, onSwitchToChat }: AdminScreenProps) {
  const [section, setSection] = useState<Section>("home");

  return (
    <div className="animate-screen-in min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto max-w-md">
        {section === "home" && (
          <AdminHome
            user={user}
            onLogout={onLogout}
            onNavigate={setSection}
            onSwitchToChat={onSwitchToChat}
          />
        )}
        {section === "accounts" && <AccountsView onBack={() => setSection("home")} />}
        {section === "photos" && <PhotosView onBack={() => setSection("home")} />}
        {section === "notify" && <NotifyView onBack={() => setSection("home")} />}
        {section === "feedback" && <FeedbackView onBack={() => setSection("home")} />}
      </div>
    </div>
  );
}

function AdminHome({
  user,
  onLogout,
  onNavigate,
  onSwitchToChat,
}: {
  user: User;
  onLogout: () => void;
  onNavigate: (s: Section) => void;
  onSwitchToChat: () => void;
}) {
  const items: { id: Section; label: string; desc: string; icon: LucideIcon; gradient: string }[] =
    [
      {
        id: "accounts",
        label: "アカウント管理",
        desc: "登録アカウント・チャット閲覧",
        icon: Users,
        gradient: "from-cyan-400 to-cyan-600",
      },
      {
        id: "photos",
        label: "写真ギャラリー",
        desc: "送信された全写真",
        icon: ImageIcon,
        gradient: "from-emerald-400 to-emerald-600",
      },
      {
        id: "notify",
        label: "通知送信",
        desc: "全ユーザーへ通知を送る",
        icon: Megaphone,
        gradient: "from-amber-400 to-amber-600",
      },
      {
        id: "feedback",
        label: "意見確認",
        desc: "送られた意見を見る",
        icon: MessageSquare,
        gradient: "from-rose-400 to-rose-600",
      },
    ];

  return (
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">管理者サイト</h1>
          <p className="mt-0.5 text-sm text-slate-500">{user.name}（オーナー）</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSwitchToChat}
            aria-label="チャットサイトへ"
            className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-cyan-700 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
            チャット
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="ログアウト"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md active:scale-95"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="group relative flex min-h-36 flex-col items-start overflow-hidden rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ${item.gradient}`}
              >
                <Icon className="h-6 w-6 text-white" strokeWidth={2.2} />
              </span>
              <span className="relative mt-auto pt-4 text-[15px] font-bold leading-snug text-slate-900">
                {item.label}
              </span>
              <span className="relative pt-1 text-xs text-slate-500">{item.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-3 px-5 pb-4 pt-8">
      <button
        type="button"
        onClick={onBack}
        aria-label="戻る"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">{title}</h1>
    </header>
  );
}

function formatAccountNumber(n: number): string {
  return String(n).padStart(4, "0");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return (
    <span
      className={`flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : name ? (
        <span className="text-base font-bold">{Array.from(name)[0]}</span>
      ) : (
        <UserRound className="h-5 w-5" />
      )}
    </span>
  );
}

type AccountsViewStage = "list" | "partners" | "chat";

function AccountsView({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<AccountsViewStage>("list");
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null);

  const reload = useCallback(() => {
    fetchAllAccounts()
      .then(setAccounts)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = (accounts ?? []).filter(
    (a) =>
      a.displayName.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      a.loginId.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  if (stage === "partners" && selectedAccount) {
    return (
      <PartnersView
        account={selectedAccount}
        onBack={() => {
          setStage("list");
          setSelectedAccount(null);
        }}
      />
    );
  }

  return (
    <div className="animate-screen-in">
      <ScreenHeader title="アカウント管理" onBack={onBack} />
      <div className="px-5">
        <div className="flex gap-2 pb-4">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="名前・IDで検索"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {!accounts ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">該当するアカウントがありません</p>
        ) : (
          <ul className="space-y-3 pb-8">
            {filtered.map((account) => (
              <li key={account.loginId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccount(account);
                    setStage("partners");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md active:scale-[0.99]"
                >
                  <Avatar name={account.displayName} imageUrl={account.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-slate-900">{account.displayName}</p>
                      {account.accountNumber === 1 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          オーナー
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      No.{formatAccountNumber(account.accountNumber)} ・ ID: {account.loginId}
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 shrink-0 text-cyan-600" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PartnersView({ account, onBack }: { account: AdminAccount; onBack: () => void }) {
  const [partners, setPartners] = useState<ChatPartner[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatPartners(account.loginId)
      .then(setPartners)
      .catch((err: Error) => setError(err.message));
  }, [account.loginId]);

  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);

  if (selectedPartner) {
    return (
      <ChatViewer
        account={account}
        partner={selectedPartner}
        onBack={() => setSelectedPartner(null)}
        onBackToPartners={onBack}
      />
    );
  }

  return (
    <div className="animate-screen-in">
      <ScreenHeader title={`${account.displayName}のチャット相手`} onBack={onBack} />
      <div className="px-5">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {!partners ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : partners.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">まだチャット相手がいません</p>
        ) : (
          <ul className="space-y-3 pb-8">
            {partners.map((partner) => (
              <li key={`${partner.context}-${partner.scopeId}-${partner.loginId}`}>
                <button
                  type="button"
                  onClick={() => setSelectedPartner(partner)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md active:scale-[0.99]"
                >
                  <Avatar name={partner.displayName} imageUrl={partner.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{partner.displayName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {partner.context === "dm"
                        ? "ダイレクト"
                        : partner.context === "community"
                          ? "コミュニティ"
                          : "タイムライン"}{" "}
                      ・ {formatTime(partner.lastMessageAt)}
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 shrink-0 text-cyan-600" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChatViewer({
  account,
  partner,
  onBack,
  onBackToPartners,
}: {
  account: AdminAccount;
  partner: ChatPartner;
  onBack: () => void;
  onBackToPartners: () => void;
}) {
  const [messages, setMessages] = useState<AdminChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatMessagesByScope(partner, account.loginId)
      .then(setMessages)
      .catch((err: Error) => setError(err.message));
  }, [partner, account.loginId]);

  return (
    <div className="animate-screen-in flex min-h-screen flex-col bg-sky-50">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">
            {account.displayName} ↔ {partner.displayName}
          </p>
          <p className="truncate text-xs text-slate-500">閲覧モード（送信不可）</p>
        </div>
        <button
          type="button"
          onClick={onBackToPartners}
          className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 active:scale-95"
        >
          一覧へ
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {!messages ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">メッセージがありません</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderLoginId === account.loginId;
              return (
                <li
                  key={msg.id}
                  className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
                >
                  <span className="text-xs font-semibold text-slate-600">{msg.senderName}</span>
                  <div
                    className={`max-w-[80%] overflow-hidden rounded-2xl ${
                      isOwn
                        ? "bg-cyan-500 text-white"
                        : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
                    }`}
                  >
                    {msg.mediaUrl && msg.mediaType?.startsWith("image/") && (
                      <img src={msg.mediaUrl} alt="" className="max-h-60 w-full object-cover" />
                    )}
                    {msg.mediaUrl && msg.mediaType?.startsWith("video/") && (
                      <video src={msg.mediaUrl} controls className="max-h-60 w-full object-cover" />
                    )}
                    {msg.body && (
                      <p className="whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed">
                        {msg.body}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function PhotosView({ onBack }: { onBack: () => void }) {
  const [photos, setPhotos] = useState<AdminPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPhotos()
      .then(setPhotos)
      .catch((err: Error) => setError(err.message));
  }, []);

  const [lightbox, setLightbox] = useState<AdminPhoto | null>(null);

  return (
    <div className="animate-screen-in">
      <ScreenHeader title="写真ギャラリー" onBack={onBack} />
      <div className="px-5">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {!photos ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : photos.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">写真がありません</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">{photos.length}枚の写真</p>
            <div className="grid grid-cols-3 gap-2 pb-8">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightbox(photo)}
                  className="aspect-square overflow-hidden rounded-xl ring-1 ring-slate-200 transition hover:opacity-80 active:scale-95"
                >
                  <img
                    src={photo.mediaUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[90vh] max-w-md" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.mediaUrl}
              alt=""
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-white">{lightbox.senderName}</p>
              <p className="text-xs text-slate-400">{formatTime(lightbox.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 rotate-45" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifyView({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSending(true);
    setError(null);
    setSent(false);
    try {
      await sendBroadcastNotification(title.trim(), body.trim());
      setSent(true);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-screen-in">
      <ScreenHeader title="通知送信" onBack={onBack} />
      <div className="px-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <p className="mb-4 text-sm text-slate-600">全ユーザーへ通知を一斉送信します</p>
          {sent && (
            <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              通知を送信しました
            </div>
          )}
          {error && (
            <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">タイトル</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="通知のタイトル"
                className="mt-2 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">本文</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="通知の内容"
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <button
              type="submit"
              disabled={sending || !title.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-bold text-white shadow-md transition hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              全員に送信
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FeedbackView({ onBack }: { onBack: () => void }) {
  const [feedback, setFeedback] = useState<AdminFeedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchAllFeedback()
      .then(setFeedback)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="animate-screen-in">
      <ScreenHeader title="意見確認" onBack={onBack} />
      <div className="px-5">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {!feedback ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : feedback.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">意見がありません</p>
        ) : (
          <ul className="space-y-3 pb-8">
            {feedback.map((fb) => (
              <li
                key={fb.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={fb.senderName} imageUrl={null} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{fb.senderName}</p>
                    <p className="truncate text-xs text-slate-500">{formatTime(fb.createdAt)}</p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {fb.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
