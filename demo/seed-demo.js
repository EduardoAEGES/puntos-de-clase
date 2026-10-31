// Cursos de la demo (y ejemplo del formato de privado/Datos.js). Los alumnos salen de demo/relleno.js.
// Columnas: Código, Nombre, Sección/turno, NRC, Modalidad, Días, Hora inicio, Tolerancia, Tope participación, Plataforma

const SEED_CURSOS = [
  ['ACP', 'Análisis de Costos y Presupuestos', 'Turno tarde', '', 'Presencial', 'Mar, Jue', '17:00', 15, 1, ''],
  ['CYP', 'Costos y Presupuestos', 'Turno noche', '', 'Virtual', 'Mié', '19:00', 15, 1, 'BigBlueButton'],
  ['PL-M', 'Pensamiento Lógico', 'Turno mañana', '', 'Presencial', 'Mar, Jue, Vie', '08:30', 15, 1, ''],
  ['PL-V', 'Pensamiento Lógico', 'Virtual', '', 'Virtual', 'Lun, Mié', '07:00', 15, 1, 'BigBlueButton'],
  ['CONT', 'Contabilidad', 'Turno noche', '', 'Virtual', 'Lun', '19:00', 15, 1, 'BigBlueButton'],
  ['INV', 'Investigación Cuantitativa', 'Turno tarde', '', 'Presencial', 'Mar, Mié', '14:30', 15, 1, ''],
  ['MAT', 'Matemática Aplicada', 'Turno mañana', '', 'Presencial', 'Lun, Jue', '10:45', 15, 1, ''],
  ['EF-M', 'Experiencia Formativa', 'Turno mañana', '', 'Presencial', 'Jue', '07:00', 15, 1, ''],
  ['EF-N', 'Experiencia Formativa', 'Turno noche', '', 'Presencial', 'Vie', '18:15', 15, 1, '']
];

// Formato de cada bloque: { curso, nombresEquipo: [...], equipos: [["apellidos|nombres", ...], ...] }
const SEED_ALUMNOS = RELLENO_ALUMNOS.map((b, i) => Object.assign({ curso: SEED_CURSOS[i][0] }, b));
