# Estado del proyecto — SolWave Calendario

**Última actualización:** 2026-08-08

---

## Estrategia YouTube activa

**Periodo:** 8 ago – 31 oct 2026 (12 semanas)
**Estructura:** 2 canciones completas + 3 Shorts/semana
- Martes y Domingo → canciones completas
- Jueves, Viernes, Sábado → Shorts
- **19 publicaciones fijas** + **5 slots adaptativos** (semanas 8–12 según Analytics)
- Álbum bachata "Llegaste muy tarde" ya publicado completo en YouTube — **no repetir**

**Catálogo:** 87 canciones / 8 álbumes activos (+ "Donde Florece el Alma" pendiente de cargar)

---

## Reglas permanentes del agente

Cuando se informa de música nueva, el agente SIEMPRE aplica este protocolo:
1. Evalúa con `evaluate_new_music` antes de programar nada
2. Agrega al catálogo (Supabase) primero
3. Probar vía Shorts primero — no publicar completa hasta ver métricas
4. Solo 1-2 canciones candidatas a YouTube completo por álbum nuevo
5. Resto queda reservado para Solwave
6. Usa slots adaptativos (sem. 8–12) ANTES de desplazar publicaciones fijas
7. Valida títulos contra catálogo real antes de programar
8. **Agregar álbum nuevo ≠ publicar ese álbum completo en YouTube**

---

## Calendario YouTube v2 (validado 2026-08-08)

Archivo: `scripts/youtube-calendar.json` (v2.0)
Visualización: `scripts/yt-calendar-v2.html`

### Correcciones aplicadas vs versión anterior
| Slot | Antes | Después |
|------|-------|---------|
| W2 Jue Short | El Olor del Café | **El Café de las Ocho** |
| W3 Vie Short | Siempre Vuelvo a Mí (álbum Pop Soul/Balada) | **Siempre Vuelvo a Mí (álbum Volví a escucharme)** |
| W4 Vie Short | Volvió a Gustarme la Vida (Pop Soul/Balada) | **Volvió a Gustarme la Vida (Cumbia argentina)** |
| W5 Vie Short | Todo Florece a Su Tiempo (inválido) | **Esta Vez Me Hago Caso** |
| W6 Dom Completa | La Última Llamada | **Esta Es la Última Llamada** |
| W6 Jue Short | La Lluvia También Abraza (inválido) | **La Luz de la Ventana** |
| W8 Vie Short | Las Manos que Conozco (inválido) | **Sin Miedo a Sonreír** |
| W9 Jue Short | La Lluvia También Abraza (duplicado/inválido) | **Me Aprendí Sin Ti** |
| W9 Sáb Short | Hoy Empieza Todo (inválido) | **Aunque Tenga Miedo** |
| W10 Vie Short | El Banco del Parque (inválido) | **Despacio** |
| W11 Vie Short | Sin Miedo a Sonreír (duplicado) | **Siempre Sale el Sol** |
| W11 Sáb Short | Un Lugar Llamado Hogar (inválido) | **Después de la Lluvia** |
| W12 Jue Short | Donde el Tiempo Descansa (inválido) | **La Calma También Canta** |

---

## Catálogo por álbum (validado)

| Álbum | Género | Canciones | Estado YouTube |
|-------|--------|-----------|----------------|
| Llegaste muy tarde | Bachata | 11 | Álbum completo publicado |
| Ya no vuelvo atrás | Dancehall | 11 | Activo |
| Las pequeñas cosas | Indie Folk | 11 | Activo |
| Volví a escucharme | Pop Soul | 11 | Activo |
| Desde que llegaste | Regional romántico | 11 | Activo |
| Vuelvo a sentir la vida | Salsa | 10 | Activo |
| Hoy Empieza Algo Bueno | Cumbia argentina | 11 | Activo |
| Pop Soul/Balada | Pop Soul/Balada | 11 | Activo |
| Donde Florece el Alma | Folk/Flamenco | — | **Pendiente de cargar** |

---

## Slots adaptativos (semanas 8–12)

Se asignan según Analytics del mes 1 (agosto):
- **Sem 8 Dom:** álbum/canción con mayor retención + nuevos suscriptores
- **Sem 8 Sáb Short:** canción con mejor CTR en Shorts del mes 1
- **Sem 9 Mar, Sem 10 Mar, Sem 11 Mar, Sem 12 Mar:** género ganador

---

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `scripts/youtube-calendar.json` | Calendario YouTube v2 (fuente de verdad) |
| `scripts/yt-calendar-v2.html` | Visualización del calendario |
| `app/api/agente/route.ts` | Agente con estrategia YouTube permanente |
| `lib/calendar-algorithm.ts` | Algoritmo de distribución de fechas |
| `lib/seed-data.ts` | Datos iniciales del catálogo |

---

## Deploy

Plataforma: Vercel (auto-deploy desde rama `main`)
Variables de entorno requeridas en Vercel:
- `SUPABASE_URL` (runtime server)
- `SUPABASE_ANON_KEY` (runtime server)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `APP_PASSWORD`
