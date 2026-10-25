# Plan de desarrollo — Asistente de Viajes

| | |
|---|---|
| **Versión** | 1.1 |
| **Fecha** | 2026-10-24 |
| **Fuentes** | `docs/requirements.md` · `docs/design.md` · `docs/data-contract.json` · `docs/wireframe.md` · `CLAUDE.md` |
| **Verificación** | Manual, sin pruebas automatizadas (D-112). Cada fase termina con su lista de verificación. |
| **Ejecución** | Módulos ES nativos y Live Server, sin build (D-113) |
| **Moneda** | Solo USD, guardado en centavos enteros (D-120, D-121) |

### Convenciones

- Cada tarea cita el requerimiento, el flujo (`CLAUDE.md` §8) o la decisión que implementa.
- Orden: primero la base (fases 0 a 4), después cortes verticales. Cada corte incluye servicio, pantalla y verificación.
- **Regla de comportamiento sin cambios (*Unchanged Behavior*):** cada fase agrega funcionalidad sin alterar lo que ya funciona.
  - Cada fase (desde la 1) lista en **Comportamiento sin cambios** lo que debe seguir igual.
  - Antes de cerrar una fase se repite la verificación de las fases anteriores afectadas (regresión manual, D-112).
  - Si una tarea necesita cambiar un comportamiento existente, no se hace en silencio: primero se registra la decisión en `CLAUDE.md` §10 y se actualiza la especificación.

---

## Fase 0 — Esqueleto del proyecto

- [ ] **T-0.1** `index.html` que carga `src/main.js` con `type="module"` (D-113).
- [ ] **T-0.2** Carpetas de design §4: `domain/`, `application/`, `infrastructure/`, `state/` y `ui/{screens,components}`.
- [ ] **T-0.3** `styles.css` mobile-first con variables de color (paleta verde/crema), títulos serif y tarjetas redondeadas (D-005, D-060).

**Verificación:** Live Server abre la página y la consola no muestra errores.

---

## Fase 1 — Dominio puro (`src/domain/`)

No usa el navegador, LocalStorage ni `new Date()` del sistema (D-101).

- [ ] **T-1.1** `types.js`: `TripStatus`, `ExpenseCategory` y sus etiquetas en español (D-019, D-038).
- [ ] **T-1.2** `money.js`: `toCents(dollars)` con redondeo ½↑ (INV-25, D-121) y `formatMoney(cents)` → `"$1 234.50"`. Todo es USD; no hay conversión (D-120).
- [ ] **T-1.3** `dates.js`: parseo **local** de `YYYY-MM-DD`, `totalDays`, `dayNumber` (derivado, D-117), `addDays`, `isWithin`, `overlaps` (INV-04, INV-29).
  - ⚠️ `new Date("2026-11-05")` se interpreta como UTC. En Costa Rica (UTC-6) eso da el día anterior. Usar siempre `new Date(y, m − 1, d)`.
- [ ] **T-1.4** `tripStatus.js`: `statusFor(trip, today)` (D-032, D-100).
- [ ] **T-1.5** `budgetCalculator.js`:
  - `totalAmount` (D-115);
  - `dailyLimit` y `dailyRemaining` (D-007, INV-10, INV-12);
  - `totalAvailableToday`, `totalTripSpent` (INV-20), `reserveRemaining` (INV-13);
  - `plannedActivitiesTotal` (INV-24);
  - `isOverBudget`.
- [ ] **T-1.6** `validators.js`: obligatorios (INV-02), montos > 0 (INV-01, INV-17), fechas (REQ-F-05, INV-28, INV-29), fecha del gasto (D-055), actividades (INV-21, INV-22, D-076).
- [ ] **T-1.7** `confirmationReasons.js`: tope, disponible de hoy < 0, fondo < 0, categoría por debajo de lo gastado (INV-15). Impacto neto al editar (8.4).
- [ ] **T-1.8** `forecastMessage.js`: plantilla de 8.8 (D-083).
- [ ] **T-1.9** `ports.js`: contratos JSDoc de los repositorios, `Clock`, `NotificationPort` e `IdGenerator` (design §2.2).

