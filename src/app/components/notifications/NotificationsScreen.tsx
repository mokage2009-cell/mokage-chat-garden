import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCheck, Heart, Megaphone, MessageSquare, Users } from "lucide-react";
import ProfileModal from "@/app/components/profile/ProfileModal";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
} from "@/app/lib/notifications";

type NotificationsScreenProps = { loginId: string; onClose: () => void };

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; bg: string; fg: string; label: string }
> = {
  friend_accepted: { icon: Heart, bg: "bg-emerald-100", fg: "text-emerald-600", label: "フレンド" },
  admin: { icon: Megaphone, bg: "bg-amber-100", fg: "text-amber-600", label: "お知らせ" },
  community: { icon: Users, bg: "bg-blue-100", fg: "text-blue-600", label: "コミュニティ" },
  system: { icon: MessageSquare, bg: "bg-slate-100", fg: "text-slate-600", label: "システム" },
};

export default function NotificationsScreen({ loginId, onClose }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchNotifications(loginId)
      .then((loaded) => {
        setNotifications(loaded);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [loginId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead(loginId);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "一括既読に失敗しました");
    }
  };

  const handleTap = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.id);
        setNotifications(
          (prev) => prev?.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)) ?? null,
        );
      } catch {
        /* ignore */
      }
    }
    if (notif.actorLoginId) {
      setSelectedLoginId(notif.actorLoginId);
    }
  };

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-2 pt-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">通知</h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-cyan-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
            >
              <CheckCheck className="h-4 w-4" />
              すべて既読
            </button>
          )}
        </header>
        <p className="pb-5 text-sm text-slate-600">
          {unreadCount > 0
            ? `未読${unreadCount}件の通知があります`
            : "フレンド成立やお知らせがここに届きます"}
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {!notifications ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            読み込み中…
          </p>
        ) : notifications.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <Bell className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 font-bold text-slate-900">通知はありません</p>
            <p className="mt-1 text-sm text-slate-500">新しい通知が届くとここに表示されます</p>
          </section>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type];
              const Icon = config.icon;
              return (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() => handleTap(notif)}
                    className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-sm ring-1 transition active:scale-[0.99] ${
                      notif.isRead
                        ? "bg-white ring-slate-200/70"
                        : "bg-cyan-50/80 ring-cyan-200/60 hover:bg-cyan-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.fg}`}
                    >
                      {notif.actorAvatarUrl ? (
                        <img
                          src={notif.actorAvatarUrl}
                          alt=""
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.fg}`}
                        >
                          {config.label}
                        </span>
                        {!notif.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                        )}
                        <span className="ml-auto shrink-0 text-[10px] text-slate-500">
                          {formatRelative(notif.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 break-words text-sm font-bold leading-snug text-slate-900">
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">
                          {notif.body}
                        </p>
                      )}
                      {notif.actorLoginId && (
                        <span className="mt-1.5 inline-block text-xs font-semibold text-cyan-700">
                          プロフィールを見る
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedLoginId && (
        <ProfileModal loginId={selectedLoginId} viewerLoginId={loginId} onClose={() => setSelectedLoginId(null)} />
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "たった今";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}
