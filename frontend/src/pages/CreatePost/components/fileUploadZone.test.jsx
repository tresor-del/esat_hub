import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileUploadZone, { validateFile } from './fileUploadZone';

describe('validateFile', () => {
  it('accepts supported photo formats and rejects unsupported formats', () => {
    expect(validateFile({ type: 'image/webp' }, 'photo')).toBeNull();
    expect(validateFile({ type: 'image/svg+xml' }, 'photo')).toContain('non autorisé');
  });

  it('accepts supported document formats and rejects unsupported formats', () => {
    expect(validateFile({ type: 'application/pdf' }, 'document')).toBeNull();
    expect(validateFile({ type: 'image/png' }, 'document')).toContain('non autorisé');
  });
});

describe('FileUploadZone', () => {
  it('reports an invalid selected file without passing it to the form', () => {
    const onFileChange = vi.fn();
    const onError = vi.fn();
    const invalidFile = new File(['content'], 'vector.svg', { type: 'image/svg+xml' });

    const { container } = render(
      <FileUploadZone
        postType="photo"
        file={null}
        preview={null}
        onFileChange={onFileChange}
        onError={onError}
      />,
    );

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [invalidFile] },
    });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
    expect(onFileChange).not.toHaveBeenCalled();
  });

  it('passes a valid document to the form without an image preview', () => {
    const onFileChange = vi.fn();
    const onError = vi.fn();
    const documentFile = new File(['content'], 'cours.pdf', { type: 'application/pdf' });

    const { container } = render(
      <FileUploadZone
        postType="document"
        file={null}
        preview={null}
        onFileChange={onFileChange}
        onError={onError}
      />,
    );

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [documentFile] },
    });

    expect(onFileChange).toHaveBeenCalledWith(documentFile, null);
    expect(onError).not.toHaveBeenCalled();
  });
});
