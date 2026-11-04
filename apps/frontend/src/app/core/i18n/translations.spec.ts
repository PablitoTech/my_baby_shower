import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('archivos de traducción', () => {
  it('es.json y en.json tienen exactamente las mismas claves', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it('incluyen una traducción para cada código de error de la API', async () => {
    const { ERROR_CODES } = await import('@mbs/common');
    for (const code of Object.keys(ERROR_CODES)) {
      expect((es.errors as Record<string, string>)[code]).toBeTruthy();
      expect((en.errors as Record<string, string>)[code]).toBeTruthy();
    }
  });
});
