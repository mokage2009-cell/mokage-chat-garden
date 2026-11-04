ALTER TABLE public.timeline_posts ADD COLUMN visibility text NOT NULL DEFAULT 'all';
ALTER TABLE public.timeline_posts ADD COLUMN community_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.timeline_posts ADD COLUMN media jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.timeline_posts ADD CONSTRAINT timeline_visibility_chk CHECK (visibility IN ('all','friends','self','communities'));

CREATE OR REPLACE FUNCTION public.are_friends(a text, b text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM friend_requests r
    LEFT JOIN friend_posts p ON p.id = r.post_id
    WHERE r.status = 'accepted' AND (
      (r.applicant_login_id = a AND COALESCE(r.target_login_id, p.author_login_id) = b) OR
      (r.applicant_login_id = b AND COALESCE(r.target_login_id, p.author_login_id) = a)
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_any(p_ids uuid[], p_login text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM community_memberships m
    WHERE m.community_id = ANY(p_ids) AND m.applicant_login_id = p_login AND m.role IN ('owner','member'))
$$;

DROP POLICY IF EXISTS "read timeline" ON public.timeline_posts;
CREATE POLICY "read timeline" ON public.timeline_posts FOR SELECT TO authenticated USING (
  author_login_id = public.current_login_id()
  OR public.is_app_owner()
  OR visibility = 'all'
  OR (visibility = 'friends' AND public.are_friends(author_login_id, public.current_login_id()))
  OR (visibility = 'communities' AND public.is_member_of_any(community_ids, public.current_login_id()))
);
CREATE POLICY "delete own timeline" ON public.timeline_posts FOR DELETE TO authenticated USING (author_login_id = public.current_login_id());
GRANT DELETE ON public.timeline_posts TO authenticated;