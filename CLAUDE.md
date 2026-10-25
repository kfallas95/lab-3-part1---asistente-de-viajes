# CLAUDE.md — Memoria semántica del proyecto

> Fuente de verdad para cualquier agente o colaborador que trabaje en este proyecto.
> Solo se registra lo definido por el autor del proyecto o lo que aparece en los artefactos fuente.
> Cada dato indica su origen. Lo no definido se marca **PENDIENTE** y no se asume.

**Etiquetas de origen:** `[Autor]` decisión del autor · `[REQ-F-xx]` `docs/requirements.md` · `[PDF §n]` documento "Lab 1 propuesta de viajes".

---

## 1. Contexto del proyecto

- **Producto:** aplicación web **"Asistente de Viajes"** D-114. (El PDF lo llamaba "Asistente de Viajes IA" `[PDF §1]`.)
- **Sin inteligencia artificial.** El sistema no incluye ninguna funcionalidad de IA. D-033, D-114
- **Alcance:** planificación previa de viajes, parámetros reutilizables para múltiples itinerarios, ajustes dinámicos en tiempo real durante el viaje y prevención presupuestaria diaria mediante notificaciones. `[PDF §1]`
- **Metodología:** Spec Driven Development (SDD). Se especifica y aprueba antes de implementar. `[Autor]`

### Artefactos fuente

| Artefacto | Rol |
|---|---|
| `docs/requirements.md` | Especificación de requerimientos en sintaxis EARS (D-108). |
| `Lab 1 propuesta de viajes.pdf` | Alcance, prioridades, contrato de datos, wireframe |
| `docs/design.md` | Documento de diseño: arquitectura, módulos, manejo de estado y trazabilidad REQ → diseño. |
| `docs/data-contract.json` | Contrato de datos en formato JSON Schema, con validaciones y ejemplos. |
| `docs/wireframe.md` | Wireframes de las pantallas definidas (celular y computadora). |
| `README.md` | Resumen del proyecto, tecnología, estructura y cómo ejecutar. |
| `retrospective.md` | Respuestas a las preguntas de reflexión del curso. |
| Boceto visual (imagen de 4 pantallas) | **Solo referencia visual.** Contiene elementos ajenos al proyecto; no es fuente de requisitos. `[Autor]` |

---

## 2. Reglas de colaboración (obligatorias para el agente)

1. **No inventar información.** Todo contenido debe venir del autor o de los artefactos fuente.
2. **Preguntar ante cualquier vacío** antes de asumir. Las propuestas se marcan `PROPUESTA — pendiente de aprobación`.
3. **El autor toma las decisiones.** El agente presenta opciones con trade-offs; el autor elige.
4. **Trazabilidad.** Toda decisión se registra en la sección 10.
5. **Lenguaje ubicuo.** Usar exactamente los términos de la sección 3. No crear sinónimos.
6. **Idioma (D-019).** Código, contrato de datos y lenguaje ubicuo en **inglés**. Interfaz de usuario (textos, mensajes, notificaciones) en **español**.
7. **Conflictos entre fuentes** se registran en la sección 11 y no se resuelven sin el autor.

---

## 3. Lenguaje ubicuo

### 3.1 Entidades

| Término | En el contrato de datos | Significado |
|---|---|---|
| `Trip` | Entidad | Viaje (D-020) |
| `GlobalBudget` | Entidad | Presupuesto del viaje (D-020) |
| `DailyFoodLimit` | — (calculado, no persistido; D-097) | Límite del día de Comida (D-007) |
| `DailyFoodRemaining` | — (calculado, no persistido) | Disponible del día de Comida (D-009) |
| `DailyTransportLimit` / `DailyTransportRemaining` | — (ambos calculados, D-097) | Límite y disponible del día de Transporte (D-010) |
| `DailyActivitiesLimit` / `DailyActivitiesRemaining` | — (ambos calculados, D-097) | Límite y disponible del día de Actividades (D-010) |
| `TotalTripSpent` | — (calculado, no persistido) | Costo total real del viaje (D-042) |
| `ExpenseCap` | `GlobalBudget.foodExpenseCap` / `transportExpenseCap` / `activitiesExpenseCap` | Tope por gasto individual, por viaje y por categoría diaria |
| `Expense` | Entidad | Gasto registrado (D-020) |
| `Activity` | Entidad | Actividad del itinerario (D-020) |
| `DailyForecastAlert` | Entidad | Resumen matutino del día (D-020) |

**Convención de nombres (D-020):** entidades en `PascalCase`; campos en `camelCase`; valores de enumeración en `UPPER_SNAKE_CASE`.

### 3.2 Categorías de gasto

| Grupo | Constante (código) | Etiqueta (UI) | Origen |
|---|---|---|---|
| Prioridad alta (uso diario) | `FOOD`, `TRANSPORT`, `ACTIVITIES` | Comida, Transporte, Actividades | `[PDF §2]` · D-020 |
| Prioridad secundaria (logística previa) | `TICKETS`, `LODGING` | Tiquetes, Hospedaje | `[PDF §2]` · D-020. Solo montos de presupuesto; no son categoría de `Expense` (D-037, D-038). |
| Categoría especial | `OTHER` | Otros / Imprevistos (fondo global de reserva) | `[REQ-F-18]` · D-020 |

### 3.3 Estados del viaje

| Constante (código) | Etiqueta (UI) | Origen |
|---|---|---|
| `PLANNED` | Planificado | D-029 |
| `IN_PROGRESS` | En curso | `[REQ-F-02]` · D-029 |
| `FINISHED` | Finalizado | D-029 |

Transiciones automáticas por fecha local del cliente (D-032):
- `PLANNED` → `IN_PROGRESS`: al llegar `startDate`.
- `IN_PROGRESS` → `FINISHED`: al día siguiente de `endDate`.

---

## 4. Invariantes y reglas del dominio

