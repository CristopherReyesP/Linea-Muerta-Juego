# Recordatorio - Adivina la Linea (Por corregir)

**Estado:** El juego no termina correctamente

---

## Problema

- El tiempo de llamadas termina
- Los jugadores envían sus respuestas
- Pero los resultados no se leen/procesan
- El juego no termina con las estadísticas

---

## Archivos a revisar

- `server/src/minigames/AdivinaLinea.ts` - lógica del juego

---

## Lo que hay que hacer

1. Revisar cómo se procesan las respuestas/votos
2. Asegurar que se calculen los resultados cuando termina la fase
3. Asegurar que se llame a `emitComplete()` con el resultado correcto
4. Verificar que se muestren las estadísticas al final

---

## Mini-Juegos disponibles (MINIGAME_REGISTRY)

ubicado en: `server/src/MetaGame.ts:17`

| ID | Nombre | Descripción |
|----|--------|-------------|
| cooperar-traicionar | Cooperar o Traicionar | Negocia por teléfono y decide: cooperar o traicionar |
| votacion-sobra | Quien Sobra? | Vota por quien domina demasiado |
| votacion-merece | Quien Merece? | Vota por quien merece seguir |
| adivina-linea | Adivina la Linea | Voces distorsionadas, adivina quién está |

---

## Notas

- El sistema de sesiones ya está implementado (5 mini-juegos por sesión)
- El sistema de rachas (bonus/penalización) está en `CooperarTraicionar.ts`
- Las votaciones están en `VotacionSobra.ts` y `VotacionMerece.ts`
