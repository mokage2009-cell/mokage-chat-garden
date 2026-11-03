import { Bell, House, MessageCircle, Search, User, type LucideIcon } from "lucide-react";

export type TabId = "home" | "search" | "chat" | "notifications" | "mypage";

type TabItem = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

const TABS: TabItem[] = [
  { id: "home", label: "ホーム", icon: House },
  { id: "search", label: "探す", icon: Search },
  { id: "chat", label: "チャット", icon: MessageCircle },
  { id: "notifications", label: "通知", icon: Bell },
  { id: "mypage", label: "マイページ", icon: User },
];

type BottomNavProps = {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
};

export default function BottomNav({ activeTab, onSelect }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeTab;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition active:scale-95 ${
                  isActive ? "text-cyan-700" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
