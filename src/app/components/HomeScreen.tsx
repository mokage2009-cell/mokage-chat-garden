import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Globe,
  Images,
  Loader2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Palette,
  Search,
  Settings,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
const ProfilePanel = lazy(() => import("@/app/components/profile/ProfilePanel"));
const FriendRecruitScreen = lazy(() => import("@/app/components/friends/FriendRecruitScreen"));
const CommunityScreen = lazy(() => import("@/app/components/communities/CommunityScreen"));
const CommunityChatScreen = lazy(() => import("@/app/components/communities/CommunityChatScreen"));
const TimelineScreen = lazy(() => import("@/app/components/timeline/TimelineScreen"));
const ChatScreen = lazy(() => import("@/app/components/chat/ChatScreen"));
const NotificationsScreen = lazy(() => import("@/app/components/notifications/NotificationsScreen"));
const SearchScreen = lazy(() => import("@/app/components/search/SearchScreen"));
const ImageGenScreen = lazy(() => import("@/app/components/imageGen/ImageGenScreen"));
const GalleryScreen = lazy(() => import("@/app/components/gallery/GalleryScreen"));
import { Button } from '@/components/ui/button';
import SettingsModal from "@/app/components/SettingsModal";
import Modal from "@/app/components/ui/Modal";
import { useTheme, applyTheme, getStoredThemeId, THEMES, type Theme } from "@/app/lib/theme";
import type { User } from "@/app/lib/auth";

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
  blob: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: "profile",
    label: "プロフィール",
    icon: UserIcon,
    gradient: "from-cyan-400 to-cyan-600",
    blob: "bg-cyan-100",
  },
  {
    id: "friends",
    label: "フレンド募集",
    icon: Megaphone,
    gradient: "from-emerald-400 to-emerald-600",
    blob: "bg-emerald-100",
  },
  {
    id: "community",
    label: "コミュニティ",
    icon: Users,
    gradient: "from-slate-500 to-slate-700",
    blob: "bg-slate-200",
  },
  {
    id: "search",
    label: "探す",
    icon: Search,
    gradient: "from-rose-400 to-rose-600",
    blob: "bg-rose-100",
  },
  {
    id: "chat",
    label: "チャット",
    icon: MessageCircle,
    gradient: "from-orange-400 to-orange-600",
    blob: "bg-orange-100",
  },
  {
    id: "community-chat",
    label: "コミュニティチャット",
    icon: MessageSquare,
    gradient: "from-blue-400 to-blue-600",
    blob: "bg-blue-100",
  },
  {
    id: "timeline",
    label: "タイムライン",
    icon: Globe,
    gradient: "from-teal-400 to-teal-600",
    blob: "bg-teal-100",
  },
  {
    id: "notifications",
    label: "通知",
    icon: Bell,
    gradient: "from-amber-400 to-amber-600",
    blob: "bg-amber-100",
  },
];

type HomeScreenProps = {
  user: User;
  onLogout: () => void;
  isOwner?: boolean;
  onSwitchToAdmin?: () => void;
};

export default function HomeScreen({
  ...props
}: HomeScreenProps) {
  return <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-app"><Loader2 aria-label="読み込み中" className="animate-spin text-primary" /></div>}><HomeContent {...props} /></Suspense>;
}