**Comportamiento sin cambios:**

- La página sigue abriendo sin errores (Fase 0).
- El dominio no importa nada de otras capas ni lee la fecha del sistema (D-101).

**Verificación (consola del navegador):**

| Caso | Esperado |
|---|---|
| Comida $500, 5 días, día 1 | límite 10000 centavos |
| Día 2 tras gastar $70 el día 1 | límite 10750 |
| Día 2 + cena olvidada de $40 del día 1 | límite 9750 |
| `toCents(45.68)` | 4568 |
| `toCents(0.1 + 0.2)` | 30 (sin error de punto flotante) |
| `formatMoney(-1568)` | −$15.68 |
| `"2026-11-05"` en UTC-6 | sigue siendo 5 de noviembre |

---

## Fase 2 — Infraestructura (`src/infrastructure/`)

- [ ] **T-2.1** `storage.js`: claves `travelAssistant:*`, `meta.schemaVersion = 1`, JSON y error controlado si LocalStorage no está disponible o está lleno (D-104).
- [ ] **T-2.2** Repositorios `LocalStorage{Trip,Budget,Expense,Activity,ForecastAlert}Repository`. `ForecastAlert` no tiene `update` (INV-26).
- [ ] **T-2.3** `SystemClock` (`now()`, `today()` en hora local).
  - Fecha simulada para pruebas manuales (D-123): `?today=YYYY-MM-DD&time=HH:MM` fija "hoy" y la hora para probar estados, rollover y las 08:00. Sin parámetros se usa la fecha real.
- [ ] **T-2.4** `BrowserNotificationAdapter` (Notification API) e `IdGenerator` (`crypto.randomUUID()`, que funciona en localhost).

**Comportamiento sin cambios:**

- Las funciones del dominio (Fase 1) conservan sus firmas y resultados; la infraestructura solo implementa los puertos.
- Al arrancar no se borran ni se reescriben datos que ya estén en LocalStorage.

**Verificación:** DevTools → Application → Local Storage muestra las claves; un JSON corrupto o lleno produce un mensaje y nunca pierde datos en silencio.

---

## Fase 3 — Estado (`src/state/`)

- [ ] **T-3.1** `store.js`: estado en memoria con `getState`, `setState` y `subscribe`. Estado de UI global según design §5.1.
- [ ] **T-3.2** `selectors.js`: valores derivados y memoizados que usan solo funciones del dominio. Nunca se persisten (D-103).

**Comportamiento sin cambios:**

- Leer entidades al store no las modifica.
- Ningún valor derivado se guarda en LocalStorage (D-103).

**Verificación:** cambiar el store desde la consola dispara los suscriptores; los selectores devuelven los valores de la Fase 1.

---

## Fase 4 — UI base (`src/ui/`)

- [ ] **T-4.1** `App` y `Router`.
  - Router por hash (D-122): rutas `#/trips`, `#/trips/new`, `#/trip/{id}/today`, `/itinerary`, `/expenses`, `/summary`, `/settings`. Escucha `hashchange`; Atrás/Adelante y recargar conservan la pantalla.
- [ ] **T-4.2** `TripShell`: barra inferior en celular y menú lateral en escritorio. Abre en la pestaña inicial según el estado (D-061, design §3.5).
- [ ] **T-4.3** Componentes compartidos (design §3.4): `MoneyText`, `ConfirmDialog` (un aviso con todos los motivos), `CategoryCard`, `OverBudgetAlert`, `MoneyInput` (USD → centavos), `DayTabs`, `CategoryChips`, `CollapsibleSection`.

**Comportamiento sin cambios:**

- Dominio, repositorios y store (fases 1–3) no cambian: la UI solo lee selectores y llama servicios.
- La UI no calcula reglas ni accede a LocalStorage (design §2.1).

**Verificación:** navegar entre pestañas; el diseño cambia a menú lateral al ensanchar la ventana.

---

## Fase 5 — Mis viajes y Crear viaje (flujo 8.2)

