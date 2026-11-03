CREATE TABLE public.profiles (
  login_id text PRIMARY KEY CHECK (login_id ~ '^[A-Za-z0-9]{1,30}$'),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 30),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 500),
  age integer CHECK (age IS NULL OR age BETWEEN 0 AND 150),
  gender text NOT NULL DEFAULT 'unset' CHECK (gender IN ('male','female','unset')),
  hobbies text[] NOT NULL DEFAULT '{}' CHECK (cardinality(hobbies) <= 10),
  header_image_url text,
  avatar_image_url text,
  account_number integer UNIQUE NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE SEQUENCE public.profiles_account_number_seq START WITH 2;
GRANT SELECT, DELETE ON public.profiles TO authenticated;
GRANT UPDATE (display_name,bio,age,gender,hobbies,header_image_url,avatar_image_url,updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SEQUENCE public.profiles_account_number_seq TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.current_login_id() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT login_id FROM profiles WHERE user_id = auth.uid() $$;
CREATE FUNCTION public.is_app_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND account_number = 1) $$;

CREATE POLICY "read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own profile" ON public.profiles FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.friend_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 40),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.friend_posts (created_at DESC);
GRANT SELECT, INSERT ON public.friend_posts TO authenticated;
GRANT ALL ON public.friend_posts TO service_role;
ALTER TABLE public.friend_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read posts" ON public.friend_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own posts" ON public.friend_posts FOR INSERT TO authenticated WITH CHECK (author_login_id = public.current_login_id());

CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.friend_posts(id) ON DELETE CASCADE,
  applicant_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  target_login_id text REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, applicant_login_id)
);
CREATE INDEX ON public.friend_requests (applicant_login_id);
CREATE INDEX ON public.friend_requests (target_login_id);
GRANT SELECT, INSERT, DELETE ON public.friend_requests TO authenticated;
GRANT UPDATE (status) ON public.friend_requests TO authenticated;
GRANT ALL ON public.friend_requests TO service_role;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read requests" ON public.friend_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "apply" ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (
  applicant_login_id = public.current_login_id() AND (
    (post_id IS NOT NULL AND target_login_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.friend_posts p WHERE p.id = post_id AND p.author_login_id = applicant_login_id))
    OR (post_id IS NULL AND target_login_id IS NOT NULL AND target_login_id <> applicant_login_id)));
CREATE POLICY "respond" ON public.friend_requests FOR UPDATE TO authenticated USING (
  target_login_id = public.current_login_id() OR EXISTS (SELECT 1 FROM public.friend_posts p WHERE p.id = post_id AND p.author_login_id = public.current_login_id()));
CREATE POLICY "cancel own" ON public.friend_requests FOR DELETE TO authenticated USING (applicant_login_id = public.current_login_id());

CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  header_image_url text,
  avatar_image_url text,
  owner_message text NOT NULL DEFAULT '' CHECK (char_length(owner_message) <= 500),
  join_mode text NOT NULL DEFAULT 'approval' CHECK (join_mode IN ('open','approval')),
  dissolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read communities" ON public.communities FOR SELECT TO authenticated USING (dissolved_at IS NULL);
CREATE POLICY "create community" ON public.communities FOR INSERT TO authenticated WITH CHECK (owner_login_id = public.current_login_id());

CREATE TABLE public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  applicant_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'applicant' CHECK (role IN ('owner','member','applicant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, applicant_login_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_memberships TO authenticated;
GRANT ALL ON public.community_memberships TO service_role;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read memberships" ON public.community_memberships FOR SELECT TO authenticated USING (true);
CREATE POLICY "join" ON public.community_memberships FOR INSERT TO authenticated WITH CHECK (
  applicant_login_id = public.current_login_id() AND (
    (role = 'owner' AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_login_id = applicant_login_id))
    OR (role = 'applicant' AND NOT EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_login_id = applicant_login_id))
    OR (role = 'member' AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.join_mode = 'open' AND c.owner_login_id <> applicant_login_id))));
