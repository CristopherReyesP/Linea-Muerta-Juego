import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'es' | 'en'

const LANGUAGE_STORAGE_KEY = 'lm_language'

function detectPreferredLanguage(): Language {
  if (typeof window === 'undefined') return 'es'

  const browserLanguages = window.navigator.languages ?? [window.navigator.language]
  const normalized = browserLanguages
    .filter(Boolean)
    .map((entry) => entry.toLowerCase())

  return normalized.some((entry) => entry.startsWith('en')) ? 'en' : 'es'
}

const englishTranslations: Record<string, string> = {
  'Confia en la linea.': 'Trust the line.',
  'Conectando al servidor...': 'Connecting to server...',
  'Tu nombre': 'Your name',
  'CREAR SALA': 'CREATE ROOM',
  'UNIRSE CON CODIGO': 'JOIN WITH CODE',
  'Salas publicas': 'Public rooms',
  'No hay salas publicas abiertas ahora mismo.': 'No public rooms are open right now.',
  'disponible siempre mientras este en lobby': 'always available while it stays in lobby',
  'sala vacia': 'empty room',
  'ABRIR CHAT PRINCIPAL': 'OPEN MAIN CHAT',
  'CHAT PRINCIPAL': 'MAIN CHAT',
  'CERRAR': 'CLOSE',
  'Los mensajes aparecen aqui. Puedes pedir codigo, avisar que vas a crear sala o decir a cual entraran.': 'Messages appear here. Ask for a code, say you are creating a room, or tell others which room to join.',
  'Aun no hay mensajes en el chat principal.': 'There are no messages in the main chat yet.',
  'Escribe al chat principal...': 'Write in main chat...',
  'Escribe tu nombre para enviar mensajes': 'Enter your name to send messages',
  'ENVIAR': 'SEND',
  'escribio en el chat': 'wrote in chat',
  'CREAR SALA PRIVADA': 'CREATE PRIVATE ROOM',
  'CREAR SALA PUBLICA': 'CREATE PUBLIC ROOM',
  'UNIRSE A SALA PUBLICA': 'JOIN PUBLIC ROOM',
  'CONTINUAR': 'CONTINUE',
  'UNIRSE': 'JOIN',
  'VOLVER': 'BACK',
  'UNIRSE A SALA': 'JOIN ROOM',
  'Codigo de sala...': 'Room code...',
  'ELIGE TU AVATAR': 'CHOOSE YOUR AVATAR',
  'MASCARAS': 'MASKS',
  'ACCESORIOS': 'ACCESSORIES',
  'PREMIUM': 'PREMIUM',
  'SIGUIENTE MINIJUEGO': 'NEXT MINIGAME',
  'SESION FINALIZADA': 'SESSION COMPLETE',
  'VICTORIA GLOBAL': 'GLOBAL VICTORY',
  'DERROTA': 'DEFEAT',
  'CLASIFICACION FINAL': 'FINAL STANDINGS',
  'HISTORIAL DE MINIJUEGOS': 'MINIGAME HISTORY',
  'NUEVA SESION': 'NEW SESSION',
  'MINIJUEGO': 'MINIGAME',
  'COMPLETADO': 'COMPLETED',
  'Ganador': 'Winner',
  'SCOREBOARD GLOBAL': 'GLOBAL SCOREBOARD',
  'VOZ ABIERTA - TODOS PUEDEN HABLAR': 'OPEN VOICE - EVERYONE CAN TALK',
  'MICROFONO APAGADO': 'MIC OFF',
  'MICROFONO ENCENDIDO': 'MIC ON',
  'MODO DESARROLLADOR LOCAL': 'LOCAL DEVELOPER MODE',
  'Antes de continuar puedes elegir manualmente el siguiente minijuego.': 'Before continuing, you can manually choose the next minigame.',
  'Esperando al anfitrion...': 'Waiting for the host...',
  'FASE DE LLAMADA': 'CALL PHASE',
  'FASE DE DECISION': 'DECISION PHASE',
  'RESULTADOS': 'RESULTS',
  'FIN DEL PROTOCOLO': 'END OF PROTOCOL',
  'JUGADORES ACTIVOS': 'ACTIVE PLAYERS',
  'RONDA': 'ROUND',
  'Reglas del juego': 'Game rules',
  'TIP RAPIDO': 'QUICK TIP',
  'Reglas completas en el icono `?`': 'Full rules in the `?` icon',
  'QUE HACER AHORA': 'WHAT TO DO NOW',
  'TIENES LA BOMBA': 'YOU HAVE THE BOMB',
  'TU MISION': 'YOUR MISSION',
  'Fase de llamada': 'Call phase',
  'BLOC DE CABINA': 'CABIN NOTES',
  'Solo lo ves tu': 'Only you can see this',
  'ABRIR': 'OPEN',
  'OCULTAR': 'HIDE',
  'Anota sospechas, promesas, pistas o nombres...': 'Write down suspicions, promises, clues, or names...',
  'Se guarda durante esta sesion del navegador.': 'It stays saved during this browser session.',
  'CANAL GLOBAL': 'GLOBAL CHANNEL',
  'BROADCAST DE CABINA': 'CABIN BROADCAST',
  'El canal esta en espera. Una senal bien puesta puede cambiar la lectura de la sala.': 'The channel is idle. A well-timed signal can change how the room reads the game.',
  'HISTORIAL RECIENTE': 'RECENT HISTORY',
  'PUBLICAR SENAL': 'SEND SIGNAL',
  'Sin broadcast reciente.': 'No recent broadcast.',
  'REGLAS': 'RULES',
  'Canal en recarga': 'Channel cooldown',
  'MINIJUEGO DE ESPERA': 'WAITING MINIGAME',
  'CODIGO DE SALA': 'ROOM CODE',
  'Click para copiar': 'Click to copy',
  'VOZ ABIERTA': 'OPEN VOICE',
  'MIC OFF': 'MIC OFF',
  'MIC ON': 'MIC ON',
  'SELECCIONA MINIJUEGOS A PROBAR': 'SELECT MINIGAMES TO TEST',
  'INICIAR PARTIDA': 'START MATCH',
  'Comparte el codigo para que otros se unan': 'Share the code so others can join',
  'Todavia no hay mensajes. Puedes decir en que sala vas, avisar que faltan jugadores o romper el hielo.': 'There are no messages yet. You can say which room you are joining, mention missing players, or break the ice.',
  'Escribe algo corto...': 'Write something short...',
  'ENTENDIDO': 'UNDERSTOOD',
  'Habla poco, escucha mucho y decide en secreto.': 'Speak little, listen carefully, and decide in secret.',
  'En este juego la identidad importa: no reveles demasiado pronto.': 'In this game identity matters: do not reveal too much too soon.',
  'Si tienes la bomba, cada segundo cuenta. Mira primero tus acciones.': 'If you have the bomb, every second matters. Check your actions first.',
  'No todos tienen la misma informacion. Compara antes de concluir.': 'Not everyone has the same information. Compare before jumping to conclusions.',
  'Observa patrones: el diferente suele dudar mas al describirse.': 'Watch patterns: the odd one often hesitates more when describing themselves.',
  'Escucha a todos antes de votar: la sala castiga decisiones impulsivas.': 'Listen to everyone before voting: the room punishes impulsive choices.',
  'Habla con otros jugadores y negocia tu decision.': 'Talk to other players and negotiate your decision.',
  'Elige en secreto si cooperas o traicionas.': 'Choose in secret whether you cooperate or betray.',
  'Revisa el resultado de la ronda y como cambio cada saldo.': 'Check the round result and how each balance changed.',
  'Discute quien esta dominando demasiado la sesion.': 'Discuss who is dominating the session too much.',
  'Vota por quien sobra. No puedes votarte a ti mismo.': 'Vote for who does not belong. You cannot vote for yourself.',
  'Se mostrara quien perdio punto global por la votacion.': 'It will show who lost a global point because of the vote.',
  'Habla y decide quien merece ser reconocido.': 'Talk and decide who deserves to be recognized.',
  'Vota por quien merece el punto. No puedes votarte.': 'Vote for who deserves the point. You cannot vote for yourself.',
  'Se mostrara quien gano punto global por la votacion.': 'It will show who gained a global point because of the vote.',
  'Llama a las lineas, escucha pistas y ve armando tus sospechas.': 'Call the lines, listen for clues, and build your suspicions.',
  'Asigna un nombre a cada linea antes de que termine el tiempo.': 'Assign a name to each line before time runs out.',
  'Mira las identidades reales y cuantos aciertos lograste.': 'See the real identities and how many correct guesses you made.',
  'Decide rapido: intenta desactivar o pasa la bomba a otro jugador.': 'Decide quickly: try to defuse or pass the bomb to another player.',
  'Observa al portador y preparate por si la bomba llega a tu cabina.': 'Watch the holder and be ready in case the bomb reaches your cabin.',
  'Se resolvera si alguien la desactivo o si la bomba exploto.': 'It will resolve whether someone defused it or the bomb exploded.',
  'Sigue tu rol y coordina usando la informacion parcial.': 'Follow your role and coordinate using partial information.',
  'Lee tu rol y entiende si debes deducir, ayudar o sabotear.': 'Read your role and understand whether you should deduce, help, or sabotage.',
  'Memoriza tu valor falso: luego tendras que defenderlo.': 'Memorize your fake value: you will have to defend it later.',
  'Revisa tu pista y preparate para compararla en transmision.': 'Review your clue and get ready to compare it during transmission.',
  'Espera reportes escritos y arma el mensaje correcto con esas pistas.': 'Wait for written reports and build the correct message from those clues.',
  'Habla con otros emisores y envia un reporte corto al operador.': 'Talk with the other senders and send a short report to the operator.',
  'Elige cual de las 4 opciones coincide con los reportes recibidos.': 'Choose which of the 4 options matches the reports you received.',
  'Espera la decision de los operadores.': 'Wait for the operators to decide.',
  'Se revelara si los operadores acertaron o si gano el saboteador.': 'It will reveal whether the operators were right or the saboteur won.',
  'Compara tu emoji con los demas y descubre al diferente.': 'Compare your emoji with the others and find the odd one out.',
  'Memoriza tu emoji. Todavia no puedes llamar a nadie.': 'Memorize your emoji. You cannot call anyone yet.',
  'Describe tu emoji y compara pistas para encontrar al diferente.': 'Describe your emoji and compare clues to find the odd one out.',
  'Vota por quien crees que tiene el emoji diferente.': 'Vote for who you think has the different emoji.',
  'Se mostrara quien era el diferente y si la mayoria acerto.': 'It will reveal who the odd one was and whether the majority guessed correctly.',
  'DECISION FINAL': 'FINAL DECISION',
  'Nadie sabra lo que elegiste hasta que sea demasiado tarde': 'No one will know what you chose until it is too late',
  'Una mayoria define el castigo. Tu decision define si sobrevives mejor que los demas.': 'A majority defines the punishment. Your choice defines whether you survive better than the others.',
  'COOPERAR': 'COOPERATE',
  'TRAICIONAR': 'BETRAY',
  'TU ELECCION QUEDO SELLADA': 'YOUR CHOICE IS SEALED',
  'Jugadores pendientes:': 'Players pending:',
  'La mayoria decidira el impacto': 'The majority will decide the impact',
  'Esperando a los demas...': 'Waiting for the others...',
  'En llamada': 'In call',
  'No disponible': 'Unavailable',
  'Disponible': 'Available',
  'LLAMANDO...': 'CALLING...',
  'Esperando respuesta': 'Waiting for answer',
  'CANCELAR': 'CANCEL',
  'LLAMADA ENTRANTE...': 'INCOMING CALL...',
  'LLAMADAS ENTRANTES...': 'INCOMING CALLS...',
  'CONTESTAR': 'ANSWER',
  'RECHAZAR': 'REJECT',
  'EN LLAMADA': 'IN CALL',
  'Llamada activa': 'Active call',
  'COLGAR': 'HANG UP',
  'SELECCIONA A QUIEN LLAMAR': 'SELECT WHO TO CALL',
  'No hay jugadores disponibles.': 'No players available.',
  'La cabina esta en silencio por ahora.': 'The cabin is silent for now.',
  'IDENTIDADES REVELADAS': 'IDENTITIES REVEALED',
  'La voz ya no puede esconder a nadie': 'The voice can no longer hide anyone',
  'Linea': 'Line',
  'Adivinaste': 'You guessed',
  'linea': 'line',
  'lineas': 'lines',
  'RESPUESTAS ENVIADAS': 'ANSWERS SENT',
  'ADIVINA QUIEN ES CADA LINEA': 'GUESS WHO EACH LINE IS',
  'Tu eres Linea': 'You are Line',
  'Puedes ir adivinando mientras llamas.': 'You can keep guessing while calling.',
  'Asigna un nombre a cada linea.': 'Assign a name to each line.',
  'Cada llamada puede delatar una identidad': 'Each call can expose an identity',
  'Ya no hay mas voces: solo sospechas': 'There are no more voices, only suspicions',
  '-- Seleccionar --': '-- Select --',
  '(ya asignado)': '(already assigned)',
  'ACTUALIZAR RESPUESTAS': 'UPDATE ANSWERS',
  'ENVIAR RESPUESTAS': 'SEND ANSWERS',
  'Respuestas guardadas. Puedes cambiarlas antes del cierre final.': 'Answers saved. You can change them before the final lock.',
  'Tu decision camino con la multitud.': 'Your decision moved with the crowd.',
  'Quedaste del lado equivocado de la mayoria.': 'You ended up on the wrong side of the majority.',
  'La ronda jugo a tu favor.': 'The round played in your favor.',
  'La ronda te dejo expuesto.': 'The round left you exposed.',
  'REVELACION RONDA': 'ROUND REVEAL',
  'TU DECISION': 'YOUR DECISION',
  'MAYORIA': 'MAJORITY',
  'Ronda:': 'Round:',
  'Racha:': 'Streak:',
  'ASI JUGO CADA CABINA': 'HOW EACH CABIN PLAYED',
  'PROTOCOLO FINALIZADO': 'PROTOCOL FINISHED',
  'VICTORIA': 'VICTORY',
  'MAS VOTADO': 'MOST VOTED',
  'DESACTIVADOR': 'DEFUSER',
  'RESULTADO': 'RESULT',
  'GANADOR DE LA RONDA': 'ROUND WINNER',
  'LA BOMBA EXPLOTO': 'THE BOMB EXPLODED',
  '-1 PUNTO GLOBAL': '-1 GLOBAL POINT',
  '+2 PUNTOS GLOBAL': '+2 GLOBAL POINTS',
  '-2 PUNTOS GLOBAL': '-2 GLOBAL POINTS',
  '+1 PUNTO GLOBAL': '+1 GLOBAL POINT',
  'SOMBRA': 'SHADOW',
  'NUEVA PARTIDA': 'NEW MATCH',
  'SONIDO': 'AUDIO',
  'FONDO': 'AMBIENCE',
  'JUGADORES': 'PLAYERS',
  'SISTEMA': 'SYSTEM',
  'LLAMADA ENTRANTE': 'INCOMING CALL',
  'SENAL ANONIMA': 'ANONYMOUS SIGNAL',
  'DESACTIVO LA BOMBA': 'DEFUSED THE BOMB',
  'LA BOMBA EXPLOTO EN': 'THE BOMB EXPLODED ON',
  'VEREDICTO': 'VERDICT',
  'La sala decidio a quien elevar.': 'The room decided who to elevate.',
  'La sala ya decidio quien quedo bajo sospecha.': 'The room already decided who ended under suspicion.',
  'voto': 'vote',
  'votos': 'votes',
  'Solo un nombre deberia salir fortalecido': 'Only one name should come out stronger',
  'Solo un nombre cargara con la sospecha': 'Only one name will carry the suspicion',
  'VOTAR': 'VOTE',
  'TU VOTO YA FUE CONTADO': 'YOUR VOTE HAS BEEN COUNTED',
  'Esperando a los demas para revelar el veredicto...': 'Waiting for the others to reveal the verdict...',
  'REVELACION PRIVADA': 'PRIVATE REVEAL',
  'Puede que tengas la pieza que no encaja': 'You may have the piece that does not fit',
  'Memoriza tu emoji. En unos segundos tendras que defenderlo sin saber si eres el diferente.': 'Memorize your emoji. In a few seconds you will have to defend it without knowing if you are the odd one.',
  'TU EMOJI': 'YOUR EMOJI',
  'Todos suenan convincentes hasta que uno no encaja': 'Everyone sounds convincing until one does not fit',
  'Llama, compara descripciones y detecta quien esta fingiendo normalidad.': 'Call, compare descriptions, and detect who is pretending to be normal.',
  'JUICIO FINAL': 'FINAL JUDGMENT',
  'Quien no pertenece al patron?': 'Who does not belong to the pattern?',
  'Votos:': 'Votes:',
  'Tu acusacion ya fue registrada. Esperando el veredicto...': 'Your accusation has been registered. Waiting for the verdict...',
  'DIFERENTE DESCUBIERTO': 'ODD ONE DISCOVERED',
  'ENGANO EXITOSO': 'SUCCESSFUL DECEPTION',
  'La mayoria encontro la grieta en el patron.': 'The majority found the crack in the pattern.',
  'El diferente logro mezclarse con todos los demas.': 'The odd one managed to blend in with everyone else.',
  'BASE': 'BASE',
  'DIFERENTE': 'ODD ONE',
  'El diferente era:': 'The odd one was:',
  'VOTOS': 'VOTES',
  'Todos ganan +1 punto excepto el diferente': 'Everyone gains +1 point except the odd one',
  'gana +1 punto': 'gains +1 point',
  'Ya tienes una sala publica activa o en enfriamiento. Reutilizala o espera a que expire.': 'You already have an active public room or one cooling down. Reuse it or wait for it to expire.',
  'No se pudo crear la partida': 'Could not create the match',
  'Sala no encontrada. Verifica el codigo.': 'Room not found. Check the code.',
  'La partida ya comenzo.': 'The match has already started.',
  'La sala esta llena.': 'The room is full.',
  'Solo el anfitrion puede iniciar': 'Only the host can start',
  'Decision invalida': 'Invalid decision',
  'Espera un momento antes de enviar otra senal.': 'Wait a moment before sending another signal.',
  'Senal invalida.': 'Invalid signal.',
  'No se pudo enviar el mensaje al chat del lobby.': 'Could not send the lobby chat message.',
  'El chat principal solo esta disponible antes de entrar a una sala.': 'Main chat is only available before joining a room.',
  'Espera un momento antes de enviar otro mensaje.': 'Wait a moment before sending another message.',
  'Escribe un nombre corto y un mensaje para el chat principal.': 'Enter a short name and a message for main chat.',
  'creo una sala publica': 'created a public room',
  'creo una sala': 'created a room',
  'se unio a una sala': 'joined a room',
}

