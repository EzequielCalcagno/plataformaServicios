export function formatMemberSince(iso?: string) {
  if (!iso) return '';

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  // "feb 2025" (en es-UY / es-ES suele quedar igual)
  const monthYear = new Intl.DateTimeFormat('es-UY', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC', // clave: tu string termina en Z, así evitás corrimientos raros
  }).format(d);

  // A veces el mes viene con punto (ej: "feb.")
  const s = monthYear.replace('.', '');
  const pretty = s ? s[0].toUpperCase() + s.slice(1) : s;

  return pretty;
}
