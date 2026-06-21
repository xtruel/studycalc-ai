/** Stringhe dell'interfaccia (UI) localizzate in 6 lingue. */
import type { Lang } from "./naturalMath";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

export type UIKey =
  | "tutorActive" | "appSubtitle"
  | "navChat" | "navPhoto" | "navExcel" | "navHistory" | "navOptions"
  | "tabInfo" | "tabMethod" | "tabSteps" | "tabVerify" | "tabExcel"
  | "recognized" | "finalResult" | "excelSuggested"
  | "inputPlaceholder" | "kbTitle" | "kbHelp"
  | "photoPrompt" | "photoHint"
  | "settings" | "settingsSubtitle" | "darkMode" | "darkModeSub"
  | "teaching" | "teachingSub" | "middleSchool" | "highSchool"
  | "language" | "languageSub" | "autoDetect"
  | "clearData" | "clearDataSub" | "clearBtn"
  | "engineStatus" | "engineActive"
  | "history" | "historySub" | "retry" | "noHistory"
  | "excelTab" | "excelEvaluated" | "clearAll"
  | "levelMedie" | "levelSuperiori" | "levelTutti"
  | "welcome";

type Dict = Record<UIKey, string>;

const it: Dict = {
  tutorActive: "Tutor attivo", appSubtitle: "Tutor di Matematica",
  navChat: "Chat", navPhoto: "Foto", navExcel: "Excel", navHistory: "Storia", navOptions: "Opzioni",
  tabInfo: "Info", tabMethod: "Metodo", tabSteps: "Passi", tabVerify: "Verifica", tabExcel: "Excel",
  recognized: "Esercizio riconosciuto", finalResult: "Risultato finale", excelSuggested: "Formula Excel suggerita",
  inputPlaceholder: "Scrivi l'esercizio o la traccia...", kbTitle: "Tastiera Matematica Rapida", kbHelp: "Invio per inviare",
  photoPrompt: "Esercizi su carta? Carica immagine", photoHint: "Clicca per esplorare o trascina il file qui (PNG, JPEG)",
  settings: "Impostazioni", settingsSubtitle: "Personalizza l'assistente",
  darkMode: "Tema Scuro", darkModeSub: "Modalità notturna",
  teaching: "Spiegazione Didattica", teachingSub: "Livello delle spiegazioni",
  middleSchool: "Scuole Medie", highSchool: "Scuole Superiori",
  language: "Lingua", languageSub: "Lingua di interfaccia e risposte", autoDetect: "Automatica",
  clearData: "Cancella conversazione", clearDataSub: "Rimuove la sessione attiva", clearBtn: "Svuota",
  engineStatus: "Motore di calcolo locale", engineActive: "ATTIVO",
  history: "Cronologia", historySub: "I tuoi calcoli recenti", retry: "Riprova", noHistory: "Nessun calcolo ancora.",
  excelTab: "Foglio Excel", excelEvaluated: "Risultato Valutato", clearAll: "Cancella tutto",
  levelMedie: "Medie", levelSuperiori: "Superiori", levelTutti: "Tutti",
  welcome: "**Benvenuto su StudyCalc AI!** 👋\n\nSono il tuo assistente di matematica. Scrivimi un calcolo anche **a parole** (es. \"moltiplica 4 per 4\", \"3 alla terza\", \"radice di 16\") oppure un'espressione o un'equazione. Risolvo tutto **passo passo**, offline.\n\nPuoi cambiare **lingua** e livello nelle Impostazioni.",
};

const en: Dict = {
  tutorActive: "Active tutor", appSubtitle: "Math Tutor",
  navChat: "Chat", navPhoto: "Photo", navExcel: "Excel", navHistory: "History", navOptions: "Options",
  tabInfo: "Info", tabMethod: "Method", tabSteps: "Steps", tabVerify: "Check", tabExcel: "Excel",
  recognized: "Recognized exercise", finalResult: "Final result", excelSuggested: "Suggested Excel formula",
  inputPlaceholder: "Type the exercise or problem...", kbTitle: "Quick Math Keyboard", kbHelp: "Enter to send",
  photoPrompt: "Exercise on paper? Upload an image", photoHint: "Click to browse or drag the file here (PNG, JPEG)",
  settings: "Settings", settingsSubtitle: "Customize the assistant",
  darkMode: "Dark Theme", darkModeSub: "Night mode",
  teaching: "Teaching detail", teachingSub: "Explanation level",
  middleSchool: "Middle School", highSchool: "High School",
  language: "Language", languageSub: "Interface and answer language", autoDetect: "Automatic",
  clearData: "Clear conversation", clearDataSub: "Removes the active session", clearBtn: "Clear",
  engineStatus: "Local computation engine", engineActive: "ACTIVE",
  history: "History", historySub: "Your recent calculations", retry: "Retry", noHistory: "No calculations yet.",
  excelTab: "Excel sheet", excelEvaluated: "Evaluated result", clearAll: "Clear all",
  levelMedie: "Middle", levelSuperiori: "High", levelTutti: "All",
  welcome: "**Welcome to StudyCalc AI!** 👋\n\nI'm your math assistant. Type a calculation in **plain words** (e.g. \"multiply 4 by 4\", \"3 to the power of 3\", \"square root of 16\") or an expression or equation. I solve everything **step by step**, offline.\n\nYou can change **language** and level in Settings.",
};