| ID | Regla | Origen |
|---|---|---|
| INV-01 | Un monto de presupuesto o gasto debe ser **> 0**. Si es ≤ 0 (negativo o cero) se deniega y se notifica que solo se admiten valores positivos. | `[REQ-F-06]` — D-006 |
| INV-02 | Campos vacíos se rechazan (validación estricta). Campos opcionales (única excepción): `Trip.preferences`, `GlobalBudget.ticketsAmount`, `lodgingAmount`, `otherReserveAmount`, `Activity.type`. | D-025, D-041, D-043, D-044, D-045 |
| INV-03 | `Fecha Inicio ≤ Fecha Fin`. Si no, se bloquea el guardado con mensaje de error. | `[REQ-F-05]` |
| INV-04 | `Días Totales = Fecha Fin − Fecha Inicio + 1` | `[REQ-F-01A]` |
| INV-05 | Todos los registros financieros se procesan y unifican en **USD**. Montos de presupuesto y de gastos en otra divisa se convierten con la tasa ingresada por el cliente (INV-18). | `[PDF §3]` `[REQ-F-01A]` — D-022, D-063 |
| INV-06 | `Límite Diario (categoría) = Monto asignado a la categoría / Días Totales` | `[REQ-F-01B]` |
| INV-07 | `Daily{Categoría}Remaining = Daily{Categoría}Limit − Gastos de la categoría del día`. Se recalcula al registrar, editar o eliminar un gasto (incluidos gastos de días anteriores, D-054). | `[REQ-F-03]` — D-007, D-054 |
| INV-08 | Un gasto que excede el límite **se permite** (con confirmación del usuario) y el disponible queda negativo. | `[REQ-F-04A]` |
| INV-09 | Mientras un disponible (categoría o día) sea < 0, la UI muestra alerta visual de sobrecosto. | `[REQ-F-04B]` |
| INV-10 | **Rollover:** el sobrante o déficit del día anterior se reparte equitativamente entre los límites diarios de los días restantes. Se implementa con la fórmula de D-007, calculada bajo demanda (D-034). El día cambia a las 00:00 (D-100). | `[REQ-F-03B]` — D-007, D-034, D-100 |
| INV-11 | Al acortar el rango de fechas: las **actividades** fuera del rango se desasocian (`isDetached = true`) y se notifica el listado. Los gastos nunca quedan fuera del rango (D-055 + D-071). | `[REQ-F-13A]` — D-094 |
| INV-12 | Tras cambiar la duración: límite diario por categoría = saldo total no ejecutado / nueva cantidad de días restantes. | `[REQ-F-13B]` |
| INV-13 | Gastos en "Otros / Imprevistos" se descuentan del fondo global de reserva sin alterar balances ni cuotas de las categorías principales. | `[REQ-F-18]` |
| INV-14 | **`ExpenseCap` (tope por gasto individual):** obligatorio, definido por viaje, uno para cada categoría diaria (Comida, Transporte, Actividades). Si el cliente registra un gasto mayor al `ExpenseCap` de su categoría, el sistema le pide confirmación en pantalla (sin notificación, D-008). Debe ser > 0 (INV-01), puede ser mayor que `Daily{Categoría}Limit` y es editable durante el viaje. | D-012, D-013, D-014 |
| INV-15 | **Confirmación única:** todos los motivos de confirmación de una operación se muestran en **un solo** aviso que los enumera. Motivos posibles: gasto mayor al `ExpenseCap` (INV-14); `Daily{Categoría}Remaining` de hoy queda negativo (D-065); fondo de imprevistos queda negativo (INV-19); monto de categoría por debajo de lo ya gastado (D-079). Si el cliente confirma, se guarda (INV-08); si cancela, no se registra. | D-015, D-031, D-065, D-079 |
| INV-16 | `totalAmount` (derivado, no persistido; D-115) = suma de los montos por categoría (en divisa original; su equivalente USD = total ÷ `exchangeRate`); el cliente no lo edita. Si el cliente cambia la tasa del presupuesto, todo el presupuesto se reconvierte; los gastos conservan su propia tasa. | D-024, D-096 |
| INV-17 | `otherReserveAmount`, `ticketsAmount` y `lodgingAmount` son **opcionales** (excepción a INV-02). Si se ingresan, deben ser > 0 (INV-01). `otherReserveAmount` se puede crear o ajustar durante el viaje; `ticketsAmount` y `lodgingAmount` no (D-039). Cualquier cambio recalcula `totalAmount` (INV-16). | D-025, D-028, D-041 |
| INV-18 | **Tasa de cambio (D-063, D-064):** la ingresa manualmente el cliente; no se usan servicios externos. Debe ser > 0. Se maneja por viaje y por divisa: al registrar un monto en otra divisa, el campo se prellena con la última tasa usada en ese viaje para esa divisa (derivada de los registros existentes, sin campo nuevo) y es editable; la tasa editada pasa a ser la predeterminada. Montos en USD no piden tasa; se guardan con `originalCurrency = "USD"`, `originalAmount` = monto y `exchangeRate = 1` (D-099). **Formato: "1 USD = X {divisa}"**; conversión `USD = monto ÷ X` (D-067). La tasa usada se registra en `exchangeRate`. | D-063 (reemplaza D-030) |
| INV-19 | **Gasto `OTHER` (D-031):** si no existe fondo de imprevistos, la app pide crearlo en ese momento. Si el gasto deja el fondo en negativo, se pide confirmación (mismo criterio que INV-15) y se permite. | D-031 |
| INV-20 | `TotalTripSpent = ticketsAmount + lodgingAmount + Σ Expense.amount` (montos opcionales nulos cuentan como 0). Se calcula bajo demanda; no se persiste. | D-042 |
| INV-21 | `Activity.endTime` debe ser estrictamente posterior a `Activity.startTime`. | D-047 |
| INV-22 | `Activity.estimatedCost` debe ser **≥ 0** (se admite 0 para actividades gratuitas). Excepción explícita a INV-01, que aplica solo a presupuestos y gastos. | D-049 |
| ~~INV-23~~ | **Obsoleta por D-094:** ningún gasto puede quedar fuera del rango, por lo que no hay gastos desasociados que decidir. | D-094 |
| INV-24 | **Planificado vs presupuesto de Actividades:** la UI muestra la suma de `estimatedCost` de las actividades no desasociadas frente a `activitiesTotal`. Si la suma lo supera, se muestra una alerta visual; no se bloquea. | D-050 |
| INV-25 | **Precisión monetaria:** montos en USD como centavos enteros. Se muestran con 2 decimales. Las divisiones (límite diario) y conversiones de divisa se redondean al centavo; la tasa no se redondea. Regla: mitad hacia arriba (D-053). El residuo de redondeo se corrige solo con el recálculo diario de D-007. | D-051 |
| INV-26 | Los `DailyForecastAlert` ya generados son inmutables: correcciones posteriores de gastos no los modifican. | D-054 |
| INV-27 | **Edición de montos por categoría durante el viaje:** al cambiar `foodTotal`, `transportTotal` o `activitiesTotal`, el límite diario de esa categoría se recalcula de inmediato desde hoy (D-007). `totalAmount` se recalcula (INV-16). | D-065 |
| INV-28 | Al **crear** o **duplicar** un viaje, `startDate` debe ser ≥ fecha actual. No se permiten viajes con fechas pasadas. Si `startDate` = hoy, el viaje se crea en `IN_PROGRESS` (D-032). | D-069 |
| INV-29 | **Sin viajes superpuestos:** dos viajes no pueden tener rangos de fechas que se crucen. Se valida al crear, duplicar y cambiar fechas, con mensaje "Estas fechas se cruzan con tu viaje a {place} ({fechas})". | D-084 |

### `DailyFoodLimit` y disponible del día (D-007)

Se separan dos conceptos:

| Concepto | Significado | Cuándo se calcula | Fórmula |
|---|---|---|---|
| `DailyFoodLimit` | Cuánto puede gastar hoy en Comida | Al iniciar el día (00:00, D-100) y cada vez que cambian los gastos de días anteriores o el monto de la categoría (D-065). **No cambia por los gastos de hoy.** | `(Total Comida − Gastado en días anteriores) / Días restantes (incluido hoy)` |
| `DailyFoodRemaining` | Cuánto le queda hoy | En cada registro, edición o eliminación de gasto | `DailyFoodLimit − Gastos de Comida del día` |

- **Mismo esquema para Transporte y Actividades (D-010):** `Daily{Categoría}Limit` y `Daily{Categoría}Remaining` con las mismas fórmulas, usando el total y los gastos de cada categoría.
- La fórmula del límite es matemáticamente equivalente a INV-06 (día 1), INV-10 (rollover) e INV-12 (cambio de fechas), así que las unifica.
- El disponible puede ser negativo (INV-08) y activa la alerta visual (INV-09).
- **Ejemplo:** Comida $500, 5 días. Día 1: límite 500/5 = $100; gasta $70 → disponible $30. Día 2: límite 430/4 = $107.50.

- **Recalculo inmediato (D-065):** si hoy se registra/edita un gasto de un día anterior, o se edita el monto total de la categoría, el límite de hoy se recalcula de inmediato. Ej.: día 2 con límite $107.50; se registra una cena olvidada de $40 del día 1 → límite de hoy = 390/4 = $97.50.

Antecedente: la fórmula original (D-003), `(Total Comida / Días Totales) − Acumulado del día`, se refina con D-007.

---

## 5. Reglas temporales

| Regla | Origen |
|---|---|
| Resumen matutino de disponibilidad: ver REQ-F-02 en `docs/requirements.md`. | `[REQ-F-02]` |
| Ejemplo de mensaje: *"¡Buenos días! Para hoy en Roma tienes disponible: $50 en Comida, $15 en Transporte y $40 en Actividades. Total disponible hoy: $105 USD."* | `[PDF §4]` |
| ~~El corte diario (rollover) ocurre a las 08:00 AM~~ → **el día cambia a las 00:00** (hora local) para límites, estado del viaje y fechas de gastos; las 08:00 solo determinan cuándo se muestra el resumen (D-100). | `[REQ-F-03B]` — D-100 |
| **Mecanismo de entrega (D-034, opción C):** si la app está abierta a las 08:00, se emite una notificación del navegador (requiere permiso del cliente); si está cerrada, el resumen del día se muestra en pantalla la primera vez que el cliente abre la app después de las 08:00. | D-034 |
| **Rollover calculado bajo demanda:** el límite del día no depende de un proceso que corra a las 08:00; se calcula con la fórmula de D-007 a partir de la fecha y los gastos registrados cuando la app se abre o está activa. | D-007, D-034 |
| Motivo: sin backend (D-016) no es posible garantizar notificaciones con la app cerrada. Si en el futuro hay backend, se reevalúa. | D-034 |
| El recordatorio se activa/desactiva (ON/OFF). | `[PDF §6]` |

