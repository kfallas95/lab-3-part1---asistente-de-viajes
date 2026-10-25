# Wireframes — Asistente de Viajes

| | |
|---|---|
| **Versión** | v1 |
| **Fecha** | 2026-10-24 |
| **Base** | Wireframe original `[PDF §6]` · pantallas aprobadas en `CLAUDE.md` §7 (D-061, D-062, D-085, D-088, D-090 a D-092) · flujos de `CLAUDE.md` §8 |
| **Estilo visual** | El boceto de 4 pantallas se usa **solo como referencia de estilo** (paleta verde/crema, títulos serif, ilustraciones planas, tarjetas redondeadas). Sus elementos de reserva de viajes no forman parte del proyecto (D-005). |

Los wireframes son de baja fidelidad y están pensados primero para celular (D-060). La §9 muestra cómo se adapta el diseño a computadora. Los montos son ejemplos.

---

## 0. Del wireframe original a las pantallas aprobadas

El wireframe del PDF (§6) concentraba todo en una sola pantalla. Se aprobó dividirlo en pantallas con un solo propósito cada una (D-061):

| Sección del wireframe original | Pantalla aprobada |
|---|---|
| Mi Viaje (Parámetros) | Crear viaje (§2) · Ajustes (§8) |
| Recordatorio ON/OFF | Crear viaje, paso 3 · Ajustes |
| Itinerario (Simulación por días) | Itinerario (§4) |
| Presupuestos (Categorías) | Hoy (§3) · Resumen (§7) · Ajustes → Presupuesto |
| `[Itinerario]` `[Resumen B]` | Navegación Hoy · Itinerario · Gastos · Resumen ("Resumen B" era un ejemplo) |

```text
Mis viajes
  └─ [Viaje]
       ├─ Hoy
       ├─ Itinerario
       ├─ Gastos
       ├─ Resumen
       ├─ (+) Registrar gasto
       └─ Ajustes
```

---

## 1. Mis viajes (D-085)

```text
┌───────────────────────────────────┐
│ Mis viajes              [+ Nuevo] │
│                                   │
│ EN CURSO                          │
│ ┌───────────────────────────────┐ │
│ │ Roma 2026 · Italia          ⋯ │ │
│ │ 5–9 nov · Día 2 de 5          │ │
│ └───────────────────────────────┘ │
│ PLANIFICADOS                      │
│ ┌───────────────────────────────┐ │
│ │ París 2026 · Francia        ⋯ │ │
│ │ 15–20 dic · en 52 días        │ │
│ └───────────────────────────────┘ │
│ FINALIZADOS                       │
│ ┌───────────────────────────────┐ │
│ │ Lisboa 2026 · Portugal      ⋯ │ │
│ │ 1–5 ago · Gastaste $1 240.00  │ │
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
  ⋯ = Duplicar (REQ-F-19) · Eliminar (REQ-F-20)
```

Sin viajes: *"Aún no tienes viajes"* + botón **Crear mi primer viaje**.

---

## 2. Crear viaje — 3 pasos (D-070, flujo 8.2)

```text
 Paso 1 de 3 · Datos              Paso 2 de 3 · Presupuesto          Paso 3 de 3 · Recordatorio
┌─────────────────────────┐      ┌───────────────────────────┐      ┌─────────────────────────┐
│ Nombre   [Roma 2026   ] │      │ Divisa  [EUR ▾]           │      │ Resumen matutino        │
│ Lugar    [Roma        ] │      │ 1 USD = [0.926] EUR       │      │ a las 08:00             │
│ País     [Italia      ] │      │                           │      │                 [ ON ]  │
│ Inicio   [2026-11-05  ] │      │ DIARIAS        Total  Tope│      │                         │
│ Fin      [2026-11-09  ] │      │ Comida      [463 ] [50 ]  │      │ Te pediremos permiso    │
│ + Agregar preferencias  │      │ Transporte [185.2] [25 ]  │      │ para mostrar            │
│                         │      │ Actividades[231.5] [60 ]  │      │ notificaciones.         │
│ Duración: 5 días        │      │                           │      │                         │
│                         │      │ OPCIONALES                │      │                         │
│                         │      │ Tiquetes    [416.70]      │      │                         │
│                         │      │ Hospedaje   [      ]      │      │                         │
│                         │      │ Imprevistos [ 92.60]      │      │                         │
│                         │      │                           │      │                         │
│                         │      │ Total: €1 389 ≈ $1 500.00 │      │                         │
│                         │      │ Límite diario Comida $100 │      │                         │
│          [Siguiente →]  │      │ [← Atrás] [Siguiente →]   │      │ [← Atrás]   [Guardar]   │
└─────────────────────────┘      └───────────────────────────┘      └─────────────────────────┘
```