const es: Dict = {
  tutorActive: "Tutor activo", appSubtitle: "Tutor de Matemáticas",
  navChat: "Chat", navPhoto: "Foto", navExcel: "Excel", navHistory: "Historial", navOptions: "Opciones",
  tabInfo: "Info", tabMethod: "Método", tabSteps: "Pasos", tabVerify: "Verif.", tabExcel: "Excel",
  recognized: "Ejercicio reconocido", finalResult: "Resultado final", excelSuggested: "Fórmula Excel sugerida",
  inputPlaceholder: "Escribe el ejercicio o el enunciado...", kbTitle: "Teclado Matemático Rápido", kbHelp: "Intro para enviar",
  photoPrompt: "¿Ejercicio en papel? Sube una imagen", photoHint: "Haz clic para explorar o arrastra el archivo aquí (PNG, JPEG)",
  settings: "Ajustes", settingsSubtitle: "Personaliza el asistente",
  darkMode: "Tema oscuro", darkModeSub: "Modo nocturno",
  teaching: "Nivel de explicación", teachingSub: "Detalle de las explicaciones",
  middleSchool: "Secundaria", highSchool: "Bachillerato",
  language: "Idioma", languageSub: "Idioma de interfaz y respuestas", autoDetect: "Automático",
  clearData: "Borrar conversación", clearDataSub: "Elimina la sesión activa", clearBtn: "Vaciar",
  engineStatus: "Motor de cálculo local", engineActive: "ACTIVO",
  history: "Historial", historySub: "Tus cálculos recientes", retry: "Reintentar", noHistory: "Aún no hay cálculos.",
  excelTab: "Hoja Excel", excelEvaluated: "Resultado evaluado", clearAll: "Borrar todo",
  levelMedie: "Secund.", levelSuperiori: "Bachill.", levelTutti: "Todos",
  welcome: "**¡Bienvenido a StudyCalc AI!** 👋\n\nSoy tu asistente de matemáticas. Escribe un cálculo en **palabras** (p. ej. \"multiplica 4 por 4\", \"3 al cubo\", \"raíz de 16\") o una expresión o ecuación. Lo resuelvo todo **paso a paso**, sin conexión.\n\nPuedes cambiar el **idioma** y el nivel en Ajustes.",
};

const fr: Dict = {
  tutorActive: "Tuteur actif", appSubtitle: "Tuteur de Maths",
  navChat: "Chat", navPhoto: "Photo", navExcel: "Excel", navHistory: "Historique", navOptions: "Options",
  tabInfo: "Info", tabMethod: "Méthode", tabSteps: "Étapes", tabVerify: "Vérif.", tabExcel: "Excel",
  recognized: "Exercice reconnu", finalResult: "Résultat final", excelSuggested: "Formule Excel suggérée",
  inputPlaceholder: "Écris l'exercice ou l'énoncé...", kbTitle: "Clavier Mathématique Rapide", kbHelp: "Entrée pour envoyer",
  photoPrompt: "Exercice sur papier ? Téléverse une image", photoHint: "Clique pour parcourir ou glisse le fichier ici (PNG, JPEG)",
  settings: "Paramètres", settingsSubtitle: "Personnalise l'assistant",
  darkMode: "Thème sombre", darkModeSub: "Mode nuit",
  teaching: "Niveau d'explication", teachingSub: "Détail des explications",
  middleSchool: "Collège", highSchool: "Lycée",
  language: "Langue", languageSub: "Langue de l'interface et des réponses", autoDetect: "Automatique",
  clearData: "Effacer la conversation", clearDataSub: "Supprime la session active", clearBtn: "Vider",
  engineStatus: "Moteur de calcul local", engineActive: "ACTIF",
  history: "Historique", historySub: "Tes calculs récents", retry: "Réessayer", noHistory: "Aucun calcul pour l'instant.",
  excelTab: "Feuille Excel", excelEvaluated: "Résultat évalué", clearAll: "Tout effacer",
  levelMedie: "Collège", levelSuperiori: "Lycée", levelTutti: "Tous",
  welcome: "**Bienvenue sur StudyCalc AI !** 👋\n\nJe suis ton assistant de maths. Écris un calcul **en mots** (ex. « multiplie 4 par 4 », « 3 au cube », « racine de 16 ») ou une expression ou équation. Je résous tout **pas à pas**, hors ligne.\n\nTu peux changer la **langue** et le niveau dans les Paramètres.",
};