- [ ] **T-5.1** `tripService.create`: valida, asigna el estado según las fechas y guarda `Trip` + `GlobalBudget`.
- [ ] **T-5.2** `TripListScreen`: grupos En curso / Planificados / Finalizados y estado vacío (D-085).
- [ ] **T-5.3** `TripCreateWizard` en 3 pasos (D-070). El paso 2 muestra en vivo el total en USD y el límite diario.
- [ ] **T-5.4** Paso 3: interruptor ON por defecto (D-068). Al activarlo se pide permiso de notificaciones.

**Cubre:** REQ-F-01A, REQ-F-01B, REQ-F-05, REQ-F-06, INV-28, INV-29.

**Comportamiento sin cambios:**

- El router y `TripShell` (Fase 4) siguen navegando igual.
- Los casos de la tabla de la Fase 1 dan los mismos resultados.
- Crear un viaje no modifica los otros viajes guardados.

**Verificación:** crear el viaje "Roma" del ejemplo (5 días, Comida $500) y ver Comida $100/día y total $1 500.00 · fin < inicio → error · inicio pasado → error · fechas cruzadas → mensaje de INV-29 · monto 0 → error.

---

## Fase 6 — Arranque, tiempo y pantalla Hoy

- [ ] **T-6.1** `main.js`: hidratar el store y ejecutar `tripService.refreshStatuses()`, que guarda el estado (D-106).
- [ ] **T-6.2** Eventos de tiempo: `visibilitychange` y un temporizador a las 00:00 (D-105).
- [ ] **T-6.3** `TodayScreen`: total disponible, 3 `CategoryCard` y actividades de hoy (D-062). Variantes `PLANNED` y `FINISHED`.

**Cubre:** REQ-F-03B, REQ-F-04B.

**Comportamiento sin cambios:**

- Mis viajes y Crear viaje (Fase 5) funcionan igual.
- `refreshStatuses` solo cambia `Trip.status`; ningún otro campo del viaje ni del presupuesto (D-106).

**Verificación:** con el reloj simulado, cambiar de día y ver el rollover; un viaje que empieza hoy queda `IN_PROGRESS`.

---

## Fase 7 — Gastos (flujos 8.1, 8.4 y 8.5)

- [ ] **T-7.1** `expenseService.register`, `update` y `delete`, con motivos y confirmación única.
- [ ] **T-7.2** `ExpenseForm`:
  - monto en USD (D-120);
  - fecha entre `startDate` y `min(hoy, endDate)` (D-055).
- [ ] **T-7.3** `OTHER` sin fondo → pedir crearlo, también en `FINISHED` (D-031, D-098).
- [ ] **T-7.4** `AddExpenseButton` desactivado en `PLANNED` (D-066).
- [ ] **T-7.5** `ExpensesScreen`: chips de categoría y gastos agrupados por día (D-090).

**Cubre:** REQ-F-03, REQ-F-04A, REQ-F-04B, REQ-F-18.

**Comportamiento sin cambios:**

- Sin gastos, Hoy muestra los mismos límites que en la Fase 6.
- Registrar, editar o eliminar un gasto no modifica el presupuesto, las actividades ni los `DailyForecastAlert` existentes (INV-26).
- Los gastos `OTHER` no cambian los límites diarios (INV-13).

**Verificación:** con tope de Comida $40 y disponible $30, un gasto de $45.68 da **un** solo aviso con los 2 motivos (disponible −$15.68) · un gasto de ayer baja el límite de hoy · editar $40 → $50 evalúa $10 · en `FINISHED` solo cambia `TotalTripSpent`.

---

## Fase 8 — Itinerario y actividades (flujo 8.6)

- [ ] **T-8.1** `activityService`: crear, editar y eliminar (D-076 a D-078). `estimatedCost` en USD.
- [ ] **T-8.2** `ItineraryScreen`: encabezado con lo planificado frente al presupuesto (D-050), `DayTabs` y lista ordenada por hora.
- [ ] **T-8.3** Sección "Fuera del viaje": eliminar o cambiar la fecha a un día válido, que la devuelve con `isDetached = false` (D-089).

**Comportamiento sin cambios:**