Los montos y topes del presupuesto se ingresan en la divisa del viaje y la app muestra su equivalente en USD (D-096). Validaciones visibles: campos obligatorios (INV-02), inicio ≥ hoy (INV-28), inicio ≤ fin (REQ-F-05), sin cruce con otro viaje (INV-29), montos > 0 (REQ-F-06).

---

## 3. Hoy (D-062)

```text
┌───────────────────────────────────┐
│ ← Roma · Día 2 de 5            ⚙  │
│                                   │
│ ┌ ☀ Buenos días ─────────────── ✕┐│  ← REQ-F-02 (v6), 1 vez al día
│ │ Para hoy en Roma tienes        ││
│ │ disponible: $50.00 en Comida…  ││
│ └────────────────────────────────┘│
│                                   │
│ Total disponible hoy              │
│ $65.00  de $105.00                │
│                                   │
│ ┌ Comida ───────────────────────┐ │
│ │ Te quedan $30.00              │ │
│ │ de $50.00     ████████░░░░░░  │ │
│ └───────────────────────────────┘ │
│ ┌ Transporte ───────────────── ⚠┐ │  ← rojo (REQ-F-04B)
│ │ Te quedan −$5.00              │ │
│ │ de $15.00     ██████████████  │ │
│ └───────────────────────────────┘ │
│ ┌ Actividades ──────────────────┐ │
│ │ Te quedan $40.00              │ │
│ │ de $40.00     ░░░░░░░░░░░░░░  │ │
│ └───────────────────────────────┘ │
│                                   │
│ ACTIVIDADES DE HOY                │
│ 10:00  Coliseo                    │
│ 15:00  Trastevere            (+)  │
├───────────────────────────────────┤
│  Hoy   Itinerario  Gastos  Resumen│
└───────────────────────────────────┘
```

| Estado | Contenido |
|---|---|
| `PLANNED` | *"Tu viaje comienza en X días"* + límite diario que tendrá cada categoría |
| `FINISHED` | *"Tu viaje terminó"* + enlace a Resumen |

---

## 4. Itinerario (D-088, D-089)

```text
┌───────────────────────────────────┐
│ Planificado $160.00 de $250.00    │
│ ██████████░░░░░                   │  ← rojo + alerta si se excede (D-050)
│                                   │
│ Día 1  [Día 2]  Día 3  Día 4  Día 5
│                                   │
│ 10:00–12:00  Coliseo              │
│   📍 Piazza del Colosseo  $25.00  │
│ 15:00–17:00  Trastevere           │
│   📍 Trastevere            $0.00  │
│                                   │
│ [+ Agregar actividad]             │
│                                   │
│ ▸ Fuera del viaje (1)             │  ← plegable (REQ-F-13A v6)
├───────────────────────────────────┤
│  Hoy   Itinerario  Gastos  Resumen│
└───────────────────────────────────┘
```

---

## 5. Gastos (D-090)

```text
┌───────────────────────────────────┐
│ [Todos] Comida Transp. Activ. Otros
│                                   │
│ HOY · 6 nov              $57.68   │
│ 🍽 Cena en Trastevere    $45.68   │
│    €42.30 · 1 USD = 0.926 EUR     │
│ 🚕 Taxi al Coliseo       $12.00   │
│                                   │
│ AYER · 5 nov             $95.10   │
│ …                                 │
├───────────────────────────────────┤
│  Hoy   Itinerario  Gastos  Resumen│
└───────────────────────────────────┘
```