CREATE POLICY "owner manages members" ON public.community_memberships FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_login_id = public.current_login_id()));
CREATE POLICY "leave or remove" ON public.community_memberships FOR DELETE TO authenticated USING (
  applicant_login_id = public.current_login_id() OR EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_login_id = public.current_login_id()));

CREATE TABLE public.community_chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT ON public.community_chat_rooms TO authenticated;
GRANT ALL ON public.community_chat_rooms TO service_role;
ALTER TABLE public.community_chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read rooms" ON public.community_chat_rooms FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE TABLE public.timeline_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 40),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.timeline_posts TO authenticated;
GRANT ALL ON public.timeline_posts TO service_role;
ALTER TABLE public.timeline_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read timeline" ON public.timeline_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "post timeline" ON public.timeline_posts FOR INSERT TO authenticated WITH CHECK (author_login_id = public.current_login_id());

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL CHECK (context IN ('dm','community','timeline')),
  scope_id uuid NOT NULL,
  sender_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 10000),
  media_url text,
  media_type text,
  call_type text CHECK (call_type IS NULL OR call_type IN ('audio','video')),
  call_duration_sec integer CHECK (call_duration_sec IS NULL OR call_duration_sec >= 0),
  call_status text CHECK (call_status IS NULL OR call_status IN ('request','accepted','rejected','cancelled','ended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.chat_messages (context, scope_id, created_at);
CREATE INDEX ON public.chat_messages (sender_login_id);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT UPDATE (call_status, call_duration_sec) ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "send as self" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (sender_login_id = public.current_login_id());
CREATE POLICY "update call status" ON public.chat_messages FOR UPDATE TO authenticated USING (call_type IS NOT NULL) WITH CHECK (call_type IS NOT NULL);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('friend_accepted','admin','community','system')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 500),
  actor_login_id text REFERENCES public.profiles(login_id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications (recipient_login_id, created_at DESC);
GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_login_id = public.current_login_id() OR public.is_app_owner());
CREATE POLICY "owner sends notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_app_owner() AND type = 'admin');
CREATE POLICY "mark read" ON public.notifications FOR UPDATE TO authenticated USING (recipient_login_id = public.current_login_id());

CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_login_id text REFERENCES public.profiles(login_id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_feedback TO authenticated;
GRANT ALL ON public.user_feedback TO service_role;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read feedback" ON public.user_feedback FOR SELECT TO authenticated USING (sender_login_id = public.current_login_id() OR public.is_app_owner());
CREATE POLICY "send feedback" ON public.user_feedback FOR INSERT TO authenticated WITH CHECK (sender_login_id = public.current_login_id());

CREATE TABLE public.deleted_user_ids (
  login_id text PRIMARY KEY,
  deleted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deleted_user_ids TO authenticated;
GRANT ALL ON public.deleted_user_ids TO service_role;
ALTER TABLE public.deleted_user_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "record own deletion" ON public.deleted_user_ids FOR INSERT TO authenticated WITH CHECK (login_id = public.current_login_id());
CREATE POLICY "update own deletion" ON public.deleted_user_ids FOR UPDATE TO authenticated USING (login_id = public.current_login_id());
CREATE POLICY "select own deletion" ON public.deleted_user_ids FOR SELECT TO authenticated USING (login_id = public.current_login_id());

CREATE FUNCTION public.notify_friend_acceptance() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_author text; v_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    IF NEW.post_id IS NOT NULL THEN SELECT author_login_id INTO v_author FROM friend_posts WHERE id = NEW.post_id;
    ELSE v_author := NEW.target_login_id; END IF;
    IF v_author IS NOT NULL THEN
      SELECT display_name INTO v_name FROM profiles WHERE login_id = v_author;
      INSERT INTO notifications (recipient_login_id, type, title, body, actor_login_id)
      VALUES (NEW.applicant_login_id, 'friend_accepted', COALESCE(v_name, v_author) || 'さんがフレンド申請を承諾しました', 'チャットで会話を始められます', v_author);
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_friend_acceptance() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER friend_request_accepted_trigger AFTER UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.notify_friend_acceptance();

CREATE FUNCTION public.update_community_owner_profile(p_community_id uuid, p_actor_login_id text, p_name text, p_owner_message text, p_header_image_url text, p_avatar_image_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM communities WHERE id = p_community_id AND owner_login_id = current_login_id() AND dissolved_at IS NULL) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Invalid community name'; END IF;
  IF p_owner_message IS NULL OR char_length(p_owner_message) > 500 THEN RAISE EXCEPTION 'Invalid community message'; END IF;
  UPDATE communities SET name = trim(p_name), owner_message = p_owner_message, header_image_url = p_header_image_url, avatar_image_url = p_avatar_image_url WHERE id = p_community_id;
END $$;
CREATE FUNCTION public.create_community_chat_room(p_community_id uuid, p_actor_login_id text, p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_count int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM communities WHERE id = p_community_id AND owner_login_id = current_login_id() AND dissolved_at IS NULL) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Invalid room name'; END IF;
  SELECT count(*) INTO v_count FROM community_chat_rooms WHERE community_id = p_community_id AND deleted_at IS NULL;
  IF v_count >= 50 THEN RAISE EXCEPTION 'Room limit reached'; END IF;
  INSERT INTO community_chat_rooms (community_id, name) VALUES (p_community_id, trim(p_name)) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
CREATE FUNCTION public.delete_community_chat_room(p_room_id uuid, p_actor_login_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE community_chat_rooms r SET deleted_at = now() WHERE r.id = p_room_id AND r.deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM communities c WHERE c.id = r.community_id AND c.owner_login_id = current_login_id() AND c.dissolved_at IS NULL);
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized or room not found'; END IF;
END $$;
CREATE FUNCTION public.dissolve_community(p_community_id uuid, p_actor_login_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE communities SET dissolved_at = now() WHERE id = p_community_id AND owner_login_id = current_login_id() AND dissolved_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized or community not found'; END IF;
END $$;
CREATE FUNCTION public.update_community_join_mode(p_community_id uuid, p_actor_login_id text, p_join_mode text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF p_join_mode NOT IN ('open','approval') THEN RAISE EXCEPTION 'Invalid join mode'; END IF;
  IF NOT EXISTS (SELECT 1 FROM communities WHERE id = p_community_id AND owner_login_id = current_login_id() AND dissolved_at IS NULL) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE communities SET join_mode = p_join_mode WHERE id = p_community_id;
END $$;
CREATE FUNCTION public.approve_community_member(p_membership_id uuid, p_actor_login_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM community_memberships m JOIN communities c ON c.id = m.community_id WHERE m.id = p_membership_id AND c.owner_login_id = current_login_id() AND c.dissolved_at IS NULL AND m.role = 'applicant') THEN RAISE EXCEPTION 'Not authorized or membership not found'; END IF;
  UPDATE community_memberships SET role = 'member' WHERE id = p_membership_id;
END $$;
CREATE FUNCTION public.reject_community_member(p_membership_id uuid, p_actor_login_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM community_memberships m JOIN communities c ON c.id = m.community_id WHERE m.id = p_membership_id AND c.owner_login_id = current_login_id() AND c.dissolved_at IS NULL AND m.role = 'applicant') THEN RAISE EXCEPTION 'Not authorized or membership not found'; END IF;
  DELETE FROM community_memberships WHERE id = p_membership_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.update_community_owner_profile(uuid,text,text,text,text,text), public.create_community_chat_room(uuid,text,text), public.delete_community_chat_room(uuid,text), public.dissolve_community(uuid,text), public.update_community_join_mode(uuid,text,text), public.approve_community_member(uuid,text), public.reject_community_member(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_community_owner_profile(uuid,text,text,text,text,text), public.create_community_chat_room(uuid,text,text), public.delete_community_chat_room(uuid,text), public.dissolve_community(uuid,text), public.update_community_join_mode(uuid,text,text), public.approve_community_member(uuid,text), public.reject_community_member(uuid,text) TO authenticated;

CREATE POLICY "signed-in read app media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('profile-images','chat-media'));
CREATE POLICY "signed-in upload app media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('profile-images','chat-media'));
CREATE POLICY "signed-in update own app media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('profile-images','chat-media') AND owner = auth.uid());