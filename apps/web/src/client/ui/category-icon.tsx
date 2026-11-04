const ICONS: Record<string, string> = {
  HYGIENE: '🧴',
  CLOTHING: '👕',
  FEEDING: '🍼',
  FURNITURE: '🛏️',
  BATH: '🛁',
  SLEEP: '🌙',
  TOYS: '🧸',
  HEALTH: '🩺',
  OUTINGS: '🚼',
  OTHER: '🎁',
};
const TINTS = ['var(--c-pink)', 'var(--c-sky)', 'var(--c-mint)', 'var(--c-lavender)', 'var(--c-beige)'];

/** Ilustración de respaldo cuando un regalo no tiene imagen. */
export function CategoryIcon({ code }: { code: string }) {
  const index = Math.max(0, Object.keys(ICONS).indexOf(code));
  return (
    <span className="c-category-icon" aria-hidden="true" style={{ background: TINTS[index % TINTS.length] }}>
      {ICONS[code] ?? '🎁'}
    </span>
  );
}