function HomeContent({
  user,
  onLogout,
  isOwner = false,
  onSwitchToAdmin,
}: HomeScreenProps) {
  const [page, setPage] = useState(0);
  const pagerRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState(user.name);
  const [overlay, setOverlay] = useState<
    | "profile"
    | "friends"
    | "community"
    | "community-chat"
    | "timeline"
    | "chat"
    | "notifications"
    | "search"
    | "imagegen"
    | "gallery"
    | null
  >(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const { currentTheme, themeId, changeTheme } = useTheme();

  useEffect(() => {
    const stored = getStoredThemeId();
    const theme = THEMES.find((t) => t.id === stored) ?? THEMES[0];
    if (theme) applyTheme(theme);
  }, []);

  if (overlay === "profile") {
    return (
      <ProfilePanel
        loginId={user.id}
        onClose={() => setOverlay(null)}
        onSaved={(saved) => setDisplayName(saved.displayName)}
      />
    );
  }

  if (overlay === "friends") {
    return <FriendRecruitScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === "community") {
    return <CommunityScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === "community-chat") {
    return <CommunityChatScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === "timeline") {
    return <TimelineScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === "chat") {
    return <ChatScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === "notifications") {
    return <NotificationsScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === "imagegen") {
    return <ImageGenScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  if (overlay === 'gallery') return <GalleryScreen loginId={user.id} onClose={() => setOverlay(null)} />;

  if (overlay === "search") {
    return <SearchScreen loginId={user.id} onClose={() => setOverlay(null)} />;
  }

  return (
    <div
      className="animate-screen-in min-h-screen pb-24"
      style={{ backgroundColor: "var(--app-bg)" }}
    >
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between px-5 pb-4 pt-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--app-text)" }}>
            {displayName}
          </h1>
          <div className="flex gap-2">
            {isOwner && onSwitchToAdmin && (
              <button
                type="button"
                aria-label="管理者サイトへ"
                onClick={onSwitchToAdmin}
                className="flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-amber-700 shadow-sm transition hover:shadow-md active:scale-95"
                style={{
                  backgroundColor: "var(--app-surface)",
                  color: "var(--app-text)",
                  boxShadow: `0 1px 2px rgba(0,0,0,0.05)`,
                }}
              >
                <ShieldCheck className="h-5 w-5" />
                管理者
              </button>
            )}
            <button
              type="button"
              aria-label="テーマ"
              onClick={() => setThemeOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition hover:shadow-md active:scale-95"
              style={{
                backgroundColor: "var(--app-surface)",
                color: "var(--app-text)",
                boxShadow: `0 1px 2px rgba(0,0,0,0.05)`,
              }}
            >
              <Palette className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="設定"
              onClick={() => setSettingsOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition hover:shadow-md active:scale-95"
              style={{
                backgroundColor: "var(--app-surface)",
                color: "var(--app-text)",
                boxShadow: `0 1px 2px rgba(0,0,0,0.05)`,
              }}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div
          ref={pagerRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setPage(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <section className="w-full shrink-0 snap-center px-5" aria-label="ページ1">
            <MenuGrid
              onSelect={(id) => {
                if (id === "profile") setOverlay("profile");
                if (id === "friends") setOverlay("friends");
                if (id === "community") setOverlay("community");
                if (id === "community-chat") setOverlay("community-chat");
                if (id === "timeline") setOverlay("timeline");
                if (id === "chat") setOverlay("chat");
                if (id === "notifications") setOverlay("notifications");
                if (id === "search") setOverlay("search");
              }}
            />
          </section>
          <section className="w-full shrink-0 snap-center px-5" aria-label="ページ2">
            <div className="grid grid-cols-2 gap-4">
              <MenuCard
                item={{
                  id: "imagegen",
                  label: "画像生成",
                  icon: Sparkles,
                  gradient: "from-pink-300 via-violet-300 to-sky-300",
                  blob: "bg-pink-100",
                }}
                onClick={() => setOverlay("imagegen")}
              />
              <Button variant="ghost" onClick={() => setOverlay('gallery')} className="flex h-auto min-h-36 flex-col items-start justify-between rounded-3xl bg-surface p-5 text-left text-foreground shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gallery text-gallery-accent"><Images className="size-6" /></span>
                <span className="pt-4 text-[15px] font-bold">ギャラリー</span>
              </Button>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center gap-2">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`ページ${i + 1}`}
            onClick={() => {
              const el = pagerRef.current;
              if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
            }}
            className="h-2.5 w-2.5 rounded-full border-2 transition"
            style={{
              borderColor: "var(--app-text)",
              backgroundColor: page === i ? "var(--app-text)" : "transparent",
            }}
          />
        ))}
      </div>

      {settingsOpen && (
        <SettingsModal
          loginId={user.id}
          onLogout={onLogout}
          onAccountDeleted={onLogout}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {themeOpen && (
        <ThemeModal themeId={themeId} onPick={changeTheme} onClose={() => setThemeOpen(false)} />
      )}
    </div>
  );
}

function MenuGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {MENU_ITEMS.map((item) => (
        <MenuCard key={item.id} item={item} onClick={() => onSelect(item.id)} />
      ))}
    </div>
  );
}

function MenuCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-36 flex-col items-start overflow-hidden rounded-3xl p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      style={{ backgroundColor: "var(--app-surface)", boxShadow: `0 1px 3px rgba(0,0,0,0.05)` }}
    >
      <span
        aria-hidden
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-60 transition group-hover:scale-110 ${item.blob}`}
      />
      <span
        className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ${item.gradient}`}
      >
        <Icon className="h-6 w-6 text-white" strokeWidth={2.2} />
      </span>
      <span
        className="relative mt-auto pt-4 text-[15px] font-bold leading-snug"
        style={{ color: "var(--app-text)" }}
      >
        {item.label}
      </span>
    </button>
  );
}

function MyPage({
  name,
  onLogout,
  theme,
}: {
  name: string;
  onLogout: () => void;
  theme: { accent: string; accentText: string };
}) {
  return (
    <section
      className="rounded-3xl p-6 text-center shadow-sm"
      style={{ backgroundColor: "var(--app-surface)" }}
    >
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md"
        style={{ backgroundColor: theme.accent, color: theme.accentText }}
      >
        {name.charAt(0)}
      </div>
      <p className="mt-4 text-lg font-bold" style={{ color: "var(--app-text)" }}>
        {name}
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 active:scale-95"
      >
        ログアウト
      </button>
    </section>
  );
}

function ThemeModal({
  themeId,
  onPick,
  onClose,
}: {
  themeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal label="テーマ色" onClose={onClose}>
      <div className="p-6 pt-12">
        <h2 className="text-xl font-bold text-slate-900">テーマ色</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {THEMES.map((theme: Theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onPick(theme.id)}
              className={`flex items-center gap-3 rounded-2xl p-3 ring-2 transition active:scale-[0.98] ${
                themeId === theme.id ? "ring-cyan-500" : "ring-slate-200"
              }`}
              style={{ backgroundColor: theme.bg }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{ backgroundColor: theme.accent }}
              >
                {themeId === theme.id && (
                  <Check className="h-4 w-4" style={{ color: theme.accentText }} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold" style={{ color: theme.text }}>
                  {theme.label}
                </span>
                <span className="flex gap-1">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: theme.surface }}
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: theme.subtext }}
                  />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