### 5.1 Requerimientos

La especificación completa y vigente está en **`docs/requirements.md`** (sintaxis EARS), incluidos REQ-F-19 (Duplicar viaje) y REQ-F-20 (Eliminar viaje).

---

## 6. Contrato de datos

### 6.1 Contrato de datos (D-027)

Versión formal en `docs/data-contract.json`. Cálculos siempre en USD (INV-05, D-022), **expresados en centavos enteros** (D-051): `4050` = $40.50. Se guardan en centavos USD: `Expense.amount`, `Activity.estimatedCost`, `DailyForecastAlert`. Los montos de `GlobalBudget` se guardan en su divisa original y se derivan a centavos USD (D-096). `exchangeRate` se guarda con todos sus decimales. `Expense.originalAmount` se guarda en decimal tal como lo ingresa el cliente (solo referencia, no entra en cálculos; D-052). `Activity.estimatedCost` en USD por `[PDF §3]` (todos los registros financieros en USD). Fechas `YYYY-MM-DD`, horas `HH:MM`, IDs UUID.

```jsonc
// Trip
{
  "id": "uuid",
  "name": "string",
  "place": "string",
  "country": "string",
  "startDate": "date",
  "endDate": "date",
  "preferences": "string | null",   // OPCIONAL (D-045)
  "status": "TripStatus",            // PLANNED | IN_PROGRESS | FINISHED (D-029)
  "isReminderActive": "boolean"      // D-023, D-026 — valor inicial: true (D-068)
}

// GlobalBudget  (1 por Trip)
{
  "id": "uuid",
  "tripId": "uuid",
  "originalCurrency": "string",      // REQ-F-01A
  "exchangeRate": "number",          // REQ-F-01A — ingresada por el cliente (D-063); unidades de originalCurrency por 1 USD (D-067); 1 si USD (D-099)
  // Montos del presupuesto en originalCurrency, decimal tal como los ingresa el cliente (D-096).
  // Su equivalente en USD (centavos) se deriva: monto ÷ exchangeRate, redondeo ½↑ (INV-25).
  "foodTotal": "number",             // D-007, D-024
  "transportTotal": "number",
  "activitiesTotal": "number",
  "ticketsAmount": "number | null",  // OPCIONAL (D-041)
  "lodgingAmount": "number | null",  // OPCIONAL (D-041)
  "otherReserveAmount": "number | null",   // REQ-F-18 — OPCIONAL (D-025), editable durante el viaje (D-028) y en FINISHED solo desde el aviso de D-031 (D-098)
  "foodExpenseCap": "number",        // D-013
  "transportExpenseCap": "number",
  "activitiesExpenseCap": "number"
}

// Activity
{
  "id": "uuid",
  "tripId": "uuid",
  "title": "string",
  "type": "string | null",           // OPCIONAL (D-044); texto libre (D-111)
  "date": "date",
  "dayNumber": "number",
  "startTime": "time",
  "endTime": "time",
  "location": "string",
  "estimatedCost": "number",         // ≥ 0 (D-049)
  "isDetached": "boolean"            // REQ-F-13A
}

// Expense
{
  "id": "uuid",
  "tripId": "uuid",
  "amount": "number",                // en USD (D-022, D-026)
  "originalAmount": "number",        // D-026
  "originalCurrency": "string",      // D-026
  "exchangeRate": "number",          // D-026 — unidades de originalCurrency por 1 USD (D-067)
  "category": "ExpenseCategory",     // FOOD | TRANSPORT | ACTIVITIES | OTHER (D-020, D-038)
  "concept": "string",
  "date": "date"
}

// DailyForecastAlert  (1 por Trip por día)
{
  "id": "uuid",
  "tripId": "uuid",
  "date": "date",
  "generatedAt": "datetime",         // momento real de generación (D-100); reemplaza sendTime
  "availableTodayFood": "number",
  "availableTodayTransport": "number",
  "availableTodayActivities": "number",
  "totalAvailableToday": "number",
  "assistantMessage": "string"        // texto generado con plantilla fija (D-033)
}
```

**No se persisten** (se calculan en el momento): `DailyFoodRemaining`, `DailyTransportRemaining`, `DailyActivitiesRemaining` (D-007, D-010), `TotalTripSpent` (D-042), `totalAmount` (D-115), `DailyFoodLimit`, `DailyTransportLimit`, `DailyActivitiesLimit` (D-097), equivalentes en USD de los montos de `GlobalBudget` (D-096).


---

## 7. Interfaz (wireframe `[PDF §6–7]`)

| Sección del wireframe | Propósito | Mapeo (contrato de datos) |
|---|---|---|
| Mi Viaje / Parámetros | Guardar y reutilizar datos de viajes | `Trip.place`, `country`, `startDate`… |
| Recordatorio | Activar/desactivar alarma matutina | `Trip.isReminderActive` (D-023) |
| Itinerario (Simulación por días) | Itinerario editable diario | `Activity.dayNumber`, `estimatedCost` |
| Presupuestos (Categorías) | Límites diarios vs. logísticos | `Daily*Limit` (calculados) / `ticketsAmount`, `lodgingAmount` |

Navegación del wireframe: `[ Itinerario ]` `[ Resumen B ]` — era solo un ejemplo `[Autor]`; la navegación se redefine (Q-07). Plataforma: mobile-first y responsive (D-060).

### 7.1 Arquitectura de navegación (D-061)

```
Mis viajes (lista, crear, duplicar)
  └─ [Viaje]
       ├─ Hoy         balance del día por categoría, alertas, resumen matutino
       ├─ Itinerario  actividades por día, planificado vs presupuesto (D-050)
       ├─ Gastos      historial por día, editable (D-054)
       ├─ Resumen     TotalTripSpent vs totalAmount, por categoría, imprevistos
       ├─ (+)         acción principal: registrar gasto
       └─ Ajustes     datos, fechas, presupuesto, recordatorio
```

- **Pestaña inicial según estado:** `PLANNED` → Itinerario · `IN_PROGRESS` → Hoy · `FINISHED` → Resumen.
- **Celular:** barra de navegación inferior + botón flotante (+).
- **Computadora:** menú lateral; el contenido aprovecha el ancho (p. ej. tarjetas en columnas). Mismas pantallas y contenido.

### 7.2 Pantalla "Hoy" (D-062)

Orden del contenido (`IN_PROGRESS`):
1. Encabezado: lugar y "Día X de N".
2. Resumen matutino (REQ-F-02): tarjeta cerrable, una vez al día.
3. Total disponible hoy: suma de `Daily{Categoría}Remaining`, con "de" la suma de `Daily{Categoría}Limit`.
4. Tarjeta por categoría diaria (Comida, Transporte, Actividades): número principal "Te quedan $X", secundario "de $Y", barra de progreso. Si es negativo: rojo + alerta (REQ-F-04B).
5. Actividades de hoy: lista corta (hora + título).

Ejemplo: Comida "Te quedan $30.00 de $50.00" · Transporte "Te quedan −$5.00 de $15.00" ⚠ · Actividades "Te quedan $40.00 de $40.00" → Total "$65.00 de $105.00".

No incluye `TotalTripSpent` ni el fondo de imprevistos (pertenecen a Resumen).

Según estado:
- `PLANNED`: "Tu viaje comienza en X días" + límite diario que tendrá cada categoría.
- `FINISHED`: "Tu viaje terminó" + enlace a Resumen.



### 7.3 Pantalla "Mis viajes" (D-085)

- Agrupada por estado: **En curso** (máximo uno, INV-29) · **Planificados** (fecha más próxima primero) · **Finalizados** (más reciente primero).
- Tarjeta: `name` · `country` · rango de fechas · dato según estado: "Día X de N" (`IN_PROGRESS`), "en X días" (`PLANNED`), "Gastaste ${TotalTripSpent}" (`FINISHED`).
- Acciones: [+ Nuevo] (flujo 8.2) · menú ⋯ por viaje: Duplicar (REQ-F-19), Eliminar (8.9).
- Estado vacío: "Aún no tienes viajes" + botón para crear el primero.


### 7.4 Pantalla "Itinerario" (D-088, D-089)

