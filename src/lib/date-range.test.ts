// Self-check de los rangos de fecha, sin framework. Correr con:
//   npx tsx src/lib/date-range.test.ts
import assert from 'node:assert/strict';
import { todayRange, weekRange } from './date-range';

// Los rangos son locales, asi que se comparan contra Date locales (no strings
// UTC): el test debe pasar en cualquier zona horaria.
const local = (iso: string) => new Date(iso);

// Miercoles 22 de julio de 2026, 15:30 hora local.
const wed = local('2026-07-22T15:30:00');

const today = todayRange(wed);
assert.equal(new Date(today.from).getHours(), 0, 'today.from = 00:00 local');
assert.equal(new Date(today.from).getDate(), 22, 'today.from es el mismo dia');
assert.equal(new Date(today.to).getDate(), 22, 'today.to es el mismo dia');
assert.equal(
  new Date(today.to).getTime() - new Date(today.from).getTime(),
  86_400_000 - 1,
  'today cubre el dia entero',
);

// La semana del miercoles arranca el lunes 20.
const week = weekRange(wed);
assert.equal(new Date(week.from).getDate(), 20, 'lunes de esa semana');
assert.equal(new Date(week.from).getDay(), 1, 'from cae en lunes');
assert.equal(new Date(week.to).getTime(), new Date(today.to).getTime(),
  'week.to es el fin del dia de hoy');

// Un lunes es su propio inicio de semana.
const mon = local('2026-07-20T09:00:00');
assert.equal(new Date(weekRange(mon).from).getDate(), 20, 'lunes: no retrocede');

// El domingo cierra la semana que arranco el lunes anterior (no la siguiente).
const sun = local('2026-07-26T22:00:00');
assert.equal(new Date(weekRange(sun).from).getDate(), 20, 'domingo: lunes 20');

// Cruce de mes: el lunes queda en el mes anterior.
const thu = local('2026-08-06T12:00:00');
const crossing = new Date(weekRange(thu).from);
assert.equal(crossing.getMonth(), 7, 'agosto (0-indexado)');
assert.equal(crossing.getDate(), 3, 'lunes 3 de agosto');

console.log('OK date-range');
