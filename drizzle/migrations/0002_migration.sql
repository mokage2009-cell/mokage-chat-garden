CREATE OR REPLACE FUNCTION public.create_community_chat_room(p_community_id uuid, p_actor_login_id text, p_name text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_id uuid; v_count int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM communities c WHERE c.id = p_community_id AND c.dissolved_at IS NULL AND (c.owner_login_id = current_login_id() OR EXISTS (SELECT 1 FROM community_memberships m WHERE m.community_id = c.id AND m.applicant_login_id = current_login_id() AND m.role IN ('owner','member')))) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Invalid room name'; END IF;
  SELECT count(*) INTO v_count FROM community_chat_rooms WHERE community_id = p_community_id AND deleted_at IS NULL;
  IF v_count >= 50 THEN RAISE EXCEPTION 'Room limit reached'; END IF;
  INSERT INTO community_chat_rooms (community_id, name) VALUES (p_community_id, trim(p_name)) RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.leave_community(p_community_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM communities WHERE id = p_community_id AND owner_login_id = current_login_id()) THEN RAISE EXCEPTION 'Owner cannot leave'; END IF;
  DELETE FROM community_memberships WHERE community_id = p_community_id AND applicant_login_id = current_login_id();
END $function$;
GRANT EXECUTE ON FUNCTION public.leave_community(uuid) TO authenticated;