- Encabezado: "Planificado ${Σ estimatedCost de actividades no desasociadas} de ${activitiesTotal}" con barra (INV-24); rojo + alerta si se excede (D-050).
- Pestañas por día (Día 1, Día 2…). Pestaña inicial: hoy si `IN_PROGRESS`; si no, Día 1.
- Lista del día ordenada por `startTime`: horario · `title` · `location` · `estimatedCost`.
- Botón "+ Agregar actividad" (flujo 8.6).
- Sección plegable **"Fuera del viaje (N)"** al final: actividades con `isDetached = true`. El cliente puede eliminarlas o cambiarles la fecha a un día válido; al hacerlo vuelven al itinerario (`isDetached = false`). Si no hace nada, quedan guardadas sin afectar cálculos (D-089).


### 7.5 Pantalla "Gastos" (D-090)

- Filtro por categoría con chips: Todos · Comida · Transporte · Actividades · Otros.
- Agrupados por día (más reciente primero) con total del día.
- Cada gasto: ícono de categoría · `concept` · monto USD. Si divisa ≠ USD: `originalAmount` + tasa usada ("1 USD = X {divisa}").
- Tocar un gasto → editar (8.4) o eliminar (8.5).


### 7.6 Pantalla "Resumen" (D-091)

- Encabezado: `TotalTripSpent` "de" `totalAmount` planificado; "Te quedan $X" o "Te pasaste $X" en rojo.
- Por categoría: Comida, Transporte, Actividades con "Gastado / Planificado" y barra (rojo + alerta si se excede); Tiquetes y Hospedaje como montos fijos sin barra (D-037).
- Fondo de imprevistos: "Usado $X de $Y · Quedan $Z" (INV-13). Oculto si no hay fondo (D-025).
- `PLANNED`: solo presupuesto planificado por categoría (sin "Gastado"). `IN_PROGRESS` / `FINISHED`: completo.
- Ejemplo coherente: planificado 350 + 75 + 200 + 450 + 200 + 100 = $1 375; gastado 310 + 95 + 140 + 450 + 200 + 45 = $1 240 → "Te quedan $135".


### 7.7 Pantalla "Ajustes" (D-092, D-093)

- Opciones, cada una en su propia pantalla: Datos del viaje (`name`, `place`, `country`, `preferences`) · Fechas (8.3) · Presupuesto (8.7) · Recordatorio matutino ON/OFF (D-023, D-035).
- Acciones: Duplicar viaje (REQ-F-19) · Eliminar viaje (REQ-F-20, en rojo). También disponibles en el menú ⋯ de "Mis viajes".
- Los datos del viaje son editables en todos los estados, incluido `FINISHED` (D-093); los `DailyForecastAlert` ya generados conservan su texto (INV-26).

---

## 8. Flujos de datos

### 8.1 Registrar gasto (D-066)

```
[Cliente toca (+)]
 0. Precondición: viaje IN_PROGRESS o FINISHED (REQ-F-03).
    PLANNED → botón (+) desactivado: "Podrás registrar gastos cuando inicie tu viaje".
 1. Formulario: monto, divisa, tasa (solo si divisa ≠ USD, prellenada; D-064), categoría, concepto, fecha.
 2. Validación estricta — si falla: mensaje de error, no se guarda.
    · campos obligatorios (INV-02, D-043)
    · monto > 0 (INV-01) · tasa > 0 si aplica (INV-18)
    · categoría ∈ FOOD | TRANSPORT | ACTIVITIES | OTHER (D-038)
    · startDate ≤ fecha ≤ min(hoy, endDate) (D-055)
 3. Conversión: amount (centavos USD) = redondear½↑(monto ÷ tasa), con la tasa expresada como
    "1 USD = X {divisa}" (D-067, INV-25). Ej.: ₡5 000 ÷ 510 = $9.80.
 4. Verificaciones (generan "motivos" de confirmación):
    · OTHER: si no existe fondo → pedir crearlo (D-031; también en FINISHED, D-098); si el cliente no lo crea → no se guarda y vuelve
      al formulario. Si el gasto deja el fondo < 0 → motivo (INV-19).
    · Categoría diaria:
        - monto > ExpenseCap → motivo (INV-14). Se revisa siempre, cualquier fecha y estado.
        - IN_PROGRESS: si el gasto deja el disponible de HOY < 0 → motivo. Para gastos de días anteriores el
          texto indica "Esto reduce tu disponible de hoy a −$X" (D-065).
        - FINISHED: solo se revisa el tope.
 5. Si hay motivos → UNA sola confirmación con todos (INV-15). Cancelar → no se guarda.
 6. Guardar vía ExpenseRepository → LocalStorage (D-018).
 7. Recalcular (sin notificaciones, D-008):
    · fecha = hoy → Daily{Cat}Remaining; alerta visual si < 0 (REQ-F-03, INV-09).
    · fecha < hoy (IN_PROGRESS) → límite de hoy al instante (D-065).
    · FINISHED → solo TotalTripSpent (D-056).
    · OTHER → solo saldo del fondo; no toca límites diarios (INV-13).
    · DailyForecastAlert pasados: no se modifican (INV-26).
```

---

### 8.2 Crear viaje (D-070)

```
[Mis viajes → "Nuevo viaje"]
 Paso 1 · Datos: name, place, country, startDate, endDate, preferences (opcional).
          Validar: obligatorios (INV-02) · startDate ≥ hoy (INV-28) · startDate ≤ endDate (REQ-F-05)
                  · sin cruce con otros viajes (INV-29).
          Mostrar: duración en días (INV-04).
 Paso 2 · Presupuesto: divisa + tasa "1 USD = [ ] X" si ≠ USD (D-067).
          Comida, Transporte, Actividades: obligatorios > 0 (INV-01).
          ExpenseCap de cada una: obligatorio > 0 (D-013, D-014).
          Tiquetes, Hospedaje, Imprevistos: opcionales, > 0 si se ingresan (INV-17).
          Mostrar en vivo: totalAmount (INV-16) y límite diario por categoría (INV-06).
 Paso 3 · Recordatorio: ON por defecto (D-068); al activarlo se pide permiso de notificaciones.
 [Guardar]
   · Convertir a centavos USD: monto ÷ tasa, redondeo ½↑ (INV-25).
   · Estado según fechas: PLANNED, o IN_PROGRESS si startDate = hoy (D-032, INV-28).
   · Guardar vía TripRepository (D-018).
   · Abrir el viaje en su pestaña inicial (D-061).
 Las actividades se agregan después en Itinerario.
```

### 8.3 Cambiar fechas del viaje (D-071 a D-073)

```
[Ajustes → Fechas]
 Según estado:
   · PLANNED: se pueden cambiar startDate y endDate. startDate ≥ hoy (INV-28).
              Las actividades se mueven con el viaje conservando su día relativo (D-072).
   · IN_PROGRESS: startDate bloqueado; solo endDate, con endDate ≥ hoy (D-071).
   · FINISHED: fechas bloqueadas; para repetir, duplicar (D-073, D-069).
 Validar: startDate ≤ endDate (REQ-F-05) · sin cruce con otros viajes (INV-29).
 Si el viaje se acorta (REQ-F-13A):
   · Listar actividades fuera del nuevo rango (los gastos nunca quedan fuera, D-094).
       - PLANNED: actividades cuyo día relativo > nueva duración.
       - IN_PROGRESS: actividades con fecha > nuevo endDate.
   · Las actividades afectadas se marcan isDetached = true.
   · El cliente confirma o cancela todo el cambio.
 [Guardar] vía TripRepository (D-018)
   · Recalcular límites diarios desde hoy con la fórmula de D-007 (REQ-F-13B, D-065).
   · DailyForecastAlert pasados: no se modifican (INV-26).
```

### 8.4 Editar gasto (D-074)

Mismo formulario, validación, verificaciones, confirmación única y recálculo que 8.1, con esta diferencia:
- El disponible se evalúa con el **impacto neto**: monto nuevo − monto anterior (p. ej. $40 → $50 = impacto $10).
- Si cambia la categoría o la fecha, la original libera el monto anterior y la nueva recibe el monto completo; cada una se recalcula según D-065.

### 8.5 Eliminar gasto (D-075)

