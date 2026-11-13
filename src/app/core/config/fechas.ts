/** Las entradas del taller se interpretan siempre en Colombia, sin depender del PC. */
export function aUtcColombia(value: string): string {
  const date = new Date(`${value}:00-05:00`);
  if (!Number.isFinite(date.getTime())) throw new Error('Fecha no válida');
  return date.toISOString();
}
export function inputColombia(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return parts.replace(' ', 'T');
}
export function rangoSemana() {
  const inicio = new Date();
  const hasta = new Date(inicio.getTime() + 7 * 86400000);
  return { desde: inputColombia(inicio), hasta: inputColombia(hasta) };
}
export function siguienteFranja(): string {
  return inputColombia(new Date((Math.floor(Date.now() / 1800000) + 1) * 1800000));
}
export function rangoValido(desde: string, hasta: string): boolean {
  try {
    const delta = Date.parse(aUtcColombia(hasta)) - Date.parse(aUtcColombia(desde));
    return delta > 0 && delta <= 31 * 86400000;
  } catch {
    return false;
  }
}
