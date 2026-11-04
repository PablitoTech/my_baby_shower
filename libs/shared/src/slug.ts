/**
 * Convierte un texto en un fragmento apto para URL: minúsculas, sin tildes
 * y con guiones. Se usa como prefijo legible del enlace público; la parte
 * no predecible la añade el backend con un generador criptográfico.
 */
export function slugify(input: string, maxLength = 40): string {
  const slug = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'baby-shower';
}