const minigameNamesEn: Record<string, string> = {
  'cooperar-traicionar': 'Cooperate or Betray',
  'votacion-sobra': 'Who Does Not Belong?',
  'votacion-merece': 'Who Deserves It?',
  'adivina-linea': 'Guess the Line',
  'la-bomba': 'The Bomb',
  'central-emergencias': 'Emergency Center',
  'emoji-diferente': 'Odd Emoji',
}

const minigameDescriptionsEn: Record<string, string> = {
  'cooperar-traicionar': 'Talk for 30 seconds and secretly choose whether to cooperate or betray. The majority decides the outcome.',
  'votacion-sobra': 'Vote for the player you think is dominating too much. The most voted loses 1 global point.',
  'votacion-merece': 'Vote for the player who deserves to move forward. The most voted gains 1 global point.',
  'adivina-linea': 'Identities are hidden and voices are distorted. Call, deduce, and match who is behind each line.',
  'la-bomba': 'The match lasts 5 minutes and each holder gets 50 seconds. Defuse it or pass it to raise the odds.',
  'central-emergencias': '2 technicians and 1 saboteur compare clues and send short reports. Operators must choose the correct message.',
  'emoji-diferente': 'Everyone gets the same emoji except one player. Talk, compare, and vote to find the odd one out.',
}

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  tr: (text: string) => string
  trMinigameName: (id: string | null | undefined, fallback: string) => string
  trMinigameDescription: (id: string | null | undefined, fallback: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'es'
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'en' || stored === 'es') return stored
    return detectPreferredLanguage()
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    tr: (text) => (language === 'en' ? (englishTranslations[text] ?? text) : text),
    trMinigameName: (id, fallback) => (
      language === 'en' && id ? (minigameNamesEn[id] ?? fallback) : fallback
    ),
    trMinigameDescription: (id, fallback) => (
      language === 'en' && id ? (minigameDescriptionsEn[id] ?? fallback) : fallback
    ),
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within LanguageProvider')
  }
  return context
}
