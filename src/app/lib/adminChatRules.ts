export type AdminScopeMessage = {
  scope_id: string;
  context: "dm" | "community" | "timeline";
  created_at: string;
  sender_login_id: string;
  sender: { display_name: string; avatar_image_url: string | null } | null;
};

export type AdminRelationship = {
  id: string;
  post_id: string | null;
  conversation_scope_id: string | null;
  applicant_login_id: string;
  target_login_id: string | null;
  post: { author_login_id: string } | null;
};

export function adminConversationPairs(loginId: string, relationships: AdminRelationship[]) {
  const pairs = new Map<string, Set<string>>();
  for (const r of relationships) {
    const target = r.target_login_id ?? r.post?.author_login_id;
    const other = r.applicant_login_id === loginId ? target : target === loginId ? r.applicant_login_id : null;
    if (!other || other === loginId) continue;
    const scopes = pairs.get(other) ?? new Set<string>();
    scopes.add(r.conversation_scope_id ?? r.post_id ?? r.id);
    pairs.set(other, scopes);
  }
  return pairs;
}