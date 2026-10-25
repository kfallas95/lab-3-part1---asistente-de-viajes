# Asistente de Viajes

Aplicación web para **planificar viajes y controlar el presupuesto día a día** mientras se viaja. El cliente define un presupuesto por categoría y la app le dice cada día cuánto puede gastar en Comida, Transporte y Actividades. Lo que sobra o falta en un día se reparte automáticamente entre los días restantes.

## Estado del proyecto

**Fase de especificación (Spec Driven Development).** La especificación, el contrato de datos, los wireframes y el diseño están definidos. La implementación es la siguiente fase (`docs/tasks.md`).

## Funcionalidades principales

- **Mis viajes:** crear, duplicar y eliminar viajes, sin fechas superpuestas.
- **Presupuesto por categoría** en USD (no se aceptan otras divisas).
- **Límite diario dinámico:** `(Total de la categoría − gastado en días anteriores) ÷ días restantes`.
- **Registro de gastos** con tope por gasto (`ExpenseCap`) y una sola confirmación cuando un gasto excede el tope o el disponible.
- **Alertas visuales de sobrecosto**, sin notificaciones por cada gasto.
- **Resumen matutino** a las 08:00 (notificación del navegador si la app está abierta, o en pantalla al abrirla).
- **Itinerario por días** con lo planificado frente al presupuesto de Actividades.
- **Resumen del viaje:** costo total real frente a lo planificado.
- **Fondo de imprevistos** opcional.

## Tecnología

| | |
|---|---|
| Lenguaje | JavaScript, sin framework de UI (D-107, D-110) |
| Build | Ninguno: módulos ES nativos (D-113) |
| Persistencia | LocalStorage del navegador; sin backend ni servicios externos (D-001, D-016, D-063) |
| Interfaz | Mobile-first y responsive; textos en español (D-019, D-060) |
| Arquitectura | Capas UI / Estado / Aplicación / Dominio / Infraestructura con patrón repositorio (D-018, D-101) |

## Cómo ejecutar (cuando exista el código)

Los módulos ES no cargan si se abre `index.html` con doble clic. Hay que servir la carpeta con un servidor local, por ejemplo:

1. Abrir la carpeta del proyecto en VS Code.
2. Instalar la extensión **Live Server**.
3. Clic derecho en `index.html` → **Open with Live Server**.

## Estructura del repositorio

```text
/
├── CLAUDE.md                # Memoria Semántica del proyecto
├── docs/
│   ├── requirements.md      # Especificaciones formales en sintaxis EARS (Semana 2)
│   ├── data-contract.json   # Contrato de datos JSON/TS (Semana 2)
│   ├── wireframe.md         # Bocetos de interfaz (Semana 2)
│   └── design.md            # ENTREGABLE PRINCIPAL: Documento de diseño y arquitectura
├── README.md                # Resumen y descripción del proyecto
└── retrospective.md         # Respuestas a las preguntas de reflexión
```

## Documentación

| Documento | Para qué sirve |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Fuente de verdad del proyecto: términos, reglas del dominio y registro de decisiones con su motivo |
| [`docs/requirements.md`](docs/requirements.md) | Qué debe hacer el sistema |
| [`docs/data-contract.json`](docs/data-contract.json) | Estructura y validaciones de los datos |
| [`docs/wireframe.md`](docs/wireframe.md) | Cómo se ve cada pantalla |
| [`docs/design.md`](docs/design.md) | Cómo se construye y cómo cada requerimiento se cumple en el diseño |

## Autor

Kevin — UCenfotec.
