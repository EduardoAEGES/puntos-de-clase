// Datos inventados para la demo (y ejemplo del formato de privado/Datos.js).
// Ningún alumno es real. Columnas de curso:
// Código, Nombre, Sección/turno, NRC, Modalidad, Días, Hora inicio, Tolerancia, Tope participación, Plataforma

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

// Un bloque por curso: equipos con "apellidos|nombres"
const SEED_ALUMNOS = [
  { curso: 'ACP', nombresEquipo: ['Halcones', 'Delfines'], equipos: [
    ['Quispe Mamani|Ana Lucía', 'Núñez Paredes|Diego Andrés', 'Salas Rojas|Camila'],
    ['Torres Vega|Mateo Alonso', 'Huamán Ccori|Valeria Sofía']] },
  { curso: 'CYP', nombresEquipo: ['Cóndores', 'Pumas'], equipos: [
    ['Peña Castro|Sebastián', 'Flores Ramírez|Lucía Fernanda', 'Gutiérrez León|Joaquín'],
    ['Ñahui Condori|Rosa Elena', 'Mendoza Tapia|Gabriel']] },
  { curso: 'PL-M', nombresEquipo: ['Vicuñas', 'Colibríes'], equipos: [
    ['Vargas Soto|Daniela Paz', 'Chávez Lima|Adrián José', 'Muñoz Tello|Isabella'],
    ['Rojas Bravo|Nicolás', 'Cárdenas Ugarte|Fernanda']] },
  { curso: 'PL-V', nombresEquipo: ['Jaguares', 'Águilas'], equipos: [
    ['Espinoza Díaz|Samuel', 'Llanos Pérez|Mariana', 'Zúñiga Campos|Thiago'],
    ['Apaza Ticona|Renata', 'Ortiz Salazar|Bruno Iván']] },
  { curso: 'CONT', nombresEquipo: ['Llamas', 'Zorros'], equipos: [
    ['Ñique Arana|Antonella', 'Ramos Quiroz|Emilio', 'Benites Arce|Ximena'],
    ['Cueva Palomino|Rodrigo', 'Lazo Herrera|Paula Andrea']] },
  { curso: 'INV', nombresEquipo: ['Osos', 'Lobos'], equipos: [
    ['Soria Yupanqui|Martín', 'Calle Ventura|Andrea', 'Bustamante Ochoa|Lucas'],
    ['Pinto Arévalo|Micaela', 'Delgado Sáenz|Tomás']] },
  { curso: 'MAT', nombresEquipo: ['Delfines', 'Tiburones'], equipos: [
    ['Ugarte Mora|Sofía Belén', 'Cáceres Luna|Matías', 'Agüero Ponce|Valentina'],
    ['Huerta Silva|Franco', 'Navarro Ibáñez|Abril']] },
  { curso: 'EF-M', nombresEquipo: ['Halcones', 'Búhos'], equipos: [
    ['Tello Gamarra|Josué', 'Marín Cornejo|Daniela', 'Velarde Ruiz|Iker'],
    ['Paucar Choque|Milena', 'Saavedra Núñez|Óscar']] },
  { curso: 'EF-N', nombresEquipo: ['Pumas', 'Cóndores'], equipos: [
    ['Riveros Ayala|Gianella', 'Montes Ccahua|Piero', 'Olivares Peña|Lucero'],
    ['Zegarra Toro|Alonso', 'Vilca Mamani|Brenda Sofía']] }
];
