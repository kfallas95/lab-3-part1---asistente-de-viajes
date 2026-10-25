# Retrospectiva — Asistente de Viajes

---

## 1. Paso de Requerimientos a Diseño

**¿Qué decisiones técnicas (manejo de estado, división de componentes) tuvo que tomar la IA que no estaban escritas en el `requirements.md`?**

Al pasar de los requerimientos al diseño me di cuenta de que no solo había que tomar decisiones técnicas: también tuve que ajustar el `requirements.md` y el contrato de datos. Mis requerimientos decían **qué** tenía que hacer la app, pero dejaban vacíos que aparecían en cuanto se intentaba pensar **cómo** construirla.

Había varios conceptos que me hacían falta y los fui creando para cerrar esos vacíos. Por ejemplo:

- **Lo que le queda al cliente hoy** (`DailyFoodRemaining`), separado del límite diario, para que el cliente vea un solo número claro.
- **Un tope por gasto** (`ExpenseCap`), para que el cliente controle sus gastos grandes sin bloquearle un gusto ocasional.
- **El costo total real del viaje** (`TotalTripSpent`), porque si no se registraban los tiquetes y el hospedaje no se podía saber cuánto costó el viaje completo.
- **Los estados del viaje** (planificado, en curso, finalizado) y las funciones de **duplicar** y **eliminar** un viaje, que terminaron siendo requerimientos nuevos (REQ-F-19 y REQ-F-20).

También cambiamos cosas para que la app funcione mejor y no tenga errores:

- **Los montos se guardan en centavos.** El cliente sigue escribiendo $40.50, pero internamente se guarda 4050. Así se evitan los errores de decimales de JavaScript.
- **El día se reinicia a las 00:00.** Antes el corte era a las 08:00, y eso dejaba una franja de la madrugada en la que no estaba claro a qué día pertenecía un gasto. Ahora el día cambia a medianoche, y las 08:00 solo marcan cuándo aparece el resumen matutino.

En cuanto a lo técnico, la IA me propuso cómo organizar la app y yo revisé y aprobé cada propuesta:

- **Manejo de estado:** los datos se guardan en LocalStorage, y todo lo que se puede calcular (límites diarios, disponibles, totales) no se guarda, se calcula en el momento. Así no hay dos versiones del mismo dato que se contradigan.
- **División de componentes:** el wireframe original tenía todo en una sola página, y lo dividimos en pantallas con un solo propósito (Hoy, Itinerario, Gastos, Resumen, Ajustes), más componentes reutilizables como la confirmación única de gastos.
- **Organización en capas** y un **reloj central** para todas las reglas que dependen de la fecha de hoy.

Todo quedó registrado en el `CLAUDE.md` con el motivo de cada decisión. Al final el `requirements.md` pasó de la versión 5 a la 6, y el contrato de datos de la versión 1 a la 2.

---

## 2. Memoria Semántica

**¿Cómo afectó tener el archivo `CLAUDE.md` a la hora de que la IA propusiera los nombres de las funciones y componentes en el `design.md`?**

Tener el `CLAUDE.md` me obligó primero a ordenar el vocabulario del proyecto. Al empezar, tenía los nombres mezclados: mis entidades estaban en inglés (`Trip`, `Expense`, `DailyFoodLimit`), pero el contrato de datos del PDF estaba en español (`fecha_inicio`, `limite_diario_comida`). Decidí que todo el código, el contrato y los nombres del dominio fueran en **inglés**, y que la **interfaz quedara en español**, para que el cliente pueda leer la app en su idioma.

Con ese cambio también ajusté varios conceptos, porque algunos significaban lo mismo con nombres distintos:

- **Viaje** pasó a ser `Trip`, **Presupuesto** pasó a `GlobalBudget`, **Gasto** a `Expense`, **Actividad** a `Activity` y **AlertaPrevisionDiaria** a `DailyForecastAlert`.
- `presupuesto_final` y `monto_total` eran el mismo dato, así que quedó uno solo. Además, como es la suma de las categorías, ahora se calcula en lugar de guardarse.
- Las categorías quedaron como constantes en inglés (`FOOD`, `TRANSPORT`, `ACTIVITIES`, `OTHER`), y en pantalla se muestran en español (Comida, Transporte, Actividades, Otros).

Ahora todo tiene más sentido y es más directo: cada concepto tiene **un solo nombre** y significa una sola cosa. Por eso, cuando se armó el `design.md`, los nombres de las funciones y componentes ya salieron con ese vocabulario, sin tener que volver a discutirlos.


---

## 3. Poda Arquitectónica

**¿Tuviste que simplificar alguna propuesta sobreestructurada de la IA para mantener el diseño simple y legible?**

Sí. La IA me recomendó varias cosas que no se ajustaban a lo que yo quería ni a las reglas del curso:

- **Pruebas automatizadas.** Me recomendó agregar pruebas con Node.js y una herramienta de pruebas. Decidí no incluirlas y verificar la app de forma manual.
- **Tasa de cambio desde una API en línea.** Me recomendó obtener la tasa automáticamente desde un servicio externo. Como el curso no permite servicios externos, la tasa la ingresa el cliente.
- **Base de datos externa.** Entre las opciones, la IA me planteó usar una base de datos externa con backend. Decidí no usarla y quedarme con LocalStorage y un solo usuario por navegador, que es lo que pide el curso.
- **Viajes con fechas pasadas.** Me recomendó permitirlos para registrar viajes anteriores. No lo permití, porque a esos viajes les faltarían datos y podían causar errores en otras partes.

También simplificamos cosas que sobraban en el propio diseño. Por ejemplo, quitamos los límites diarios guardados, porque se pueden calcular en el momento, y eliminamos todo lo de "gastos fuera del viaje", porque con las demás reglas ese caso nunca podía pasar.

Lo más importante de este proceso fue que **pude guiar a la IA hacia lo que yo quería**. No acepté todo lo que proponía: cuestioné varias de sus decisiones y le pedí aclaraciones cuando algo no me convencía. Por ejemplo, cuando me propuso dos opciones para el límite diario, ninguna me convencía del todo, así que le expliqué mis dudas y terminamos con una solución intermedia. Tampoco dejé que tomara decisiones por su cuenta: cada propuesta tenía que pasar por mí, y solo se registraba en el `CLAUDE.md` cuando yo la aprobaba, junto con el motivo.
