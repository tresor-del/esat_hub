import { describe, expect, it } from 'vitest';
import {
  buildShareUrl,
  formatMediaType,
  getMediaUrl,
  isDocumentMedia,
  isImageMedia,
} from './mediaHelpers';

describe('mediaHelpers', () => {
  it('detects image content types', () => {
    expect(isImageMedia({ mime_type: 'image/png' })).toBe(true);
    expect(isImageMedia({ mime_type: 'application/pdf' })).toBe(false);
  });

  it('detects document media and shares', () => {
    expect(isDocumentMedia({ mime_type: 'application/pdf' })).toBe(true);
    expect(isDocumentMedia({ post_type: 'document' })).toBe(true);
    expect(isDocumentMedia({ mime_type: 'image/jpeg' })).toBe(false);
  });

  it('returns the best available media URL', () => {
    expect(getMediaUrl({ file_path: '/media/file.png' })).toBe('/media/file.png');
    expect(getMediaUrl({ url: 'https://cdn.example.com/file.pdf' })).toBe('https://cdn.example.com/file.pdf');
    expect(getMediaUrl({ path: '/tmp/test' })).toBe('/tmp/test');
  });

  it('builds a shareable room URL', () => {
    expect(buildShareUrl({ id: 'abc-123' })).toBe('https://esat-hub.vercel.app/room?source=share&id=abc-123');
  });

  it('formats file types for UI labels', () => {
    expect(formatMediaType({ mime_type: 'image/png' })).toBe('Image');
    expect(formatMediaType({ mime_type: 'application/pdf' })).toBe('Document');
    expect(formatMediaType({ mime_type: 'text/plain' })).toBe('Fichier');
  });
});
