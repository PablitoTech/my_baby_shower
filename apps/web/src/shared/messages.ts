/**
 * Los mensajes de validación son claves de traducción. Si llevan parámetros
 * se codifican como `clave|{"param":valor}` y el componente FieldError los traduce.
 */
export function msg(key: string, params?: Record<string, unknown>): string {
  return params ? `${key}|${JSON.stringify(params)}` : key;
}

export function decodeMessage(message: string): { key: string; params?: Record<string, unknown> } {
  const [key, raw] = message.split('|', 2);
  if (!raw) return { key: key ?? message };
  try {
    return { key: key!, params: JSON.parse(raw) as Record<string, unknown> };
  } catch {
    return { key: key! };
  }
}