- Las actividades no afectan saldos, límites ni `TotalTripSpent` (8.6): Hoy y Gastos muestran los mismos valores antes y después de crear actividades.

**Verificación:** costo 0 permitido · fin ≤ inicio → error · si lo planificado supera el presupuesto, el encabezado se pone en rojo sin bloquear.

---

## Fase 9 — Resumen (D-091)

- [ ] **T-9.1** `SummaryScreen`: `TripTotalHeader`, `CategoryBreakdown` y `ReserveFundCard`. En `PLANNED`, sin la columna "Gastado"; el fondo se oculta si no existe.

**Comportamiento sin cambios:**

- Resumen es solo lectura: abrirlo no modifica datos.
- Sus totales coinciden con los de Hoy y Gastos.

**Verificación:** con los datos del wireframe, $1 240.00 de $1 375.00.

---

## Fase 10 — Ajustes (flujos 8.3 y 8.7)

- [ ] **T-10.1** `TripDataForm` y `ReminderToggle`.
- [ ] **T-10.2** `DatesForm` + `tripService.changeDates`, con bloqueos por estado (D-071 a D-073):
  - en `PLANNED`, las actividades se mueven con el viaje (D-072);
  - al acortar, se listan y desasocian las actividades que quedan fuera (REQ-F-13A).
- [ ] **T-10.3** `BudgetForm` + `budgetService.update`, con bloqueos por estado (D-079 a D-081) y el motivo "categoría por debajo de lo gastado".

**Cubre:** REQ-F-13A, REQ-F-13B, INV-27.

**Comportamiento sin cambios:**

- Editar datos del viaje o el recordatorio no cambia montos ni gastos.
- Cambiar fechas nunca deja gastos fuera del rango (D-094) ni modifica `DailyForecastAlert` pasados (INV-26).
- Editar el presupuesto no cambia los gastos ya registrados.

**Verificación:** acortar un viaje con actividades → listado y sección "Fuera del viaje" · en `IN_PROGRESS` no se puede cambiar `startDate` · los `DailyForecastAlert` pasados no cambian.

---

## Fase 11 — Resumen matutino (flujo 8.8)

- [ ] **T-11.1** `forecastService.ensureTodayAlert`: crea un `DailyForecastAlert` inmutable por día (INV-26, D-082).
- [ ] **T-11.2** Temporizador de las 08:00 con notificación si `isReminderActive` (D-035).
- [ ] **T-11.3** `MorningSummaryCard`, que se puede cerrar y se muestra una vez al día.

**Cubre:** REQ-F-02.

**Comportamiento sin cambios:**

- Generar el resumen no altera límites, gastos ni presupuesto.
- Con el recordatorio OFF, todo lo demás funciona igual.
- Un `DailyForecastAlert` ya creado no se regenera ni se actualiza al registrar gastos (INV-26).

**Verificación:** abrir a las 09:00 → tarjeta sin notificación · app abierta a las 07:59 → notificación a las 08:00 · con el recordatorio OFF, solo la tarjeta.

---

## Fase 12 — Duplicar y eliminar viaje

- [ ] **T-12.1** `tripService.duplicate` (D-057, D-058, D-095). Nombre prellenado "Copia de…" y actividades por día relativo.
- [ ] **T-12.2** `tripService.delete` con `deleteByTripId` en los 5 repositorios (D-086).

**Cubre:** REQ-F-19, REQ-F-20.

**Comportamiento sin cambios:**

- Duplicar no modifica el viaje original ni sus actividades o gastos.
- Eliminar un viaje no toca los datos de otros viajes.

**Verificación:** duplicar en un viaje más corto → aviso de actividades excluidas · eliminar libera las fechas.

---

## Fase 13 — Cierre

- [ ] **T-13.1** Revisión responsive (360 px, tablet y escritorio) y textos en español.
- [ ] **T-13.2** Recorrer la matriz de design §8.1 y marcar cada REQ como verificado.
- [ ] **T-13.3** Actualizar el README (estado del proyecto) y la retrospectiva.

**Comportamiento sin cambios:**

- El pulido visual no cambia reglas: se repite la verificación completa de las fases 1 a 12.
