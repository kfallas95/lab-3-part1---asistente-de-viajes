# Retrospectiva — Parte 2 (Implementación)

> La retrospectiva de la Parte 1 (especificación y diseño) está en [`retrospective.md`](retrospective.md).

---

## 1. Arquitectura Orientada a IA

**¿Cómo facilitó la organización de los archivos de contexto (`CLAUDE.md`, `tasks.md`, `requirements.md`) el trabajo del agente de IA al momento de generar, corregir o refactorizar el código?**

Podría decir que fue lo mejor, ya que se pudo trabajar de forma ordenada. Siento que no fue tanto el trabajo que se hizo una vez que los md estaban subidos. Sí se tuvieron que hacer algunas correcciones para que todo tenga sentido.

El `tasks.md` ayudó mucho porque dividía el trabajo en fases pequeñas. Se terminaba una fase, yo la probaba y solo después se pasaba a la siguiente, así era fácil saber qué faltaba y encontrar los errores a tiempo.

---

## 2. Auditoría de Insumos

**¿Qué inconsistencias o vacíos descubriste al revisar y armonizar tu contrato de datos JSON con las especificaciones EARS antes de comenzar a programar?**

Al revisar todo antes de programar encontré varias cosas que no cuadraban. La más grande fue el tema de las divisas: el contrato tenía campos para otra moneda y tasa de cambio, pero no estaba claro en qué moneda se ingresaban algunos montos. Al final decidí que todo fuera en USD, y eso simplificó mucho el contrato.

---

## 3. Mantenibilidad y Unchanged Behavior

**¿Qué diferencia notaste al solicitar correcciones bajo la regla de Unchanged Behavior frente a las modificaciones a ciegas realizadas en el primer laboratorio?**

En el primer laboratorio la IA arreglaba lo que le pedía, pero yo no sabía qué más había cambiado detrás de ese arreglo. Con la regla de Unchanged Behavior cada fase decía qué debía seguir funcionando igual, y después de cada cambio se volvía a probar. Por ejemplo, cuando encontré los errores de las fechas al crear un viaje, se corrigieron solo en ese formulario y se comprobó que lo demás seguía igual. Así tenía más control y confianza en cada cambio.

---

## 4. Evaluación de Satisfacción (Verbal / Individual)

**Presentación rápida de 1 minuto al profesor verificando el cumplimiento de las reglas del negocio, la presencia del archivo de retrospectiva y la estructura de archivos optimizada para IA.**

Se presenta de forma verbal en clase.