```
[Gasto → Eliminar]
 1. Confirmación simple: "¿Eliminar '{concept}' (${amount})?"
 2. Eliminar vía ExpenseRepository (D-018).
 3. Recalcular disponible / límite de hoy (D-065) o saldo del fondo si es OTHER (INV-13); TotalTripSpent.
 No se piden confirmaciones por tope ni por saldo negativo: eliminar siempre libera dinero.
 DailyForecastAlert pasados: no se modifican (INV-26).
```

### 8.6 Gestionar actividades (D-076 a D-078)

```
[Itinerario → crear / editar / eliminar actividad]
 Estados permitidos: PLANNED, IN_PROGRESS y FINISHED (D-078).
 Validar (crear/editar):
   · obligatorios: title, date, startTime, endTime, location, estimatedCost; type opcional (D-044)
   · startDate ≤ date ≤ endDate, incluidos días pasados del viaje (D-076)
   · endTime > startTime (INV-21) · estimatedCost ≥ 0 (INV-22)
   · horarios cruzados entre actividades: permitidos, sin aviso (D-077)
 Calcular: dayNumber = date − startDate + 1.
 Guardar vía repositorio (D-018).
 Recalcular: suma planificada vs activitiesTotal; alerta visual si se excede (D-050). No afecta saldos.
 Eliminar: confirmación simple "¿Eliminar '{title}'?".
```

### 8.7 Editar presupuesto (D-079 a D-081)

```
[Ajustes → Presupuesto]
 Según estado:
   · PLANNED: todo editable, incluidos ticketsAmount y lodgingAmount (D-081).
   · IN_PROGRESS: editables montos por categoría diaria (INV-27), ExpenseCap (D-014) y
                  otherReserveAmount (D-028). ticketsAmount y lodgingAmount bloqueados (D-039).
   · FINISHED: presupuesto bloqueado (D-081), salvo crear/ajustar otherReserveAmount desde el aviso de un gasto OTHER (D-098).
 originalCurrency fija tras crear el viaje; las ediciones se ingresan en esa divisa con la tasa
 prellenada y editable (D-080, D-064).
 Validar: mismas reglas que 8.2 (INV-01, INV-17, D-013).
 Si un monto por categoría queda por debajo de lo ya gastado → motivo en la confirmación única:
   "Ya gastaste $X; tu disponible de {categoría} quedará en negativo" (D-079, INV-15).
 [Guardar] vía repositorio (D-018)
   · Recalcular totalAmount (INV-16) y límites diarios desde hoy (INV-27, D-065).
   · DailyForecastAlert pasados: no se modifican (INV-26).
```

### 8.8 Resumen matutino (D-082, D-083)

```
[08:00 con la app abierta, o primera apertura después de las 08:00] (REQ-F-02)
 1. ¿Viaje IN_PROGRESS y sin DailyForecastAlert para hoy? Si no → termina.
 2. Calcular Daily{Cat}Limit de hoy (D-007) y el disponible en este momento.
 3. Crear DailyForecastAlert con el disponible al momento de generarse (D-082) y generatedAt (D-100). Inmutable (INV-26).
 4. assistantMessage con plantilla fija (D-033, D-083):
    "¡Buenos días! Para hoy en {place} tienes disponible: ${food} en Comida, ${transport} en
     Transporte y ${activities} en Actividades. Total disponible hoy: ${total} USD."
 5. Mostrar: notificación del navegador solo si la app está abierta a las 08:00 y isReminderActive
    (REQ-F-02, D-035); en la primera apertura posterior, solo la tarjeta en "Hoy" (D-062).
```

### 8.9 Eliminar viaje (D-086)

```
[Mis viajes → ⋯ → Eliminar]
 1. Confirmación: "Se eliminarán el viaje, su presupuesto, gastos, actividades y resúmenes.
    Esta acción no se puede deshacer."
 2. Eliminar vía repositorios (D-018): Trip, GlobalBudget, Expense, Activity, DailyForecastAlert.
 3. Volver a Mis viajes. Las fechas quedan libres para otro viaje (INV-29).
 Permitido en cualquier estado.
```

## 9. Persistencia y validación

- **Persistencia:** `LocalStorage` del navegador. **Requisito del curso** (no negociable). D-001, D-016.
- **Modelo de usuario:** un navegador = un cliente. Sin usuarios, login ni backend. D-016.
- La "base de datos persistente" de `[PDF §3]` se satisface con `LocalStorage` (los datos sobreviven al cierre del navegador).
- **Acceso a datos:** la lógica de dominio nunca accede directamente a `LocalStorage`; lo hace mediante interfaces de repositorio (p. ej. `TripRepository`). La serialización y las claves de almacenamiento viven solo en la implementación del repositorio. D-018.
- **Limitaciones aceptadas:** un solo dispositivo/navegador, sin sincronización, ~5 MB, se pierde si el cliente borra los datos de navegación.
- **Validación:** estricta; ante un dato inválido se rechaza, no se corrige automáticamente. `[Autor]`
- **Claves y versionado (D-104):** una clave por colección con prefijo `travelAssistant:` (`meta`, `trips`, `budgets`, `activities`, `expenses`, `forecastAlerts`), serialización JSON y `schemaVersion` en `travelAssistant:meta`. Detalle en `docs/design.md` §5.4.
- **Validación (D-101, D-102):** reglas puras en `domain/validators`, invocadas por los servicios de aplicación.

---

## 10. Registro de decisiones

