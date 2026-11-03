// The owner (admin) account is the one registered with this login ID.
export const OWNER_LOGIN_ID = "mokou1101";

// Sign-in uses a user ID + password; the auth system needs an email, so each ID maps to an internal address.
export function loginEmail(loginId: string): string {
  return `${loginId.toLowerCase()}@users.mokagechat.local`;
}

// The auth system requires at least 6 characters; short passwords (3–5) are padded with a fixed suffix.
export const PASSWORD_MIN = 3;
export function authPassword(password: string): string {
  return password.length < 6 ? `${password}#mkpad` : password;
}