const de: Dict = {
  tutorActive: "Tutor aktiv", appSubtitle: "Mathe-Tutor",
  navChat: "Chat", navPhoto: "Foto", navExcel: "Excel", navHistory: "Verlauf", navOptions: "Optionen",
  tabInfo: "Info", tabMethod: "Methode", tabSteps: "Schritte", tabVerify: "Prüfung", tabExcel: "Excel",
  recognized: "Erkannte Aufgabe", finalResult: "Endergebnis", excelSuggested: "Vorgeschlagene Excel-Formel",
  inputPlaceholder: "Aufgabe oder Text eingeben...", kbTitle: "Schnelle Mathe-Tastatur", kbHelp: "Enter zum Senden",
  photoPrompt: "Aufgabe auf Papier? Bild hochladen", photoHint: "Klicken zum Durchsuchen oder Datei hierher ziehen (PNG, JPEG)",
  settings: "Einstellungen", settingsSubtitle: "Assistent anpassen",
  darkMode: "Dunkles Design", darkModeSub: "Nachtmodus",
  teaching: "Erklärungstiefe", teachingSub: "Detailgrad der Erklärungen",
  middleSchool: "Mittelstufe", highSchool: "Oberstufe",
  language: "Sprache", languageSub: "Sprache der Oberfläche und Antworten", autoDetect: "Automatisch",
  clearData: "Unterhaltung löschen", clearDataSub: "Entfernt die aktive Sitzung", clearBtn: "Leeren",
  engineStatus: "Lokale Rechen-Engine", engineActive: "AKTIV",
  history: "Verlauf", historySub: "Deine letzten Berechnungen", retry: "Erneut", noHistory: "Noch keine Berechnungen.",
  excelTab: "Excel-Blatt", excelEvaluated: "Ausgewertetes Ergebnis", clearAll: "Alles löschen",
  levelMedie: "Mittel", levelSuperiori: "Ober", levelTutti: "Alle",
  welcome: "**Willkommen bei StudyCalc AI!** 👋\n\nIch bin dein Mathe-Assistent. Gib eine Rechnung **in Worten** ein (z. B. „multipliziere 4 mal 4“, „3 hoch 3“, „Wurzel aus 16“) oder einen Ausdruck oder eine Gleichung. Ich löse alles **Schritt für Schritt**, offline.\n\nSprache und Niveau kannst du in den Einstellungen ändern.",
};

const pt: Dict = {
  tutorActive: "Tutor ativo", appSubtitle: "Tutor de Matemática",
  navChat: "Chat", navPhoto: "Foto", navExcel: "Excel", navHistory: "Histórico", navOptions: "Opções",
  tabInfo: "Info", tabMethod: "Método", tabSteps: "Passos", tabVerify: "Verif.", tabExcel: "Excel",
  recognized: "Exercício reconhecido", finalResult: "Resultado final", excelSuggested: "Fórmula Excel sugerida",
  inputPlaceholder: "Escreve o exercício ou o enunciado...", kbTitle: "Teclado Matemático Rápido", kbHelp: "Enter para enviar",
  photoPrompt: "Exercício em papel? Carrega uma imagem", photoHint: "Clica para explorar ou arrasta o ficheiro aqui (PNG, JPEG)",
  settings: "Definições", settingsSubtitle: "Personaliza o assistente",
  darkMode: "Tema escuro", darkModeSub: "Modo noturno",
  teaching: "Nível de explicação", teachingSub: "Detalhe das explicações",
  middleSchool: "Básico", highSchool: "Secundário",
  language: "Idioma", languageSub: "Idioma da interface e das respostas", autoDetect: "Automático",
  clearData: "Limpar conversa", clearDataSub: "Remove a sessão ativa", clearBtn: "Limpar",
  engineStatus: "Motor de cálculo local", engineActive: "ATIVO",
  history: "Histórico", historySub: "Os teus cálculos recentes", retry: "Repetir", noHistory: "Ainda sem cálculos.",
  excelTab: "Folha Excel", excelEvaluated: "Resultado avaliado", clearAll: "Limpar tudo",
  levelMedie: "Básico", levelSuperiori: "Secund.", levelTutti: "Todos",
  welcome: "**Bem-vindo ao StudyCalc AI!** 👋\n\nSou o teu assistente de matemática. Escreve um cálculo **por palavras** (ex. \"multiplica 4 por 4\", \"3 ao cubo\", \"raiz de 16\") ou uma expressão ou equação. Resolvo tudo **passo a passo**, offline.\n\nPodes mudar o **idioma** e o nível nas Definições.",
};

export const UI: Record<Lang, Dict> = { it, en, es, fr, de, pt };

export function t(lang: Lang, key: UIKey): string {
  return UI[lang]?.[key] ?? UI.it[key] ?? key;
}
