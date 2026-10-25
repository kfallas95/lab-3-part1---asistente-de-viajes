# Especificación de Requerimientos — Asistente de Viajes

| | |
|---|---|
| **Versión** | v6 (consolidada) |
| **Fecha** | 2026-10-24 |
| **Base** | `especificacion_de_requerimientos_v5.md` + ajustes y requerimientos nuevos aprobados por Kevin (`CLAUDE.md` §5.1 y §10) |
| **Sintaxis** | EARS (*Easy Approach to Requirements Syntax*) |

### Convenciones

- **(v5)** significa que el texto se conserva sin cambios desde la versión 5.
- **(v6)** significa que el texto fue ajustado y aprobado; se indica la decisión que lo justifica.
- **NUEVO** marca un requerimiento que no existía en v5.
- **Nota** aclara cómo se interpreta un requerimiento según las decisiones de `CLAUDE.md`, sin cambiar su texto.
- Los requerimientos no funcionales (§7) no estaban en v5. Se derivan de decisiones aprobadas y cada uno cita la suya.

---

## 1. Gestión de Presupuesto y Conversión

### REQ-F-01A (v6): Conversión de Divisa y Cálculo de Duración Total
* **Tipo:** Ubicuo / Evento
* **Disparador:** Guardado o modificación de la información general del viaje.
* **Precondición:** El viaje cuenta con fechas válidas.
* **Sintaxis EARS:**
  > **WHEN** el usuario guarde o modifique la información general del viaje, **IF** el presupuesto está ingresado en una divisa diferente a USD, **THEN** el sistema debe convertir los montos a USD aplicando la tasa de cambio **ingresada por el cliente** y calcular la duración total del viaje ($\text{Días Totales} = \text{Fecha Fin} - \text{Fecha Inicio} + 1$).
* **Cambio respecto a v5:** "tasa de cambio vigente" pasa a "tasa de cambio ingresada por el cliente" (D-063, D-064).
* **Nota:** la tasa se expresa como "1 USD = X {divisa}" y la conversión es `USD = monto ÷ X` (D-067). Los montos del presupuesto se guardan en la divisa original y su equivalente en USD se calcula (D-096).

### REQ-F-01B (v5): Distribución Presupuestaria por Categoría
* **Tipo:** Evento
* **Disparador:** Finalización del cálculo de conversión de divisa y días totales.
* **Precondición:** La duración del viaje es mayor a cero días.
* **Sintaxis EARS:**
  > **WHEN** el presupuesto consolidado en USD y los días totales del viaje sean confirmados, **THEN** el sistema debe calcular el límite diario de cada categoría dividiendo el monto asignado a dicha categoría entre los días totales del viaje.
* **Nota:** aplica a las categorías diarias: Comida, Transporte y Actividades (D-010). Es el caso del día 1 de la fórmula general de D-007.

---

## 2. Control de Saldos y Balance Diario

### REQ-F-02 (v6): Resumen Matutino de Disponibilidad
* **Tipo:** Evento con Hora / Evento
* **Disparador:** Llegada de las 08:00 AM (hora local), o primera apertura de la aplicación después de esa hora.
* **Precondición:** El viaje está en estado `IN_PROGRESS`.
* **Sintaxis EARS:**
  > **WHEN** sean las 08:00 AM de un día de viaje, **IF** la aplicación está abierta **AND** el recordatorio está activo (`isReminderActive`), **THEN** el sistema debe emitir una notificación del navegador con el saldo total disponible de la jornada y el desglose por categorías.

  > **WHEN** el cliente abra la aplicación por primera vez después de las 08:00 AM de un día de viaje, **IF** no se ha mostrado el resumen de ese día, **THEN** el sistema debe mostrarlo en pantalla, independientemente del estado del recordatorio.
* **Cambio respecto a v5:** sin backend no se puede garantizar una notificación con la app cerrada (D-034, D-035, D-036).

### REQ-F-03 (v6): Cálculo de Balance en Tiempo Real
* **Tipo:** Evento
* **Disparador:** Registro, edición o eliminación de un gasto.
* **Precondición:** La fecha del gasto está entre `startDate` y la fecha actual, sin pasar de `endDate`. El viaje está en estado `IN_PROGRESS` o `FINISHED`.
* **Sintaxis EARS:**
  > **WHEN** el cliente registre, modifique o elimine un gasto, **IF** el viaje está `IN_PROGRESS`, **THEN** el sistema debe recalcular y actualizar inmediatamente en pantalla el disponible de la categoría afectada para la jornada en curso.

  > **WHEN** el gasto corresponda a un día anterior, **IF** el viaje está `IN_PROGRESS`, **THEN** el sistema debe recalcular de inmediato el límite diario del día en curso y de los días siguientes según D-007, sin modificar los `DailyForecastAlert` ya generados.

  > **WHEN** el cliente registre, modifique o elimine un gasto, **IF** el viaje está `FINISHED`, **THEN** el sistema debe actualizar `TotalTripSpent`, sin modificar los `DailyForecastAlert` ya generados.
