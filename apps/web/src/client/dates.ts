/** Convierte un valor de <input type="datetime-local"> a ISO 8601. */
export function localToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Convierte una fecha ISO al formato de <input type="datetime-local"> en hora local. */
export function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
