# Cola de publicación — Divulgación

Este archivo vive solo en la rama `claude/divulgacion-web-section-mijzw6` (no se
fusiona a `main`), así que no aparece en la web pública. Sirve para llevar el
orden de publicación cuando hay varios artículos montados pero pendientes de
salir en la cadencia semanal acordada.

Cómo funciona:
1. Cuando llega un artículo nuevo, se monta entero en esta rama (página HTML,
   tarjeta en `divulgacion.html`, entrada en `sitemap.xml`) en un commit propio,
   y se añade una fila aquí con el hash de ese commit.
2. En cada publicación semanal, se coge la fila más antigua con estado
   `pendiente`, se hace `git cherry-pick <hash>` sobre `main`, se hace
   `git push origin main`, y se marca aquí como `publicado` con la fecha real.

| Slug | Commit | Estado | Programado para | Publicado el |
|---|---|---|---|---|
| como-se-calcula-el-irpf-de-tu-nomina | bd2bf6a | publicado | 2026-08-09 | 2026-08-09 |
| por-que-me-descuentan-tanto-de-la-nomina | 4ace9c3 | publicado (a petición expresa, fuera de cola) | 2026-08-09 | 2026-08-09 |