* **Cambio respecto a v5:** se permiten gastos de días anteriores y después del viaje (D-054, D-055, D-056, D-065).

### REQ-F-03B (v6): Traslado Dinámico de Saldos al Cambio de Día (Rollover)
* **Tipo:** Evento con Hora / Programado
* **Disparador:** Inicio de un nuevo día del viaje (00:00, hora local).
* **Precondición:** Existen días restantes en el itinerario del viaje.
* **Sintaxis EARS:**
  > **WHEN** inicie un nuevo día del viaje, **THEN** el sistema debe transferir automáticamente el sobrante no ejecutado o el déficit acumulado del día anterior repartiéndolo equitativamente entre los límites diarios de los días restantes.
* **Cambio respecto a v5:** el disparador pasa de "corte diario de las 08:00 AM" a "inicio de un nuevo día (00:00)", como consecuencia de D-100. Aprobado (D-109).
* **Nota:** se implementa con la fórmula de D-007, calculada bajo demanda (D-034).

---

## 3. Manejo de Excesos y Reglas de Interfaz

### REQ-F-04A (v5): Permisividad de Transacciones en Exceso de Presupuesto
* **Tipo:** Evento
* **Disparador:** Registro de un gasto que supera el saldo disponible actual de la categoría.
* **Precondición:** El usuario confirma la transacción.
* **Sintaxis EARS:**
  > **WHEN** el usuario registre un gasto que exceda el límite diario asignado a la categoría, **THEN** el sistema debe permitir guardar la transacción y reflejar un saldo disponible negativo en dicha categoría.
* **Nota:** la confirmación es única y reúne todos los motivos: tope, disponible, fondo y categoría (INV-15, D-015).

### REQ-F-04B (v5): Alerta Visual por Sobrecosto Presupuestario
* **Tipo:** Estado / Interfaz de Usuario
* **Disparador:** Existencia de saldo negativo en cualquier categoría o en el total del día.
* **Precondición:** La pantalla de balance activo está desplegada.
* **Sintaxis EARS:**
  > **WHILE** una categoría o el presupuesto diario presente un saldo disponible menor a cero, **THEN** la interfaz del sistema debe desplegar un indicador/alerta visual de sobrecosto en los componentes correspondientes.
* **Nota:** la alerta es solo visual; no se envían notificaciones por gasto (D-008).

---

## 4. Validaciones y Control de Entrada

### REQ-F-05 (v5): Validación de Inconsistencia en Fechas del Viaje
* **Tipo:** Regla de Negocio / Validación
* **Disparador:** Intento de guardado del rango de fechas del viaje.
* **Precondición:** Formulario de datos generales activo.
* **Sintaxis EARS:**
  > **WHEN** el usuario ingrese o edite las fechas del viaje, **IF** la fecha de inicio es posterior a la fecha de finalización ($\text{Fecha Inicio} > \text{Fecha Fin}$), **THEN** el sistema debe bloquear el guardado y mostrar un mensaje de error indicando la inconsistencia.
* **Nota:** se complementa con INV-28 (sin fechas de inicio pasadas al crear o duplicar), INV-29 (sin viajes superpuestos) y los bloqueos por estado (D-071, D-073).

### REQ-F-06 (v5): Control de Ingreso de Valores Numéricos Negativos
* **Tipo:** Regla de Negocio / Validación
* **Disparador:** Ingreso o edición de un valor monetario en presupuestos o gastos.
* **Precondición:** Campo de entrada numérico enfocado.
* **Sintaxis EARS:**
  > **WHEN** el usuario introduzca un monto menor o igual a cero ($\text{Monto} \le 0$) en un campo de presupuesto o gasto, **THEN** el sistema debe denegar el registro y notificar que solo se admiten valores numéricos positivos.
* **Nota:** también aplica a `ExpenseCap` (D-014) y a la tasa de cambio (INV-18). No aplica al costo estimado de actividades, que admite 0 (INV-22).

---

## 5. Reajustes por Modificación de Itinerario

### REQ-F-13A (v6): Gestión y Notificación de Actividades Fuera de Rango
* **Tipo:** Evento
* **Disparador:** Modificación del rango de fechas que acorta la duración del viaje.
* **Precondición:** Existen actividades en fechas que quedan fuera del nuevo rango.
* **Sintaxis EARS:**
  > **WHEN** el usuario confirme un nuevo rango de fechas más corto para el viaje, **THEN** el sistema debe identificar las actividades pertenecientes a las fechas excluidas, desasociarlas del itinerario activo y notificar al usuario el listado de elementos afectados.
