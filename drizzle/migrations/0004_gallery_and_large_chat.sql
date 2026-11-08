ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_body_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_body_check CHECK (char_length(body) <= 200000);
CREATE INDEX IF NOT EXISTS chat_messages_scope_recent_idx ON public.chat_messages (context, scope_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS timeline_posts_recent_idx ON public.timeline_posts (created_at DESC);
CREATE TABLE public.gallery_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 batch_id uuid NOT NULL,
 sender_login_id text NOT NULL REFERENCES public.profiles(login_id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('url','image','video')),
 url text NOT NULL CHECK (url ~ '^https?://' AND char_length(url) <= 12000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all users read gallery" ON public.gallery_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "send own gallery items" ON public.gallery_items FOR INSERT TO authenticated WITH CHECK (sender_login_id = public.current_login_id());
CREATE POLICY "delete own gallery items" ON public.gallery_items FOR DELETE TO authenticated USING (sender_login_id = public.current_login_id());
CREATE INDEX gallery_items_recent_idx ON public.gallery_items (created_at DESC, id DESC);
CREATE INDEX gallery_items_kind_recent_idx ON public.gallery_items (kind, created_at DESC, id DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_items;