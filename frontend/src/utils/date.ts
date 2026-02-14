export function formatMemberSince(iso?: string) {
  if (!iso) return '';

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';


  const monthYear = new Intl.DateTimeFormat('es-UY', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC', 
  }).format(d);


  const s = monthYear.replace('.', '');
  const pretty = s ? s[0].toUpperCase() + s.slice(1) : s;

  return pretty;
}