Al tocar un gasto se abre su edición (flujo 8.4) o eliminación (flujo 8.5).

---

## 6. Registrar gasto (flujo 8.1)

Este wireframe se deriva de los campos y reglas del flujo 8.1; no tiene una decisión de pantalla propia.

```text
┌───────────────────────────────────┐
│ Nuevo gasto                    ✕  │
│                                   │
│ Monto      [ 42.30 ]  Divisa [EUR▾]
│ 1 USD = [ 0.926 ] EUR             │  ← prellenada, editable (D-064, D-067)
│ ≈ $45.68                          │
│                                   │
│ Categoría  (•)Comida ( )Transporte│
│            ( )Actividades ( )Otros│
│ Concepto   [Cena en Trastevere  ] │
│ Fecha      [2026-11-06]           │
│                                   │
│                       [Guardar]   │
└───────────────────────────────────┘
```

Confirmación única cuando hay motivos (INV-15):

```text
┌───────────────────────────────────┐
│ ¿Confirmas este gasto?            │
│                                   │
│ • Supera tu tope de €50.00        │
│   (≈ $54.00) en Comida.           │
│ • Deja tu disponible de Comida de │
│   hoy en −$15.68.                 │
│                                   │
│        [Cancelar]  [Confirmar]    │
└───────────────────────────────────┘
```

El botón (+) aparece desactivado mientras el viaje está `PLANNED`: *"Podrás registrar gastos cuando inicie tu viaje"* (D-066).

---

## 7. Resumen (D-091)

```text
┌───────────────────────────────────┐
│ Costo total del viaje             │
│ $1 240.00 de $1 375.00            │
│ Te quedan $135.00                 │
│                                   │
│ POR CATEGORÍA   Gastado / Planif. │
│ Comida          $310 / $350  ███░ │
│ Transporte      $ 95 / $ 75  ████⚠│
│ Actividades     $140 / $200  ██░░ │
│ Tiquetes        $450              │
│ Hospedaje       $200              │
│                                   │
│ FONDO DE IMPREVISTOS              │
│ Usado $45 de $100 · Quedan $55    │
├───────────────────────────────────┤
│  Hoy   Itinerario  Gastos  Resumen│
└───────────────────────────────────┘
```

En `PLANNED` se muestra solo el presupuesto planificado, sin la columna "Gastado". El fondo de imprevistos se oculta si no existe.

---

## 8. Ajustes (D-092, D-093)

```text
┌───────────────────────────────────┐
│ Ajustes · Roma 2026               │
│                                   │
│ Datos del viaje                ›  │
│ Fechas                         ›  │  ← flujo 8.3 (bloqueos por estado)
│ Presupuesto                    ›  │  ← flujo 8.7 (bloqueos por estado)
│ Recordatorio matutino     [ ON ]  │
│                                   │
│ Duplicar viaje                 ›  │
│ Eliminar viaje                    │  ← en rojo
└───────────────────────────────────┘
```

---

## 9. Versión de computadora (D-060, D-061)

```text
┌────────────────┬───────────────────────────────────────────────┐
│ Roma 2026      │  Total disponible hoy  $65.00 de $105.00      │
│                │                                               │
│ ▸ Hoy          │  ┌ Comida ──────┐ ┌ Transporte ⚠┐ ┌ Activ. ─┐ │
│   Itinerario   │  │ $30 de $50   │ │ −$5 de $15  │ │ $40/$40 │ │
│   Gastos       │  └──────────────┘ └─────────────┘ └─────────┘ │
│   Resumen      │                                               │
│                │  ACTIVIDADES DE HOY                           │
│ + Gasto        │  10:00 Coliseo · 15:00 Trastevere             │
│ ⚙ Ajustes      │                                               │
└────────────────┴───────────────────────────────────────────────┘
```

Las pantallas y el contenido son los mismos que en celular. La barra inferior pasa a ser un menú lateral y las tarjetas se acomodan en columnas.
