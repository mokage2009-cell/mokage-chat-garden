import { supabase, signedUrl } from "@/app/lib/supabase";

export const GENDER_OPTIONS = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "unset", label: "未設定" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];

export const PROFILE_LIMITS = {
  displayNameMax: 30,
  bioMax: 500,
  hobbyMax: 10,
  hobbyLengthMax: 20,
  ageMin: 0,
  ageMax: 150,
  imageMaxBytes: 5 * 1024 * 1024,
} as const;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(IMAGE_EXTENSIONS);

export type Profile = {
  loginId: string;
  displayName: string;
  accountNumber: number;
  bio: string;
  age: number | null;
  gender: Gender;
  hobbies: string[];
  headerImageUrl: string | null;
  avatarImageUrl: string | null;
};

export type ProfileDraft = Omit<Profile, "loginId" | "accountNumber">;

type ProfileRow = {
  login_id: string;
  display_name: string;
  account_number: number;
  bio: string;
  age: number | null;
  gender: Gender;
  hobbies: string[];
  header_image_url: string | null;
  avatar_image_url: string | null;
};

const PROFILE_COLUMNS =
  "login_id, display_name, account_number, bio, age, gender, hobbies, header_image_url, avatar_image_url";

function toProfile(row: ProfileRow): Profile {
  return {
    loginId: row.login_id,
    displayName: row.display_name,
    accountNumber: row.account_number,
    bio: row.bio,
    age: row.age,
    gender: row.gender,
    hobbies: row.hobbies,
    headerImageUrl: row.header_image_url,
    avatarImageUrl: row.avatar_image_url,
  };
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "JPEG・PNG・WebP・GIFの画像を選んでください";
  }
  if (file.size > PROFILE_LIMITS.imageMaxBytes) {
    return "画像は5MB以下のファイルを選んでください";
  }
  return null;
}

export async function fetchProfile(loginId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("login_id", loginId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("プロフィールが見つかりませんでした");

  return toProfile(data as ProfileRow);
}

export async function saveProfile(loginId: string, draft: ProfileDraft): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: draft.displayName,
      bio: draft.bio,
      age: draft.age,
      gender: draft.gender,
      hobbies: draft.hobbies,
      header_image_url: draft.headerImageUrl,
      avatar_image_url: draft.avatarImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("login_id", loginId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("プロフィールを保存できませんでした");

  return toProfile(data as ProfileRow);
}

export async function uploadProfileImage(
  loginId: string,
  kind: "header" | "avatar",
  file: File,
): Promise<string> {
  const extension = IMAGE_EXTENSIONS[file.type];
  const path = `${loginId}/${kind}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("profile-images")
    .upload(path, file, { contentType: file.type, cacheControl: "3600" });

  if (error) throw new Error(error.message);

  return signedUrl("profile-images", path);
}
