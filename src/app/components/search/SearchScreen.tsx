import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import ProfileModal from "@/app/components/profile/ProfileModal";
import { GENDER_OPTIONS } from "@/app/lib/profile";
import {
  cancelDirectRequest,
  DEFAULT_FILTERS,
  formatAgeGender,
  SEARCH_PAGE_SIZE,
  searchProfiles,
  sendDirectRequest,
  type SearchFilters,
  type SearchResult,
} from "@/app/lib/search";

type SearchScreenProps = { loginId: string; onClose: () => void };

export default function SearchScreen({ loginId, onClose }: SearchScreenProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const runSearch = useCallback(() => {
    setLoading(true);
    setError(null);
    searchProfiles(loginId, filters, page)
      .then((data) => {
        setResults(data.results);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loginId, filters, page]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    runSearch();
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  const handleApply = async (targetId: string) => {
    setActioningId(targetId);
    setError(null);
    try {
      await sendDirectRequest(targetId, loginId);
      setResults((prev) =>
        prev.map((r) => (r.loginId === targetId ? { ...r, requestStatus: "pending" } : r)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "申請に失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (targetId: string) => {
    setActioningId(targetId);
    setError(null);
    try {
      await cancelDirectRequest(targetId, loginId);
      setResults((prev) =>
        prev.map((r) => (r.loginId === targetId ? { ...r, requestStatus: "none" } : r)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "キャンセルに失敗しました");
    } finally {
      setActioningId(null);
    }
  };

  const activeFilterCount = [
    filters.keyword.trim(),
    filters.gender !== "any" ? "x" : "",
    filters.ageMin !== null ? "x" : "",
    filters.ageMax !== null ? "x" : "",
    filters.hobby.trim(),
  ].filter(Boolean).length;

  return (
    <div className="animate-screen-in min-h-screen bg-sky-50 pb-12">
      <div className="mx-auto max-w-md px-5">
        <header className="flex items-center gap-3 pb-3 pt-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-xl font-bold tracking-tight text-slate-900">探す</h1>
        </header>

        <form onSubmit={handleSearch} className="flex gap-2 pb-3">
          <input
            value={filters.keyword}
            onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            placeholder="名前で検索"
            className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            検索
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <Filter className="h-4 w-4 text-cyan-600" />
          絞り込み
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <p className="mb-3 text-sm text-slate-600">
          {total}件中{" "}
          {results.length > 0
            ? `${page * SEARCH_PAGE_SIZE + 1}〜${page * SEARCH_PAGE_SIZE + results.length}件目`
            : "0件"}
          を表示
        </p>

        {loading && results.length === 0 ? (
          <p role="status" className="py-16 text-center text-sm text-slate-600">
            検索中…
          </p>
        ) : results.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <Search className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 font-bold text-slate-900">該当する人が見つかりません</p>
            <p className="mt-1 text-sm text-slate-500">条件を変えて再度検索してみてください</p>
          </section>
        ) : (
          <>
            <ul className="space-y-3">
              {results.map((person) => (
                <li key={person.loginId}>
                  <SearchResultCard
                    person={person}
                    isActioning={actioningId === person.loginId}
                    onOpenProfile={() => setSelectedLoginId(person.loginId)}
                    onApply={() => handleApply(person.loginId)}
                    onCancel={() => handleCancel(person.loginId)}
                  />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  {page + 1} / {totalPages}ページ
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showFilters && (
        <FilterModal
          filters={filters}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setPage(0);
            setShowFilters(false);
          }}
          onReset={handleResetFilters}
        />
      )}
      {selectedLoginId && (
        <ProfileModal loginId={selectedLoginId} onClose={() => setSelectedLoginId(null)} />
      )}
    </div>
  );
}

function SearchResultCard({
  person,
  isActioning,
  onOpenProfile,
  onApply,
  onCancel,
}: {
  person: SearchResult;
  isActioning: boolean;
  onOpenProfile: () => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition hover:shadow-md">
      <button
        type="button"
        onClick={onOpenProfile}
        className="group flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white">
          {person.avatarUrl ? (
            <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : person.displayName ? (
            <span className="text-base font-bold">{Array.from(person.displayName)[0]}</span>
          ) : (
            <UserRound className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 group-hover:text-rose-800">
            {person.displayName}
          </p>
          <p className="text-xs text-slate-500">{formatAgeGender(person.age, person.gender)}</p>
          {person.hobbies.length > 0 && (
            <p className="mt-1 truncate text-xs text-slate-500">
              趣味: {person.hobbies.join("・")}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold text-rose-600">プロフィール</span>
      </button>
      <div className="border-t border-slate-100 px-4 py-2.5">
        {person.requestStatus === "none" && (
          <button
            type="button"
            onClick={onApply}
            disabled={isActioning}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {isActioning && <Loader2 className="h-4 w-4 animate-spin" />}
            申請する！
          </button>
        )}
        {person.requestStatus === "pending" && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isActioning}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-60"
          >
            {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            申請キャンセル
          </button>
        )}
        {person.requestStatus === "accepted" && (
          <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-100 py-2.5 text-sm font-bold text-emerald-700">
            フレンド成立済み
          </span>
        )}
        {person.requestStatus === "rejected" && (
          <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-500">
            申請は拒否されました
          </span>
        )}
      </div>
    </article>
  );
}

function FilterModal({
  filters,
  onClose,
  onApply,
  onReset,
}: {
  filters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  onReset: () => void;
}) {
  const [local, setLocal] = useState<SearchFilters>(filters);

  return (
    <Modal label="絞り込み条件" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply(local);
        }}
        className="space-y-5 p-6 pt-12"
      >
        <h2 className="text-xl font-bold text-slate-900">絞り込み条件</h2>

        <label className="block text-sm font-semibold text-slate-800">
          名前
          <input
            value={local.keyword}
            onChange={(e) => setLocal((f) => ({ ...f, keyword: e.target.value }))}
            placeholder="名前の一部"
            className="mt-2 w-full rounded-2xl bg-slate-100 px-4 py-3 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-slate-800">性別</p>
          <div className="mt-2 flex gap-2">
            <FilterButton
              active={local.gender === "any"}
              onClick={() => setLocal((f) => ({ ...f, gender: "any" }))}
            >
              指定しない
            </FilterButton>
            {GENDER_OPTIONS.map((g) => (
              <FilterButton
                key={g.value}
                active={local.gender === g.value}
                onClick={() => setLocal((f) => ({ ...f, gender: g.value }))}
              >
                {g.label}
              </FilterButton>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">年齢</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={150}
              value={local.ageMin ?? ""}
              onChange={(e) =>
                setLocal((f) => ({ ...f, ageMin: e.target.value ? Number(e.target.value) : null }))
              }
              placeholder="最小"
              className="w-20 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-sm text-slate-500">〜</span>
            <input
              type="number"
              min={0}
              max={150}
              value={local.ageMax ?? ""}
              onChange={(e) =>
                setLocal((f) => ({ ...f, ageMax: e.target.value ? Number(e.target.value) : null }))
              }
              placeholder="最大"
              className="w-20 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-xs text-slate-500">歳</span>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-800">
          趣味
          <input
            value={local.hobby}
            onChange={(e) => setLocal((f) => ({ ...f, hobby: e.target.value }))}
            placeholder="例: 映画"
            className="mt-2 w-full rounded-2xl bg-slate-100 px-4 py-3 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <p className="mt-1.5 text-xs text-slate-500">入力した趣味を含む人が表示されます</p>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700"
          >
            リセット
          </button>
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white shadow-md"
          >
            この条件で検索
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition ${active ? "bg-rose-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"}`}
    >
      {children}
    </button>
  );
}
