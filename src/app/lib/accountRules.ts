// The owner (admin) account is the one registered with this login ID.
export const OWNER_LOGIN_ID = "mokou1101";

// Sign-in uses a user ID + password; the auth system needs an email, so each ID maps to an internal address.
export function loginEmail(loginId: string): string {
  return `${loginId.toLowerCase()}@users.mokagechat.local`;
}
