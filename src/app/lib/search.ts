import { supabase } from "@/app/lib/supabase";
import { GENDER_OPTIONS, type Gender } from "@/app/lib/profile";

export const SEARCH_PAGE_SIZE = 20;

export type SearchFilters = {
  keyword: string;
  gender: Gender | "any";
  ageMin: number | null;
  ageMax: number | null;
  hobby: string;
};

export const DEFAULT_FILTERS: SearchFilters = {
  keyword: "",
  gender: "any",
  ageMin: null,
  ageMax: null,
  hobby: "",
};

export type SearchResult = {
  loginId: string;
  displayName: string;
  age: number | null;
  gender: Gender;
  hobbies: string[];
  avatarUrl: string | null;
  bio: string;
  requestStatus: "none" | "pending" | "accepted" | "rejected";
};

type ProfileSearchRow = {
  login_id: string;
  display_name: string;
  age: number | null;
  gender: Gender;
  hobbies: string[];
  avatar_image_url: string | null;
  bio: string;
};

type RequestRow = {
  target_login_id: string | null;
  post_id: string | null;
  status: string;
};

export type SearchPage = {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
};

export async function searchProfiles(
  loginId: string,
  filters: SearchFilters,
  page: number,
): Promise<SearchPage> {
  let query = supabase
    .from("profiles")
    .select("login_id, display_name, age, gender, hobbies, avatar_image_url, bio", {
      count: "exact",
    })
    .neq("login_id", loginId);

  if (filters.keyword.trim()) {
    query = query.ilike("display_name", `%${filters.keyword.trim()}%`);
  }
  if (filters.gender !== "any") {
    query = query.eq("gender", filters.gender);
  }
  if (filters.ageMin !== null) {
    query = query.gte("age", filters.ageMin);
  }
  if (filters.ageMax !== null) {
    query = query.lte("age", filters.ageMax);
  }
  if (filters.hobby.trim()) {
    query = query.filter("hobbies", "cs", JSON.stringify([filters.hobby.trim()]));
  }

  const from = page * SEARCH_PAGE_SIZE;
  const to = from + SEARCH_PAGE_SIZE - 1;

  const { data, error, count } = await query
    .order("display_name", { ascending: true })
    .range(from, to);

  if (error) throw new Error("検索できませんでした");

  const profiles = (data as ProfileSearchRow[]) ?? [];
  const total = count ?? 0;

  if (profiles.length === 0) {
    return {
      results: [],
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
    };
  }

  const targetIds = profiles.map((p) => p.login_id);

  const { data: requestData } = await supabase
    .from("friend_requests")
    .select("target_login_id, post_id, status")
    .eq("applicant_login_id", loginId)
    .in("target_login_id", targetIds);

  const requestMap = new Map<string, string>();
  for (const row of (requestData as RequestRow[] | null) ?? []) {
    if (row.target_login_id) {
      requestMap.set(row.target_login_id, row.status);
    }
  }

  const results: SearchResult[] = profiles.map((row) => ({
    loginId: row.login_id,
    displayName: row.display_name,
    age: row.age,
    gender: row.gender,
    hobbies: row.hobbies ?? [],
    avatarUrl: row.avatar_image_url,
    bio: row.bio,
    requestStatus: (requestMap.get(row.login_id) as SearchResult["requestStatus"]) ?? "none",
  }));

  return {
    results,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
  };
}

const UNIQUE_VIOLATION = "23505";

export async function sendDirectRequest(
  targetLoginId: string,
  applicantLoginId: string,
): Promise<void> {
  const { error } = await supabase.from("friend_requests").insert({
    target_login_id: targetLoginId,
    applicant_login_id: applicantLoginId,
    status: "pending",
  });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
}

export async function cancelDirectRequest(
  targetLoginId: string,
  applicantLoginId: string,
): Promise<void> {
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("target_login_id", targetLoginId)
    .eq("applicant_login_id", applicantLoginId);
  if (error) throw new Error("申請をキャンセルできませんでした");
}

export function formatAgeGender(age: number | null, gender: Gender): string {
  const ageStr = age !== null ? `${age}歳` : "年齢未設定";
  const genderLabel = GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? "未設定";
  return `${ageStr}(${genderLabel})`;
}
