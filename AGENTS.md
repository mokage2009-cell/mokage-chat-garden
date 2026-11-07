<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The ported chat app lives in src/app (screens, lib) and renders from src/routes/index.tsx; keep it there rather than splitting into routes, because it is a single-screen state-driven app.
- Sign-in uses a user ID + password mapped to an internal email (src/app/lib/accountRules.ts); accounts are created server-side so no confirmation email is needed.
- Storage buckets are private (public buckets are blocked by workspace policy); uploads store long-lived signed URLs.
- RLS identifies the caller via public.current_login_id(); the owner/admin is the profile with account_number 1.
- Resolve friendship states symmetrically through shared friendship rules; enforce duplicate prevention and mutual removal in database functions so UI direction cannot change permissions.
- Preserve conversation_scope_id when recruitment posts are deleted; use the oldest accepted relationship for both participants and merge legacy duplicate scopes in admin history.
