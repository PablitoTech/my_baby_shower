import { randomConfirmationCode, randomSlugSuffix, sha256 } from './crypto.js';

describe('crypto utils', () => {
  it('genera sufijos y códigos con el alfabeto esperado', () => {
    expect(randomSlugSuffix()).toMatch(/^[a-z2-9]{10}$/);
    expect(randomConfirmationCode()).toMatch(/^[A-Z2-9]{8}$/);
  });

  it('no repite identificadores públicos en 1000 generaciones', () => {
    const set = new Set(Array.from({ length: 1000 }, () => randomSlugSuffix()));
    expect(set.size).toBe(1000);
  });

  it('calcula SHA-256 en hexadecimal', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
