// Alumnos inventados para ver la app con datos. Ninguno es real.
// La demo los reparte en sus 9 cursos; la app local los usa para llenar
// los cursos que aún no tienen alumnos (luego se reemplazan por los reales).
// Un bloque por curso: equipos con "apellidos|nombres".

const RELLENO_ALUMNOS = [
  { nombresEquipo: ['Halcones', 'Delfines'], equipos: [
    ['Quispe Mamani|Ana Lucía', 'Núñez Paredes|Diego Andrés', 'Salas Rojas|Camila'],
    ['Torres Vega|Mateo Alonso', 'Huamán Ccori|Valeria Sofía']] },
  { nombresEquipo: ['Cóndores', 'Pumas'], equipos: [
    ['Peña Castro|Sebastián', 'Flores Ramírez|Lucía Fernanda', 'Gutiérrez León|Joaquín'],
    ['Ñahui Condori|Rosa Elena', 'Mendoza Tapia|Gabriel']] },
  { nombresEquipo: ['Vicuñas', 'Colibríes'], equipos: [
    ['Vargas Soto|Daniela Paz', 'Chávez Lima|Adrián José', 'Muñoz Tello|Isabella'],
    ['Rojas Bravo|Nicolás', 'Cárdenas Ugarte|Fernanda']] },
  { nombresEquipo: ['Jaguares', 'Águilas'], equipos: [
    ['Espinoza Díaz|Samuel', 'Llanos Pérez|Mariana', 'Zúñiga Campos|Thiago'],
    ['Apaza Ticona|Renata', 'Ortiz Salazar|Bruno Iván']] },
  { nombresEquipo: ['Llamas', 'Zorros'], equipos: [
    ['Ñique Arana|Antonella', 'Ramos Quiroz|Emilio', 'Benites Arce|Ximena'],
    ['Cueva Palomino|Rodrigo', 'Lazo Herrera|Paula Andrea']] },
  { nombresEquipo: ['Osos', 'Lobos'], equipos: [
    ['Soria Yupanqui|Martín', 'Calle Ventura|Andrea', 'Bustamante Ochoa|Lucas'],
    ['Pinto Arévalo|Micaela', 'Delgado Sáenz|Tomás']] },
  { nombresEquipo: ['Delfines', 'Tiburones'], equipos: [
    ['Ugarte Mora|Sofía Belén', 'Cáceres Luna|Matías', 'Agüero Ponce|Valentina'],
    ['Huerta Silva|Franco', 'Navarro Ibáñez|Abril']] },
  { nombresEquipo: ['Halcones', 'Búhos'], equipos: [
    ['Tello Gamarra|Josué', 'Marín Cornejo|Daniela', 'Velarde Ruiz|Iker'],
    ['Paucar Choque|Milena', 'Saavedra Núñez|Óscar']] },
  { nombresEquipo: ['Pumas', 'Cóndores'], equipos: [
    ['Riveros Ayala|Gianella', 'Montes Ccahua|Piero', 'Olivares Peña|Lucero'],
    ['Zegarra Toro|Alonso', 'Vilca Mamani|Brenda Sofía']] }
];
