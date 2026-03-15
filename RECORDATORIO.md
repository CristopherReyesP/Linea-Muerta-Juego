# Recordatorio - Adivina la Linea (CORREGIDO)

**Estado:** Bugs corregidos

---

## Problemas encontrados y corregidos

### 1. Bug de startPhase recursivo
- Cuando todos enviaban respuestas en CALL_PHASE, `onGuessingPhaseStart()` saltaba a RESULT_PHASE recursivamente
- El `startPhase(GUESSING_PHASE)` continuaba despues, sobreescribiendo el timer de 8s con uno de 30s
- **Fix:** Se agrego un early return despues de `onGuessingPhaseStart()` si la fase ya cambio

### 2. Scoring incorrecto con 0 aciertos
- `getTopScorerIds()` retornaba TODOS los jugadores con 0 aciertos como "ganadores"
- Esto daba +1 punto global inmerecido en MetaGame
- **Fix:** Solo retorna jugadores con `maxScore > 0`

### 3. Fuga de respuestas (seguridad)
- `sendLineAssignments()` enviaba el `playerId` real de cada linea a todos los clientes
- Un jugador podia inspeccionar los datos y saber quien era cada linea sin llamar
- **Fix:** Solo se envian los numeros de linea, sin el playerId

### 4. Perdida de estado del GuessPanel
- Al cambiar de CALL_PHASE a GUESSING_PHASE, el componente se desmontaba/remontaba
- Las respuestas guardadas durante la fase de llamadas se perdian visualmente
- **Fix:** Se agrego useEffect para restaurar las respuestas previas del store al montar

---

## Archivos modificados

- `server/src/minigames/AdivinaLinea.ts` - fixes 1, 2, 3
- `server/src/types.ts` - actualizado tipo de line_assignments
- `client/src/store/gameStore.ts` - actualizado tipo de lineAssignments
- `client/src/components/GuessPanel.tsx` - fix 4

---

## Mini-Juegos disponibles (MINIGAME_REGISTRY)

ubicado en: `server/src/MetaGame.ts:17`

| ID | Nombre | Descripcion |
|----|--------|-------------|
| cooperar-traicionar | Cooperar o Traicionar | Negocia por telefono y decide: cooperar o traicionar |
| votacion-sobra | Quien Sobra? | Vota por quien domina demasiado |
| votacion-merece | Quien Merece? | Vota por quien merece seguir |
| adivina-linea | Adivina la Linea | Voces distorsionadas, adivina quien esta |
| la-bomba | La Bomba | Desactiva o pasa la bomba |
| central-emergencias | Central de Emergencias | Tecnicos y saboteador transmiten pistas |
| emoji-diferente | Emoji Diferente | Descubre quien tiene el emoji diferente |

---

## Notas

- El sistema de sesiones ya esta implementado (5 mini-juegos por sesion)
- El sistema de rachas (bonus/penalizacion) esta en `CooperarTraicionar.ts`
- Las votaciones estan en `VotacionSobra.ts` y `VotacionMerece.ts`
