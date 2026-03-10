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
