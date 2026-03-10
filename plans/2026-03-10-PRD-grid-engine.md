Aquí tienes **solo los archivos Markdown** listos para usar en un repo.

---

# `PRD-grid-engine.md`

```markdown
# PRD — Grid Engine

## 1. Visión

Construir un motor de grid de alto rendimiento para aplicaciones web que permita visualizar y editar datos tabulares con una experiencia similar a hojas de cálculo modernas.

El motor debe priorizar:

- rendimiento
- navegación por teclado
- extensibilidad
- control total por parte del desarrollador

Este módulo constituye la base de todo el sistema.

---

# 2. Objetivos

## Objetivos principales

- Renderizar grids grandes de forma eficiente
- Permitir edición de celdas
- Soportar selección de rangos
- Permitir navegación completa con teclado
- Ofrecer una API programática robusta

## Objetivos secundarios

- Permitir personalización profunda
- Facilitar integración con frameworks

---

# 3. Métricas de éxito

- Renderizar **100k filas virtualizadas sin lag perceptible**
- Navegación por teclado < **16ms**
- Tamaño del bundle core < **40kb**
- API completamente tipada en TypeScript

---

# 4. Usuarios

## Usuario final

Personas que interactúan con el grid:

- analistas
- operadores
- gestores

## Desarrollador integrador

- integra el grid en una app
- controla comportamiento y eventos

---

# 5. Casos de uso

### CU1 — Visualizar datos tabulares

El usuario visualiza datasets estructurados.

### CU2 — Editar una celda

El usuario cambia el valor de una celda.

### CU3 — Navegar con teclado

El usuario recorre el grid sin usar ratón.

### CU4 — Seleccionar rangos

El usuario selecciona múltiples celdas.

### CU5 — Copiar y pegar

El usuario mueve datos desde/hacia spreadsheets.

---

# 6. Funcionalidades

## 6.1 Renderizado de grid

El sistema debe permitir:

- filas virtualizadas
- columnas configurables
- encabezados
- layout consistente

Configuración mínima:

```

rows
columns
data

```

---

## 6.2 Modelo de datos

Debe soportar:

```

array[][]
array<object>
data source custom

```

API ejemplo:

```

getCell(row, col)
setCell(row, col, value)
updateRow(row)

```

---

## 6.3 Selección

Tipos de selección:

- celda única
- rango rectangular
- fila completa
- columna completa

Evento:

```

onSelectionChange

```

---

## 6.4 Navegación teclado

Teclas soportadas:

```

Arrow keys
Tab
Shift + Tab
Enter
Shift + Enter
Home
End
PageUp
PageDown

```

---

## 6.5 Edición de celdas

Modo edición:

- doble click
- tecla
- API

Tipos base:

```

text
number
date
boolean

```

---

## 6.6 Copy / paste

Debe soportar:

- copiar rangos
- pegar tablas
- interoperabilidad con Excel

Formato esperado:

```

tab separated values

```

---

## 6.7 Scroll y virtualización

Requisitos:

- virtualización vertical
- buffer de renderizado
- scroll fluido

Objetivo:

```

100k+ filas

```

---

# 7. API pública

Ejemplos:

```

grid.select(range)
grid.focusCell(row, col)
grid.startEdit(row, col)
grid.stopEdit()
grid.scrollTo(row)

```

---

# 8. Eventos

```

cellClick
cellEditStart
cellEditCommit
cellEditCancel
selectionChange
paste
copy
focusChange

```

---

# 9. Requisitos no funcionales

## rendimiento

- virtualización obligatoria
- render incremental

## mantenibilidad

- arquitectura modular

## tipado

- TypeScript first

---

# 10. Arquitectura

Arquitectura sugerida:

```

core/
grid-engine
selection-engine
navigation-engine
editing-engine
virtualization-engine

```

Adapters:

```

react
vue
angular

```

---

# 11. MVP

Primera versión incluye:

- renderizado de grid
- selección de celdas
- edición básica
- copy/paste
- virtualización
```

---

# `PRD-spreadsheet-features.md`

```markdown
# PRD — Spreadsheet Features

## 1. Visión

Expandir el Grid Engine para ofrecer capacidades avanzadas de spreadsheet similares a Excel o Google Sheets.

Este módulo añade funcionalidades orientadas al usuario final.

---

# 2. Objetivos

- Permitir fórmulas
- Permitir autofill
- Permitir undo / redo
- Permitir múltiples hojas
- Mejorar formato de celdas

---

# 3. Funcionalidades

## 3.1 Fórmulas

Ejemplos:

```

=A1 + B1
=SUM(A1:A10)
=AVG(B1:B5)

```

Requisitos:

- parser de fórmulas
- motor de cálculo
- dependencia entre celdas

---

## 3.2 Autofill

Permitir arrastrar la esquina de una celda para generar patrones.

Ejemplo:

```

1
2
3

```

↓

```

1
2
3
4
5

```

---

## 3.3 Undo / Redo

Stack de operaciones.

Operaciones registradas:

- edición
- pegado
- inserciones

---

## 3.4 Multi-sheet

Modelo:

```

Workbook
sheets[]

```

---

## 3.5 Formato de celda

Tipos soportados:

```

currency
percentage
date
custom format

```

---

## 3.6 Merged cells

Permitir:

```

merge
unmerge

```

---

# 4. Métricas de éxito

- cálculos < 50ms
- dependencias consistentes
- experiencia similar a Excel
```

---

# `PRD-developer-platform.md`

```markdown
# PRD — Developer Platform

## 1. Visión

Convertir la librería de grid en una plataforma extensible para desarrolladores que permita crear funcionalidades avanzadas mediante plugins, renderers personalizados e integración flexible de datos.

---

# 2. Objetivos

- permitir extensibilidad
- permitir renderers personalizados
- facilitar integración con APIs
- ofrecer gran experiencia de desarrollo

---

# 3. Sistema de plugins

Arquitectura plugin:

```

grid.use(plugin)

```

Plugins posibles:

- formulas
- filters
- charts
- pivot tables

---

# 4. Renderers personalizados

Permitir renderers custom:

```

custom cell component

```

Ejemplos:

```

user avatar cell
status badge
dropdown
progress bar

```

---

# 5. Integración de datos

Modos soportados:

```

client side
server side
streaming

```

---

# 6. Server mode

Permitir delegar en backend:

- sorting
- filtering
- pagination

---

# 7. Theming

Sistema de temas:

```

light
dark
custom

```

---

# 8. Developer Experience

Requisitos:

- documentación clara
- ejemplos prácticos
- playground interactivo

---

# 9. SDK

Exportar:

```

types
hooks
utilities
plugins

```

---

# 10. Métricas de éxito

- onboarding < 10 min
- integración React < 20 líneas
- API estable y consistente
```

---

Si quieres, también puedo darte algo **MUY útil para tu caso de Spec-Driven Development con OpenCode**:

* `spec.md`
* `architecture.md`
* `tasks.md`
* `acceptance_criteria.md`

Es el formato que mejor funciona cuando los **agentes implementan el proyecto automáticamente**.

