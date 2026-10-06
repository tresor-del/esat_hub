import { beforeEach, describe, expect, it } from 'vitest';
import { rebuildName } from './utils';

describe('teacher helper utils', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  it('returns the desktop label for PREPA_1', () => {
    expect(rebuildName('PREPA_1')).toBe('Cycle Prépa. Première Année');
  });

  it('returns the mobile label for INGE_2', () => {
    window.innerWidth = 500;
    expect(rebuildName('INGE_2')).toBe('Cycle Ingé. 2eme Année');
  });

  it('returns undefined for unsupported names', () => {
    expect(rebuildName('UNKNOWN')).toBeUndefined();
  });
});