| ID | Decisión | Fecha |
|---|---|---|
| D-001 | Persistencia en `LocalStorage` | 2026-10-24 |
| D-002 | Validación estricta: rechazar montos negativos y campos vacíos | 2026-10-24 |
| D-003 | Fórmula `DailyFoodLimit` = (Total Comida / Días Totales) − Acumulado del día | 2026-10-24 |
| D-004 | Lenguaje ubicuo: `Trip`, `GlobalBudget`, `DailyFoodLimit`, `Expense` | 2026-10-24 |
| D-005 | El boceto visual es referencia de estilo; se depuran los elementos ajenos al proyecto | 2026-10-24 |
| D-006 | El monto `0` también se rechaza (regla: monto > 0). Motivo: un cero probablemente es un error del usuario y generaría información incorrecta. Amplía D-002 y resuelve C-01. | 2026-10-24 |
| D-007 | Opción A: `DailyFoodLimit` es el **límite** del día (fijo desde las 08:00, incluye rollover); el **disponible** es un concepto separado calculado en cada gasto. Refina D-003 y resuelve el núcleo de C-02. *(Recalculo ajustado por D-065; cambio de día a las 00:00 por D-100.)* | 2026-10-24 |
| D-008 | No se envían notificaciones por cada gasto. La única notificación es la matutina de las 08:00 (REQ-F-02); el sobrecosto se indica solo de forma visual en pantalla (REQ-F-04B). | 2026-10-24 |
| D-009 | El disponible del día de Comida se llama `DailyFoodRemaining`. Resuelve Q-13. | 2026-10-24 |
| D-010 | El esquema límite/disponible se aplica también a Transporte y Actividades: `DailyTransportLimit`, `DailyTransportRemaining`, `DailyActivitiesLimit`, `DailyActivitiesRemaining`. Resuelve C-02. | 2026-10-24 |
| D-011 | El sistema no impone un tope ni un mínimo automático al límite diario; ese control queda en manos del cliente. Mecanismo definido en D-012. | 2026-10-24 |
| D-012 | El control del cliente es un **tope por gasto individual** por categoría; si un gasto lo supera, se pide confirmación en pantalla. Resuelve Q-14. | 2026-10-24 |
| D-013 | `ExpenseCap`: obligatorio, por viaje, aplica solo a las categorías diarias (Comida, Transporte, Actividades). Resuelve Q-16. | 2026-10-24 |
| D-014 | Validaciones de `ExpenseCap`: (1) debe ser > 0, igual que INV-01; (2) puede ser mayor que el límite diario de la categoría, para permitir gastos ocasionales mayores (p. ej. un buen restaurante); (3) editable durante el viaje, porque el costo real del destino puede ser incierto al planificar. Resuelve Q-17. | 2026-10-24 |
| D-015 | Confirmación única por gasto: un solo aviso que explica si supera el `ExpenseCap`, el disponible del día o ambos. Cumple REQ-F-04A sin modificarlo. Resuelve Q-18. | 2026-10-24 |
| D-016 | Persistencia solo en `LocalStorage` (requisito del curso), un solo usuario por navegador, sin backend ni autenticación. Resuelve C-04. | 2026-10-24 |
| D-017 | Se elimina `Viaje.id_usuario` del contrato de datos (no tiene significado con un solo usuario por navegador). Resuelve Q-19. | 2026-10-24 |
| D-018 | Se adopta el patrón repositorio (p. ej. `TripRepository`) para aislar `LocalStorage` de la lógica de dominio. Resuelve Q-20. | 2026-10-24 |
| D-019 | Idioma: inglés en código, contrato de datos y lenguaje ubicuo; español en la interfaz de usuario. Resuelve el núcleo de C-05. | 2026-10-24 |
| D-020 | Mapeo: Viaje→`Trip`, Presupuesto→`GlobalBudget`, Gasto→`Expense`, Actividad→`Activity`, AlertaPrevisionDiaria→`DailyForecastAlert`. Convención: `PascalCase` entidades, `camelCase` campos, `UPPER_SNAKE_CASE` enumeraciones. Categorías: `FOOD`, `TRANSPORT`, `ACTIVITIES`, `TICKETS`, `LODGING`, `OTHER`. Resuelve C-05. | 2026-10-24 |
| D-021 | Se elimina `Trip.finalBudget`; es el mismo dato que `GlobalBudget.totalAmount`. | 2026-10-24 |
| D-022 | Los `Expense` registrados en una divisa distinta de USD se convierten a USD (extiende INV-05 a gastos). | 2026-10-24 |
| D-023 | El interruptor del recordatorio matutino (ON/OFF) pasa a `Trip`, uno por viaje; deja de estar en `DailyForecastAlert`. | 2026-10-24 |
| D-024 | El cliente ingresa el monto de cada categoría; `totalAmount` se calcula como la suma y no se edita. Resuelve Q-23. | 2026-10-24 |
| D-025 | `otherReserveAmount` (Otros / Imprevistos) es opcional. | 2026-10-24 |
| D-026 | Nombres definidos: `Expense.amount` (USD), `originalAmount`, `originalCurrency`, `exchangeRate`; `Trip.isReminderActive`. Resuelve Q-21 y Q-22. | 2026-10-24 |
| D-027 | Contrato de datos definido (sección 6.1). Resuelve C-03. | 2026-10-24 |
| D-028 | `otherReserveAmount` se puede crear o ajustar durante el viaje, porque también funciona como imprevisto. | 2026-10-24 |
| D-029 | Estados del viaje: `PLANNED`, `IN_PROGRESS`, `FINISHED`. "En Curso" de REQ-F-02 = `IN_PROGRESS` (etiqueta UI "En curso", D-019). Resuelve Q-04. | 2026-10-24 |
| ~~D-030~~ | **Reemplazada por D-063.** Tasa de cambio: opción C — API externa con respaldo (última tasa guardada en `LocalStorage` o ingreso manual del cliente). Resuelve Q-02. | 2026-10-24 |
| D-031 | Gasto `OTHER` sin fondo: la app pide crear el fondo en ese momento. Si el gasto deja el fondo negativo, se pide confirmación y se permite. Resuelve Q-24. | 2026-10-24 |
| D-032 | Transiciones de `TripStatus` automáticas por fecha: `IN_PROGRESS` en `startDate`, `FINISHED` al día siguiente de `endDate`. Resuelve Q-25. | 2026-10-24 |
| D-033 | "IA" es solo parte del nombre del producto; no hay funcionalidad de inteligencia artificial. `assistantMessage` se genera con una plantilla fija (ej. `[PDF §4]`). Resuelve Q-06. | 2026-10-24 |
| D-034 | Notificación matutina, opción C: notificación del navegador si la app está abierta a las 08:00; si no, resumen en pantalla al abrirla. Rollover calculado bajo demanda. Motivo: no hay backend por ahora. Resuelve Q-05. | 2026-10-24 |
| D-035 | `isReminderActive` en OFF desactiva solo la notificación del navegador; el resumen en pantalla se sigue mostrando al abrir la app. Resuelve Q-28. | 2026-10-24 |
| D-036 | Se define REQ-F-02 (`docs/requirements.md`). La condición "recordatorio activo" aplica solo a la notificación del navegador, en coherencia con D-035. Resuelve Q-27. | 2026-10-24 |
| D-037 | Tiquetes y Hospedaje se registran solo como montos de `GlobalBudget` (`ticketsAmount`, `lodgingAmount`); no se registran como `Expense`. Coherente con `[PDF §2]` ("fijados previo al viaje"). Resuelve Q-09. | 2026-10-24 |
| D-038 | `Expense.category` se restringe a `FOOD`, `TRANSPORT`, `ACTIVITIES`, `OTHER`. Modifica el contrato de datos. Resuelve Q-29 (1). | 2026-10-24 |
| D-039 | Cargos extra de tiquetes u hospedaje durante el viaje (p. ej. cargo adicional del hotel) se registran como `Expense` con categoría `OTHER`; los montos de tiquetes y hospedaje no se editan durante el viaje. Resuelve Q-29 (3). | 2026-10-24 |
| D-040 | `ticketsAmount` y `lodgingAmount` se **mantienen** en `GlobalBudget`: se pagan antes del viaje, pero son necesarios para conocer el costo total del viaje. Descarta su eliminación. | 2026-10-24 |
| D-041 | `ticketsAmount` y `lodgingAmount` son opcionales; si se ingresan, deben ser > 0 (INV-01). | 2026-10-24 |
| D-042 | Se define `TotalTripSpent` = `ticketsAmount` + `lodgingAmount` + suma de `Expense.amount`. Calculado, no persistido. Resuelve Q-30. | 2026-10-24 |
| D-043 | `Expense.concept` es obligatorio. Motivo: deja registrados los lugares para cuando se repita el viaje. | 2026-10-24 |
| D-044 | `Activity`: obligatorios `title`, `date`, `startTime`, `endTime`, `location`, `estimatedCost`; `type` opcional. | 2026-10-24 |
| D-045 | `Trip.preferences` es opcional. Resuelve Q-01. | 2026-10-24 |
| ~~D-046~~ | **Obsoleta por D-094.** Los gastos desasociados por acortar el viaje (REQ-F-13A) **sí cuentan** en `TotalTripSpent`. Pueden pasar a `OTHER`; mecanismo definido en D-048. | 2026-10-24 |
| D-047 | `Activity.endTime` > `Activity.startTime`. | 2026-10-24 |
| ~~D-048~~ | **Obsoleta por D-094.** Gastos desasociados: el cliente decide por cada uno si pasa a `OTHER` o se elimina, dentro del aviso de REQ-F-13A. Resuelve Q-31. | 2026-10-24 |
| D-049 | `Activity.estimatedCost` admite 0. Motivo: una actividad es planificación, no dinero gastado; registrar actividades gratuitas sirve para viajes futuros. Resuelve Q-32. | 2026-10-24 |
| D-050 | `Activity.estimatedCost` se compara con `activitiesTotal`: la UI muestra lo planificado vs el presupuesto, con alerta visual si se excede (sin bloqueo). Respaldo: `[PDF §3]` "Planificación Anticipada". Resuelve Q-10. | 2026-10-24 |
| D-051 | Montos en USD se guardan como centavos enteros; UI con 2 decimales; redondeo al centavo en divisiones y conversiones; tasa con todos sus decimales. Modifica el contrato de datos. Resuelve Q-11. | 2026-10-24 |
| D-052 | `Expense.originalAmount` se guarda en decimal tal como lo ingresa el cliente; es solo referencia y no participa en cálculos. Resuelve Q-33. | 2026-10-24 |
| D-053 | Redondeo al centavo: mitad hacia arriba (0.005 → 0.01). Resuelve Q-34. | 2026-10-24 |
| D-054 | El cliente puede registrar, editar y eliminar gastos de días anteriores del viaje, con su fecha real. Los límites de los días siguientes se ajustan con D-007. "Histórico" = los `DailyForecastAlert` generados, que no se modifican. Motivo: que la información sea correcta. Resuelve Q-08. Requiere ampliar REQ-F-03 (Q-35). | 2026-10-24 |
| D-055 | Se define REQ-F-03 (`docs/requirements.md`). Un gasto solo puede tener fecha dentro del viaje y no futura. Resuelve Q-35. | 2026-10-24 |
| D-056 | Se permite registrar, editar y eliminar gastos con el viaje en `FINISHED` (para corregir olvidos); solo actualiza `TotalTripSpent`. | 2026-10-24 |
| D-057 | **Duplicar viaje:** se copian `place`, `country`, `preferences`, divisa, montos por categoría, `ExpenseCap`, tiquetes, hospedaje, fondo de imprevistos y actividades (con día relativo; fechas recalculadas desde el nuevo `startDate`). No se copian fechas, gastos ni `DailyForecastAlert`. La tasa del presupuesto se prellena con la del viaje original y es editable (D-096). El nuevo viaje inicia en `PLANNED`. El viaje original queda disponible para consulta. Las actividades copiadas son editables como cualquier otra. Resuelve Q-12. *(Estado y tasa ajustados por D-095 y D-096.)* | 2026-10-24 |
| D-058 | Al duplicar en un viaje más corto, solo se copian las actividades que caben en los nuevos días y se notifica al cliente cuáles quedaron fuera. | 2026-10-24 |
| D-059 | Se define REQ-F-19 "Duplicar viaje" (`docs/requirements.md`). El nombre del nuevo viaje se prellena como "Copia de {nombre original}" y es editable. Resuelve Q-36. | 2026-10-24 |
| D-060 | Diseño **mobile-first y responsive**: prioridad celular, pero debe verse bien en computadora. | 2026-10-24 |
| D-061 | Navegación: opción A (pestañas Hoy, Itinerario, Gastos, Resumen dentro de cada viaje, + registrar gasto, Ajustes) con la pestaña inicial según el estado del viaje (tomado de la opción B). Comportamiento responsive según sección 7.1. Resuelve Q-07. | 2026-10-24 |
| D-062 | Pantalla "Hoy" según sección 7.2: resumen matutino, total disponible, tarjeta por categoría ("Te quedan $X de $Y"), actividades del día; variantes para `PLANNED` y `FINISHED`. Resuelve Q-15. | 2026-10-24 |
| D-063 | El curso no permite servicios externos. La tasa de cambio la ingresa manualmente el cliente. Reemplaza D-030. Resuelve Q-26. | 2026-10-24 |
| D-064 | Tasa manual por viaje y divisa, prellenada con la última usada y editable en cada registro; USD no pide tasa. Se define REQ-F-01A. Resuelve Q-37. El ejemplo "1 EUR = 1.08 USD" queda sustituido por el formato de D-067. | 2026-10-24 |
| D-065 | Opción a: el límite del día se recalcula de inmediato cuando cambian los gastos de días anteriores o el monto de una categoría; nunca por los gastos del mismo día. Ajusta D-007 ("fijo durante el día") y la 2.ª cláusula de REQ-F-03. Motivo: un aumento de presupuesto debe poder usarse desde hoy. Resuelve Q-38. | 2026-10-24 |
| D-066 | Se define el flujo "Registrar gasto" (sección 8.1) con: G1 botón desactivado en `PLANNED`; G2 tope siempre, disponible contra el de hoy, en `FINISHED` solo tope; G3 sin fondo creado no se guarda el gasto `OTHER`. | 2026-10-24 |
| D-067 | Formato de la tasa: "1 USD = X {divisa}" (como se publica el tipo de cambio, p. ej. 1 USD = 510 CRC). Conversión: USD = monto ÷ X. El formulario muestra el formato explícito. Resuelve Q-39. | 2026-10-24 |
| D-068 | El recordatorio inicia en ON al crear un viaje; al activarse se solicita el permiso de notificaciones del navegador. Si se rechaza, el resumen igual se muestra al abrir la app (D-035). | 2026-10-24 |
| D-069 | No se permite crear ni duplicar viajes con `startDate` en el pasado, para evitar errores en otros pasos. Para repetir un viaje anterior se duplica y se ingresan fechas nuevas. Motivo adicional: a los viajes pasados les faltarían detalles y afectarían la información futura. | 2026-10-24 |
| D-070 | Se define el flujo "Crear viaje" en 3 pasos: Datos, Presupuesto, Recordatorio (sección 8.2). | 2026-10-24 |
| D-071 | Viaje `IN_PROGRESS`: `startDate` bloqueado; solo se edita `endDate`, que debe ser ≥ hoy. | 2026-10-24 |
| D-072 | Viaje `PLANNED`: al cambiar fechas, las actividades se mueven con el viaje conservando su día relativo. | 2026-10-24 |
| D-073 | Viaje `FINISHED`: fechas bloqueadas; para repetirlo se duplica. Flujo "Cambiar fechas" definido (sección 8.3). | 2026-10-24 |
| D-074 | Flujo "Editar gasto" definido (sección 8.4): reutiliza 8.1 evaluando el impacto neto. | 2026-10-24 |
| D-075 | Flujo "Eliminar gasto" definido (sección 8.5): confirmación simple y recálculo; sin confirmaciones de tope o saldo. | 2026-10-24 |
| D-076 | `Activity.date` puede ser cualquier día dentro del viaje, incluidos días pasados de un viaje en curso. | 2026-10-24 |
| D-077 | Se permiten actividades con horarios que se cruzan, sin aviso. | 2026-10-24 |
| D-078 | Las actividades se pueden crear, editar y eliminar también con el viaje `FINISHED`. Flujo "Gestionar actividades" definido (sección 8.6). | 2026-10-24 |
| D-079 | Bajar el monto de una categoría por debajo de lo ya gastado se permite con la confirmación única. | 2026-10-24 |
| D-080 | La divisa del presupuesto queda fija tras crear el viaje; las ediciones usan esa divisa con tasa prellenada y editable. | 2026-10-24 |
| D-081 | En `PLANNED` todo el presupuesto es editable; en `FINISHED` queda bloqueado. Flujo "Editar presupuesto" definido (sección 8.7). | 2026-10-24 |
| D-082 | El `DailyForecastAlert` guarda el disponible al momento de generarse. | 2026-10-24 |
| D-083 | Plantilla de `assistantMessage` basada en `[PDF §4]`. Flujo "Resumen matutino" definido (sección 8.8). | 2026-10-24 |
| D-084 | No se permiten viajes con fechas superpuestas; validación al crear, duplicar y cambiar fechas. | 2026-10-24 |
| D-085 | Pantalla "Mis viajes" definida (sección 7.3). | 2026-10-24 |
| D-086 | Se permite eliminar un viaje en cualquier estado, con confirmación explícita; elimina todos sus datos asociados (sección 8.9). Requiere requerimiento nuevo (Q-40). | 2026-10-24 |
| D-087 | Se define REQ-F-20 "Eliminar viaje" (`docs/requirements.md`). Resuelve Q-40. | 2026-10-24 |
| D-088 | Pantalla "Itinerario" definida (sección 7.4). | 2026-10-24 |
| D-089 | Las actividades desasociadas se muestran en la sección plegable "Fuera del viaje" del Itinerario; se pueden eliminar o reubicar en una fecha válida. | 2026-10-24 |
| D-090 | Pantalla "Gastos" definida (sección 7.5). La sección "Fuera del viaje" se eliminó por D-094. | 2026-10-24 |
| D-091 | Pantalla "Resumen" definida (sección 7.6). | 2026-10-24 |
| D-092 | Pantalla "Ajustes" definida (sección 7.7). | 2026-10-24 |
| D-093 | Los datos descriptivos del viaje (`name`, `place`, `country`, `preferences`) son editables en cualquier estado. | 2026-10-24 |
| D-094 | Los gastos nunca quedan fuera del rango del viaje (consecuencia de D-055 y D-071). Se eliminan `Expense.isDetached`, la sección "Fuera del viaje" de Gastos e INV-23; D-046 y D-048 quedan obsoletas; REQ-F-13A aplica solo a actividades. Resuelve Q-41. | 2026-10-24 |
| D-095 | El estado de un viaje duplicado se asigna según sus fechas (D-032), igual que al crearlo. Ajusta REQ-F-19 y D-057. Resuelve Q-42. | 2026-10-24 |
| D-096 | Los montos de `GlobalBudget` se guardan en la divisa original junto con su tasa; los USD se derivan. Cambiar la tasa reconvierte todo el presupuesto; los gastos conservan la suya. Al duplicar, la tasa se prellena con la del original y es editable. Resuelve Q-43. | 2026-10-24 |
| D-097 | `dailyFoodLimit`, `dailyTransportLimit` y `dailyActivitiesLimit` se quitan del contrato: son derivados. Resuelve Q-44. | 2026-10-24 |
| D-098 | Excepción a D-081: con el viaje `FINISHED`, el fondo de imprevistos se puede crear o ajustar únicamente desde el aviso de un gasto `OTHER` (D-031). Resuelve Q-45. | 2026-10-24 |
| D-099 | Gastos y presupuestos en USD: `originalCurrency = "USD"`, `originalAmount` = monto, `exchangeRate = 1`. Resuelve Q-46. | 2026-10-24 |
| D-100 | El día cambia a las 00:00 (hora local) para límites, estado y fechas de gastos; las 08:00 solo marcan el resumen. `DailyForecastAlert.sendTime` se reemplaza por `generatedAt`. Resuelve Q-47. | 2026-10-24 |

