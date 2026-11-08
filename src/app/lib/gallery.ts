import { supabase } from '@/app/lib/supabase';
import { uploadTimelineMedia } from '@/app/lib/timeline';
import { validateMediaFile } from '@/app/lib/chat';
import { mapMediaBatch, MEDIA_BATCH_MAX, parseGalleryUrls } from '@/app/lib/mediaRules';

export type GalleryFilter = 'all' | 'media' | 'url';
export type GalleryItem = {
  id: string; batch_id: string; sender_login_id: string; kind: 'url' | 'image' | 'video'; url: string; created_at: string;
  sender: { display_name: string; avatar_image_url: string | null } | null;
};
export const GALLERY_PAGE_SIZE = 40;

export async function fetchGallery(filter: GalleryFilter, before?: GalleryItem): Promise<GalleryItem[]> {
  let query = supabase.from('gallery_items').select('*, sender:profiles!sender_login_id(display_name, avatar_image_url)');
  if (filter === 'media') query = query.in('kind', ['image', 'video']);
  if (filter === 'url') query = query.eq('kind', 'url');
  if (before) query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
  const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(GALLERY_PAGE_SIZE);
  if (error) throw new Error('ギャラリーを読み込めませんでした');
  return data as GalleryItem[];
}

export async function sendGallery(loginId: string, text: string, files: File[]): Promise<void> {
  const urls = parseGalleryUrls(text);
  if (files.length > MEDIA_BATCH_MAX) throw new Error(`写真・動画は${MEDIA_BATCH_MAX}個までです`);
  if (!urls.length && !files.length) throw new Error('URLまたは写真・動画を選んでください');
  for (const file of files) { const error = validateMediaFile(file); if (error) throw new Error(error); }
  const media = await mapMediaBatch(files, file => uploadTimelineMedia(loginId, file));
  const batch_id = crypto.randomUUID();
  const items = [...urls.map(url => ({ kind: 'url', url })), ...media.map(item => ({ kind: item.type, url: item.url }))];
  const { error } = await supabase.from('gallery_items').insert(items.map(item => ({ ...item, batch_id, sender_login_id: loginId })));
  if (error) throw new Error('送信できませんでした');
}