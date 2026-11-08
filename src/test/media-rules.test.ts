import { describe, expect, it, vi } from 'vitest';
import { CHAT_TEXT_MAX, MEDIA_BATCH_MAX, parseGalleryUrls, validateChatText, mapMediaBatch } from '@/app/lib/mediaRules';
describe('Long chat and gallery rules', () => {
  it('accepts the requested minimum 100,000 Japanese characters', () => { expect(validateChatText('あ'.repeat(100000))).toBeNull(); });
  it('enforces the expanded limit including unicode characters', () => { expect(CHAT_TEXT_MAX).toBe(200000); expect(validateChatText('🐱'.repeat(200000))).toBeNull(); expect(validateChatText('あ'.repeat(200001))).not.toBeNull(); });
  it('allows fifty simultaneous media selections', () => { expect(MEDIA_BATCH_MAX).toBe(50); });
  it('accepts URLs separately from media and rejects ordinary text', () => { expect(parseGalleryUrls('https://example.com https://example.org')).toEqual(['https://example.com/', 'https://example.org/']); expect(() => parseGalleryUrls('こんにちは https://example.com')).toThrow(); });
  it('rejects unsafe link protocols', () => { expect(() => parseGalleryUrls('javascript:alert(1)')).toThrow(); });
  it('limits upload concurrency to three while preserving order', async () => { let active = 0; let peak = 0; const result = await mapMediaBatch(Array.from({ length: 50 }, (_, i) => i), async value => { active++; peak = Math.max(peak, active); await Promise.resolve(); active--; return value; }); expect(peak).toBe(3); expect(result).toHaveLength(50); expect(result[49]).toBe(49); });
});

vi.mock('@/app/lib/supabase', () => ({ supabase: {} }));
import { sendGallery } from '@/app/lib/gallery';
describe('Gallery validation before upload', () => {
  it('blocks non-media uploads', async () => { await expect(sendGallery('A', '', [new File(['text'], 'note.txt', { type: 'text/plain' })])).rejects.toThrow(); });
  it('blocks more than fifty files before any upload', async () => { await expect(sendGallery('A', '', Array.from({ length: 51 }, () => new File(['x'], 'a.png', { type: 'image/png' })))).rejects.toThrow(); });
});