| D-101 | Arquitectura en capas (UI, Estado, Aplicación, Dominio, Infraestructura) con puertos `Clock`, `NotificationPort`, `IdGenerator` y repositorios (`docs/design.md` §2). | 2026-10-24 |
| D-102 | Estructura de módulos `domain/`, `application/`, `infrastructure/`, `state/`, `ui/` (`docs/design.md` §4). | 2026-10-24 |
| D-103 | Store global en memoria + selectores derivados; LocalStorage como fuente de verdad; nunca persistir valores derivables (`docs/design.md` §5.1). | 2026-10-24 |
| D-104 | Claves de LocalStorage por colección con prefijo `travelAssistant:` y `schemaVersion` (`docs/design.md` §5.4). | 2026-10-24 |
| D-105 | Eventos de tiempo: al abrir/volver a primer plano, a las 00:00 y a las 08:00 (`docs/design.md` §5.3). | 2026-10-24 |
| D-106 | `Trip.status` se recalcula y guarda en cada arranque y a medianoche (`docs/design.md`). | 2026-10-24 |
| D-107 | Lenguaje de implementación: JavaScript. Framework y herramienta de build PENDIENTES. | 2026-10-24 |
| D-108 | Se crea `docs/requirements.md` como especificación de requerimientos consolidada (incluye REQ-F-19/20 y RNF derivados). | 2026-10-24 |
| D-109 | Se define REQ-F-03B: el rollover ocurre al inicio de cada día (00:00), coherente con D-100. Resuelve Q-48. | 2026-10-24 |
| D-110 | JavaScript **sin framework** de UI. Herramienta de build PENDIENTE. Resuelve Q-49 parcialmente. | 2026-10-24 |
| D-111 | `Activity.type`: texto libre opcional; el cliente escribe lo que quiera. Resuelve Q-51 y el PENDIENTE del contrato. | 2026-10-24 |
| D-112 | No se incluyen pruebas automatizadas. La verificación será manual. Resuelve Q-50. | 2026-10-24 |
| D-113 | Sin herramienta de build: `index.html` carga módulos ES nativos de JavaScript. La app se abre con un servidor local (p. ej. Live Server de VS Code), no con doble clic. Resuelve Q-49. | 2026-10-24 |
| D-114 | El producto se llama **"Asistente de Viajes"**: se quita "IA" del nombre, ya que no tiene funcionalidad de inteligencia artificial (D-033). | 2026-10-24 |
| D-115 | `totalAmount` se quita del contrato de datos: es la suma de las categorías y, por D-103, no se persiste. Sigue existiendo como valor calculado. Resuelve Q-52. | 2026-10-24 |
> **Revisión de consistencia (2026-10-24):** se corrigieron sin cambio de contenido: mapeo de sección 7 a contrato de datos, referencia de Q-02, condición de notificación en 8.8, texto de confirmación en 8.9, `Activity.type` nullable, filtro de desasociadas en 7.4 y lista completa de motivos en INV-15. Hallazgos que requieren decisión: Q-41 a Q-47.

