import { describe, expect, it } from 'vitest';
import {
  getResourceNodeSize,
  inferResourceMimeType,
  isAcceptedResourceFile,
  parseResourceFileMeta,
  serializeResourceFileMeta,
  validateResourceFile,
} from '@/lib/resourceFiles';

describe('resourceFiles', () => {
  it('accepts png, pdf, and pptx by extension', () => {
    expect(isAcceptedResourceFile(new File([''], 'diagram.png'))).toBe(true);
    expect(isAcceptedResourceFile(new File([''], 'notes.pdf'))).toBe(true);
    expect(isAcceptedResourceFile(new File([''], 'slides.pptx'))).toBe(true);
    expect(isAcceptedResourceFile(new File([''], 'notes.docx'))).toBe(false);
  });

  it('infers mime types from file extensions', () => {
    expect(inferResourceMimeType(new File([''], 'diagram.png'))).toBe('image/png');
    expect(inferResourceMimeType(new File([''], 'slides.pptx'))).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
  });

  it('validates supported files and rejects unsupported ones', () => {
    expect(() => validateResourceFile(new File([''], 'notes.docx'))).toThrow(
      'Only PNG, PDF, and PPTX files are supported.',
    );
  });

  it('round-trips resource metadata', () => {
    const meta = {
      mimeType: 'image/png',
      fileName: 'diagram.png',
      storagePath: 'user/topic/file.png',
    };

    expect(parseResourceFileMeta(serializeResourceFileMeta(meta))).toEqual(meta);
  });

  it('returns larger nodes for images and pdfs', () => {
    expect(getResourceNodeSize('image/png').width).toBeGreaterThan(300);
    expect(getResourceNodeSize('application/pdf').height).toBeGreaterThan(400);
  });
});
