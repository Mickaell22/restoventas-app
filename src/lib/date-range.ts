// Rangos de fecha para el historial y las tarjetas de totales.
// Se calculan en la zona horaria del telefono y se mandan al backend como
// instantes ISO (con offset); `sales.created_at` es timestamptz, asi que el
// servidor compara el mismo instante sin reinterpretar la zona.

export interface DateRange {
  from: string;
  to: string;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function toRange(from: Date, to: Date): DateRange {
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Desde las 00:00 hasta las 23:59:59.999 de hoy (hora local). */
export function todayRange(now: Date = new Date()): DateRange {
  return toRange(startOfDay(now), endOfDay(now));
}

/**
 * Semana en curso: desde el lunes 00:00 hasta el fin del dia de hoy.
 * ponytail: "semana" = semana calendario que empieza el lunes, no los ultimos
 * 7 dias; es lo que espera quien mira el corte del negocio.
 */
export function weekRange(now: Date = new Date()): DateRange {
  const monday = startOfDay(now);
  // getDay(): 0 = domingo. El domingo cuenta como fin de la semana que arranco
  // el lunes anterior, por eso retrocede 6 dias y no 0.
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return toRange(monday, endOfDay(now));
}
