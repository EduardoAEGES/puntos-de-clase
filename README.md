# Puntos de clase

App para dar puntos a los alumnos al estilo ClassDojo, con nota calculada, panel de la clase y página de notas por DNI. Los datos viven en un Google Sheets con Apps Script.

## Estructura

```
src/                  Código fuente (se edita aquí)
  index.html          Estructura de la página
  css/styles.css      Estilos
  js/util.js          Texto, fechas, coincidencia de nombres
  js/api.js           Conexión con Apps Script
  js/avatar.js        Avatares (DiceBear o iniciales)
  js/charts.js        Gráficos SVG
  js/ui.js            Íconos, hojas, avisos
  js/views/*.js       Una pantalla por archivo
  js/app.js           Estado, envío al servidor y arranque
apps-script/
  Code.js             Backend (hojas, cálculo de notas, PIN) — en Apps Script se llama Code.gs
  Index.html          Generado con `node build.js` — no editar a mano
dev/mock-gas.js       Simulador del Sheets para probar en local
demo/seed-demo.js     Cursos de la demo (y ejemplo del formato de Datos.js)
demo/relleno.js       Alumnos inventados: llenan la demo y los cursos vacíos de la app local
privado/Datos.js      Tus cursos y alumnos reales — fuera de Git
build-demo.js         Arma la demo pública en docs/
revisar-privacidad.js Busca datos reales en lo que se subiría (correr antes de cada push)
build.js              Junta src/ en apps-script/Index.html
```

## Publicar

1. Crea un Google Sheets nuevo. Ve a **Extensiones → Apps Script**.
2. Pega `apps-script/Code.js` en el archivo `Código.gs`.
3. Crea un segundo archivo de script llamado **Datos** y pega `privado/Datos.js`. Este archivo tiene tus cursos y alumnos reales; está en `.gitignore` y no se sube a GitHub. Si no lo tienes, copia el formato de `demo/seed-demo.js`.
4. Crea un archivo HTML llamado **Index** y pega `apps-script/Index.html`.
5. Elige la función `setup` y pulsa **Ejecutar**. Acepta los permisos. Se crean las hojas con las categorías, los pesos y lo que haya en el archivo Datos.
6. Ve a **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (lo necesita la página de notas por DNI)
7. Abre el enlace en tu celular, crea tu PIN y guárdalo en la pantalla de inicio.
8. La página de alumnos es el mismo enlace con `?v=notas` al final. Aparece en **Ajustes**.

Cada cambio en `src/` se publica así: `node build.js`, se pega el nuevo `Index.html` y se hace **Implementar → Gestionar implementaciones → Editar → Nueva versión**.

Si olvidas el PIN, ejecuta `resetPin` en el editor y crea uno nuevo al abrir la app.

## Probar en local

```bash
python dev/servidor.py
```

Abre `http://localhost:5500/src/index.html`. En **Ajustes → Cargar datos de prueba** se crean 8 sesiones al azar y los DNI 70000001 a 70000030.

## Demo pública (GitHub Pages)

```bash
node build-demo.js
```

Genera `docs/`, con HTML, CSS y JS separados. Usa 9 cursos con 5 alumnos inventados cada uno (`demo/seed-demo.js`), entra sin PIN y trae 8 sesiones de historial. Todo se guarda en el navegador de quien la abre. El build se detiene si encuentra un nombre real.

Para publicarla: sube el repositorio a GitHub y ve a **Settings → Pages → Deploy from a branch → main / docs**. La página de notas de la demo es `.../?v=notas`, con los DNI 70000001 a 70000045.

## Cómo se calcula la nota

`Nota = escala × Σ(peso × logro) ÷ Σ pesos`

- **Logro de un componente** = puntos de sus categorías ÷ (máximo por sesión × sesiones que cuentan), entre 0 % y 100 %.
- Por defecto: Puntualidad 30 %, Participación 40 % y Tareas 30 % (Tareas solo cuenta las sesiones con tarea).
- Los pesos, qué categoría suma en cada componente, la escala y la nota aprobatoria se editan en **Ajustes**. También se pueden editar en las hojas `Componentes`, `Categorias` y `Config`.
- La hoja `Notas` se rellena con **Panel → Actualizar hoja Notas** o desde el menú **Puntos** del Sheets.

## Hojas

| Hoja | Para qué |
|---|---|
| Cursos | Un curso por fila: hora de inicio, tolerancia y tope de participación |
| Alumnos | Clave interna, ID CERTUS, DNI, nombre, curso, equipo, avatar, apodos del chat y total (fórmula) |
| Equipos | Nombre y color por curso, con total (fórmula) |
| Categorias | Puntos y componente de la nota |
| Componentes | Pesos de la nota (`*` = todos los cursos) |
| Sesiones | Una fila por clase: tema, si hubo tarea y comentario |
| Registro | Cada movimiento; de aquí salen todos los totales |
| Notas | Resumen generado |
| Config | Ajustes generales |