* **Cambio respecto a v5:** se quitan los gastos, porque nunca pueden quedar fuera del rango (D-094).

### REQ-F-13B (v5): Recálculo de Cuota Diaria por Ajuste de Duración
* **Tipo:** Evento
* **Disparador:** Confirmación del cambio de rango de fechas del viaje.
* **Precondición:** El nuevo rango de fechas es válido.
* **Sintaxis EARS:**
  > **WHEN** se guarde exitosamente la modificación en la duración del viaje, **THEN** el sistema debe recalcular el límite diario por categoría distribuyendo el saldo total no ejecutado entre la nueva cantidad de días restantes.

---

## 6. Manejo de Categorías Especiales y Gestión de Viajes

### REQ-F-18 (v5): Imputación de Gastos en "Otros / Imprevistos"
* **Tipo:** Evento
* **Disparador:** Registro de un gasto asignado a la categoría secundaria "Otros / Imprevistos".
* **Precondición:** Existe fondo asignado a imprevistos.
* **Sintaxis EARS:**
  > **WHEN** el usuario confirme un gasto bajo la categoría "Otros / Imprevistos", **THEN** el sistema debe descontar el monto directamente del fondo global de reserva/imprevistos sin alterar los balances ni las cuotas diarias de las categorías principales.
* **Nota:** si el fondo no existe, la app pide crearlo en ese momento, también con el viaje `FINISHED` (D-031, D-098). Si el gasto deja el fondo en negativo, se pide confirmación (INV-19).

### REQ-F-19 (NUEVO): Duplicar Viaje
* **Tipo:** Evento
* **Disparador:** El cliente elige "Duplicar" sobre un viaje existente.
* **Precondición:** El viaje original existe (cualquier estado).
* **Sintaxis EARS:**
  > **WHEN** el cliente duplique un viaje e ingrese un nombre (prellenado como "Copia de {nombre original}", editable) y nuevas fechas válidas (REQ-F-05, con `startDate` ≥ hoy según INV-28 y sin cruce con otros viajes según INV-29), **THEN** el sistema debe crear un viaje nuevo, en el estado que corresponda a sus fechas, con los datos copiables definidos en D-057, recalculando la fecha de cada actividad a partir del nuevo `startDate`.

  > **WHEN** la duración del nuevo viaje sea menor que la del original, **THEN** el sistema debe copiar solo las actividades cuyo día relativo exista en el nuevo viaje y notificar al cliente el listado de las actividades excluidas.
* **Origen:** D-057, D-058, D-059, D-095, D-096.

### REQ-F-20 (NUEVO): Eliminar Viaje
* **Tipo:** Evento
* **Disparador:** El cliente elige "Eliminar" sobre un viaje.
* **Precondición:** El viaje existe (cualquier estado).
* **Sintaxis EARS:**
  > **WHEN** el cliente solicite eliminar un viaje, **THEN** el sistema debe mostrar una confirmación que indique que se eliminarán el viaje, su presupuesto, gastos, actividades y resúmenes, y que la acción no se puede deshacer.

  > **WHEN** el cliente confirme la eliminación, **THEN** el sistema debe eliminar el viaje y todos sus registros asociados, y liberar su rango de fechas.
* **Origen:** D-086, D-087.

---

## 7. Requerimientos No Funcionales (derivados de decisiones aprobadas)

| ID | Requerimiento | Origen |
|---|---|---|
| RNF-01 | Los datos se persisten exclusivamente en el LocalStorage del navegador; no hay backend ni autenticación. | D-001, D-016 |
| RNF-02 | La aplicación no consume servicios externos en tiempo de ejecución. | D-063 |
| RNF-03 | La interfaz es mobile-first y responsive. | D-060 |
| RNF-04 | Los cálculos monetarios se hacen en centavos enteros de USD, con redondeo mitad hacia arriba. | D-051, D-053 |
| RNF-05 | El código y el contrato de datos van en inglés; la interfaz, en español. | D-019 |
| RNF-06 | La lógica de dominio no accede directamente a LocalStorage; usa repositorios. | D-018, D-101 |
| RNF-07 | Lenguaje de implementación: JavaScript, sin framework de UI ni herramienta de build (módulos ES nativos servidos con un servidor local). | D-107, D-110, D-113 |

---

## 8. Historial de cambios

| Versión | Cambios |
|---|---|
| v5 | Especificación original de Kevin. |
| v6 | Ajustados: REQ-F-01A, REQ-F-02, REQ-F-03, REQ-F-03B y REQ-F-13A. Nuevos: REQ-F-19 y REQ-F-20. Agregados: notas de interpretación y requerimientos no funcionales. |
