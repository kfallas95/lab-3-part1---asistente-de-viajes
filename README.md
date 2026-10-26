# Asistente de Viajes

🔗 **App en línea:** https://kfallas95.github.io/lab-3-part1---asistente-de-viajes/

> **Nota — fecha simulada:** para probar cómo se comporta la app en otro día (el cambio de día a las 00:00, los estados del viaje o el resumen matutino de las 08:00) sin esperar, agrega `?today=AAAA-MM-DD` (y opcionalmente `&time=HH:MM`) a la dirección, antes del `#`. Por ejemplo:
> https://kfallas95.github.io/lab-3-part1---asistente-de-viajes/?today=2026-11-06&time=07:59
>
> El tiempo sigue avanzando desde esa hora y arriba aparece un aviso amarillo con el enlace **Volver a la fecha real**. Los datos se guardan en tu navegador (LocalStorage), así que cada persona empieza con la app vacía. Más detalles en [Probar con otra fecha](#probar-con-otra-fecha-d-123).

Aplicación web para **planificar viajes y controlar el presupuesto día a día** mientras se viaja. El cliente define un presupuesto por categoría y la app le dice cada día cuánto puede gastar en Comida, Transporte y Actividades. Lo que sobra o falta en un día se reparte automáticamente entre los días restantes.

## Estado del proyecto

**Implementada (Spec Driven Development).** La especificación, el contrato de datos, los wireframes y el diseño se definieron primero; después la app se construyó en 14 fases según el plan de `docs/tasks.md`, verificando cada fase a mano (D-112) con la regla de **comportamiento sin cambios**. La verificación final de cada requerimiento está al final de `docs/tasks.md`.

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

## Cómo ejecutar

Los módulos ES no cargan si se abre `index.html` con doble clic. Hay que servir la carpeta con un servidor local, por ejemplo:

1. Abrir la carpeta del proyecto en VS Code.
2. Instalar la extensión **Live Server**.
3. Clic derecho en `index.html` → **Open with Live Server** (o el botón **Go Live** de la barra inferior).

Se abre en `http://127.0.0.1:5500/index.html`. Los datos se guardan en el LocalStorage de ese navegador.

### Probar con otra fecha (D-123)

Para revisar el cambio de día, los estados del viaje o el resumen de las 08:00 sin esperar, se puede simular la fecha en la dirección:

```text
http://127.0.0.1:5500/index.html?today=2026-11-06&time=07:59#/trips
```

El tiempo sigue avanzando desde esa hora. Mientras la fecha está simulada aparece un aviso amarillo con el enlace **Volver a la fecha real** (D-127).

## Estructura del repositorio

```text
/
├── CLAUDE.md                # Memoria Semántica del proyecto
├── index.html               # Punto de entrada (carga src/main.js como módulo ES)
├── styles.css               # Estilos mobile-first
├── src/
│   ├── main.js              # Arranque: dependencias, hidratación y eventos de tiempo
│   ├── domain/              # Reglas y fórmulas puras (dinero, fechas, límites, validaciones)
│   ├── application/         # Servicios: viajes, presupuesto, gastos, actividades, resumen matutino
│   ├── infrastructure/      # LocalStorage, repositorios, reloj, notificaciones
│   ├── state/               # Store en memoria y selectores
│   └── ui/                  # Router, pantallas y componentes
├── docs/
│   ├── requirements.md      # Especificaciones formales en sintaxis EARS (Semana 2)
│   ├── data-contract.json   # Contrato de datos JSON/TS (Semana 2)
│   ├── wireframe.md         # Bocetos de interfaz (Semana 2)
│   ├── design.md            # ENTREGABLE PRINCIPAL: Documento de diseño y arquitectura
│   └── tasks.md             # Plan de implementación por fases y verificación final
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
| [`docs/tasks.md`](docs/tasks.md) | Plan de implementación por fases y verificación final de cada requerimiento |

## Autor

Kevin — UCenfotec.