---

## 11. Conflictos entre fuentes

| ID | Conflicto | Fuentes |
|---|---|---|
| ~~C-01~~ | **Resuelto por D-006:** el monto `0` se rechaza. | — |
| ~~C-02~~ | **Resuelto por D-007 y D-010.** | — |
| ~~C-03~~ | **Resuelto por D-027.** | — |
| ~~C-04~~ | **Resuelto por D-016.** | — |
| ~~C-05~~ | **Resuelto por D-019 y D-020.** | — |

---

## 12. Vacíos de información (preguntas abiertas)

| ID | Pregunta | Afecta |
|---|---|---|
| ~~Q-01~~ | **Resuelto por D-043, D-044 y D-045.** | — |
| ~~Q-02~~ | **Resuelto por D-063** (antes D-030, reemplazada). | — |
| ~~Q-03~~ | **Resuelto por D-020.** | — |
| ~~Q-04~~ | **Resuelto por D-029.** | — |
| ~~Q-05~~ | **Resuelto por D-034.** | — |
| ~~Q-06~~ | **Resuelto por D-033.** | — |
| ~~Q-07~~ | **Resuelto por D-061.** | — |
| ~~Q-08~~ | **Resuelto por D-054.** | — |
| ~~Q-09~~ | **Resuelto por D-037.** | — |
| ~~Q-10~~ | **Resuelto por D-050.** | — |
| ~~Q-11~~ | **Resuelto por D-051.** | — |
| ~~Q-12~~ | **Resuelto por D-057 y D-058.** | — |
| ~~Q-13~~ | **Resuelto por D-009.** | — |
| ~~Q-14~~ | **Resuelto por D-012.** | — |
| ~~Q-16~~ | **Resuelto por D-013.** | — |
| ~~Q-17~~ | **Resuelto por D-014.** | — |
| ~~Q-18~~ | **Resuelto por D-015.** | — |
| ~~Q-19~~ | **Resuelto por D-017.** | — |
| ~~Q-20~~ | **Resuelto por D-018.** | — |
| ~~Q-21~~ | **Resuelto por D-026.** | — |
| ~~Q-22~~ | **Resuelto por D-026.** | — |
| ~~Q-23~~ | **Resuelto por D-024.** | — |
| ~~Q-24~~ | **Resuelto por D-031.** | — |
| ~~Q-25~~ | **Resuelto por D-032.** | — |
| ~~Q-26~~ | **Resuelto por D-063.** | — |
| ~~Q-37~~ | **Resuelto por D-064.** | — |
| ~~Q-27~~ | **Resuelto por D-036.** | — |
| ~~Q-28~~ | **Resuelto por D-035.** | — |
| ~~Q-29~~ | **Resuelto por D-038, D-039, D-040 y D-041.** | — |
| ~~Q-30~~ | **Resuelto por D-042.** Ubicación en la UI: se define con Q-07/Q-15. | — |
| ~~Q-31~~ | **Resuelto por D-048.** | — |
| ~~Q-32~~ | **Resuelto por D-049.** | — |
| ~~Q-33~~ | **Resuelto por D-052.** | — |
| ~~Q-34~~ | **Resuelto por D-053.** | — |
| ~~Q-35~~ | **Resuelto por D-055 y D-056.** | — |
| ~~Q-36~~ | **Resuelto por D-059.** | — |
| ~~Q-15~~ | **Resuelto por D-062.** | — |
| ~~Q-38~~ | **Resuelto por D-065.** | — |
| ~~Q-39~~ | **Resuelto por D-067.** | — |
| ~~Q-40~~ | **Resuelto por D-087.** | — |
| ~~Q-41~~ | **Resuelto por D-094.** | — |
| ~~Q-42~~ | **Resuelto por D-095.** | — |
| ~~Q-43~~ | **Resuelto por D-096.** | — |
| ~~Q-44~~ | **Resuelto por D-097.** | — |
| ~~Q-45~~ | **Resuelto por D-098.** | — |
| ~~Q-46~~ | **Resuelto por D-099.** | — |
| ~~Q-47~~ | **Resuelto por D-100.** | — |
| ~~Q-48~~ | **Resuelto por D-109.** | — |
| ~~Q-49~~ | **Resuelto por D-110 y D-113.** | — |
| ~~Q-50~~ | **Resuelto por D-112.** | — |
| ~~Q-51~~ | **Resuelto por D-111.** | — |
| ~~Q-52~~ | **Resuelto por D-115.** | — |
| ~~Q-53~~ | **Resuelto:** `retrospective.md` redactado. | — |
