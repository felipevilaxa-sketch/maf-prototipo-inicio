# MAF · Prototipo Inicio

Prototipo en HTML, CSS y JavaScript de la pantalla de Inicio de la plataforma MAF (desktop y mobile), con el aviso de vencimiento de cuotas.

## Cómo usarlo

El switch flotante de abajo cambia los escenarios:

- **Créditos:** 1 o 2 créditos activos.
- **Vencimiento:** con 1 crédito, Al día / Por vencer / Vence hoy / Vencida. Con 2 créditos, Ambos al día / Uno por vencer / Estados distintos.

También se puede abrir un escenario directo con `?creditos=1` o `?creditos=2` en la URL.

## Correr en local

```
node serve.js
```

Después abre http://localhost:5173.

## Archivos

- `index.html`: estructura
- `styles.css`: estilos (tokens de color al inicio)
- `app.js`: datos de prueba, escenarios y lógica del aviso
- `assets/`: íconos e imágenes exportados de Figma
