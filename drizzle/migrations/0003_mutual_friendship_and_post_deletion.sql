ALTER TABLE public.friend_requests ADD COLUMN conversation_scope_id uuid;
UPDATE public.friend_requests SET conversation_scope_id = COALESCE(post_id, id);
UPDATE public.friend_requests r SET target_login_id = p.author_login_id FROM public.friend_posts p WHERE r.post_id = p.id AND r.target_login_id IS NULL;
ALTER TABLE public.friend_requests DROP CONSTRAINT friend_requests_post_id_fkey;
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.friend_posts(id) ON DELETE SET NULL;
CREATE OR REPLACE FUNCTION public.check_friend_request_pair() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target text;
BEGIN
 target := COALESCE(NEW.target_login_id, (SELECT author_login_id FROM public.friend_posts WHERE id=NEW.post_id));
 IF target IS NULL OR target = NEW.applicant_login_id THEN RAISE EXCEPTION '無効なフレンド申請です'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(least(target,NEW.applicant_login_id)||':'||greatest(target,NEW.applicant_login_id),0));
 IF EXISTS (SELECT 1 FROM public.friend_requests r LEFT JOIN public.friend_posts p ON p.id=r.post_id WHERE r.id<>NEW.id AND r.status IN ('pending','accepted') AND ((r.applicant_login_id=NEW.applicant_login_id AND COALESCE(r.target_login_id,p.author_login_id)=target) OR (r.applicant_login_id=target AND COALESCE(r.target_login_id,p.author_login_id)=NEW.applicant_login_id))) THEN
 RAISE EXCEPTION 'フレンド済み、または申請済みです';
 END IF;
 NEW.conversation_scope_id := COALESCE(NEW.conversation_scope_id,NEW.post_id,NEW.id);
 RETURN NEW;
END $$;
CREATE TRIGGER check_friend_request_pair BEFORE INSERT ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.check_friend_request_pair();
CREATE OR REPLACE FUNCTION public.remove_friend(p_other_login_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me text := public.current_login_id();
BEGIN
 IF me IS NULL OR me=p_other_login_id THEN RAISE EXCEPTION '認証が必要です'; END IF;
 DELETE FROM public.friend_requests r USING public.profiles other WHERE other.login_id=p_other_login_id AND ((r.applicant_login_id=me AND COALESCE(r.target_login_id,(SELECT author_login_id FROM public.friend_posts WHERE id=r.post_id))=other.login_id) OR (r.applicant_login_id=other.login_id AND COALESCE(r.target_login_id,(SELECT author_login_id FROM public.friend_posts WHERE id=r.post_id))=me));
END $$;
REVOKE ALL ON FUNCTION public.remove_friend(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_friend(text) TO authenticated;
GRANT DELETE ON public.friend_posts TO authenticated;
CREATE POLICY "delete own friend posts" ON public.friend_posts FOR DELETE TO authenticated USING (author_login_id=public.current_login_id());