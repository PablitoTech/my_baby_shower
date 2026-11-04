import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('genera hashes Argon2id con sal distinta y los verifica', async () => {
    const a = await service.hash('Secreta123');
    const b = await service.hash('Secreta123');
    expect(a).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    expect(a).not.toBe(b);
    expect(await service.verify(a, 'Secreta123')).toBe(true);
    expect(await service.verify(a, 'secreta123')).toBe(false);
  });

  it('devuelve false ante un hash inválido', async () => {
    expect(await service.verify('no-es-un-hash', 'x')).toBe(false);
  });
});
