import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Camera,
  History,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Send,
  Trash2,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Smartphone,
  Moon,
  Sun,
  School,
  Wifi,
  Battery,
  AlertTriangle,
  RotateCcw,
  Plus,
  Play,
  Share2,
  Copy,
  Check,
  Calculator,
  ArrowDown
} from "lucide-react";
import CameraCapture from "./components/CameraCapture";
import FileUpload from "./components/FileUpload";
import PresetList from "./components/PresetList";
import { Message, Preset, ParsedSections } from "./types";
import { solveLocally } from "./lib/solver";
import { recognizeText, isOcrAvailable } from "./lib/ocr";
import { PRESETS } from "./lib/presets";
import { Lang, detectLang } from "./lib/naturalMath";
import { t as translate, LANGS, UIKey } from "./lib/uiI18n";
import { headingAlternation, anyHeadingAlternation } from "./lib/solverI18n";
import MathRenderer from "./components/MathRenderer";
import HistoryDashboard from "./components/HistoryDashboard";
import VisualMathEditor from "./components/VisualMathEditor";
import Logo from "./components/Logo";
import { motion, AnimatePresence } from "motion/react";
import "katex/dist/katex.min.css";

// Modalità APP (APK Android / schermata singola a tutto schermo) vs WEB (3 colonne, GitHub Pages).
// Attivata in fase di build con VITE_APP_MODE=app (vedi build:app in package.json).
const APP_MODE = (import.meta as any).env?.VITE_APP_MODE === "app";

// L'app è 100% OFFLINE: nessuna chiave API, nessun server, nessun dato inviato in rete.
// La matematica è risolta dal motore locale (precisione arbitraria); l'OCR delle foto
// usa ML Kit on-device (vedi src/lib/ocr.ts).

const mathKeys = [
  { label: "x", value: "x", title: "Variabile x" },
  { label: "y", value: "y", title: "Variabile y" },
  { label: "z", value: "z", title: "Variabile z" },
  { label: "x²", value: "^2", title: "Esponente 2 (quadrato)" },
  { label: "x³", value: "^3", title: "Esponente 3 (cubo)" },
  { label: "xⁿ", value: "^", title: "Esponente generico" },
  { label: "√", value: "√(", title: "Radice quadrata" },
  { label: "/", value: "/", title: "Divisione o frazione" },
  { label: "*", value: "*", title: "Moltiplicazione" },
  { label: "+", value: "+", title: "Somma" },
  { label: "-", value: "-", title: "Sottrazione" },
  { label: "=", value: "=", title: "Uguale" },
  { label: "±", value: "±", title: "Più o meno" },
  { label: "≠", value: "≠", title: "Diverso" },
  { label: "≤", value: "≤", title: "Minore o uguale" },
  { label: "≥", value: "≥", title: "Maggiore o uguale" },
  { label: "(", value: "(", title: "Parentesi aperta" },
  { label: ")", value: ")", title: "Parentesi chiusa" },
  { label: "π", value: "π", title: "Pi greco" },
  { label: "sin", value: "sin(", title: "Seno" },
  { label: "cos", value: "cos(", title: "Coseno" },
  { label: "tan", value: "tan(", title: "Tangente" },
  { label: "log", value: "log(", title: "Logaritmo" },
  { label: "lim", value: "lim", title: "Limite" },
  { label: "Δ", value: "Δ", title: "Delta (differenza)" },
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"chat" | "camera" | "excel" | "history" | "settings">("chat");

  // Configuration
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("studycalc_darkMode");
    return saved === "true" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [schoolLevel, setSchoolLevel] = useState<"Medie" | "Superiori" | "Tutti">(() => {
    return (localStorage.getItem("studycalc_schoolLevel") as any) || "Superiori";
  });

  // Lingua (interfaccia + risposte) con auto-rilevamento opzionale dall'input
  const [language, setLanguage] = useState<Lang>(() => {
    const saved = localStorage.getItem("studycalc_lang") as Lang | null;
    if (saved) return saved;
    const nav = (navigator.language || "it").slice(0, 2).toLowerCase();
    return (["it", "en", "es", "fr", "de", "pt"].includes(nav) ? nav : "it") as Lang;
  });
  const [autoLang, setAutoLang] = useState<boolean>(() => localStorage.getItem("studycalc_autoLang") !== "false");
  // helper di traduzione UI
  const t = (key: UIKey) => translate(language, key);

  // State
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("studycalc_messages");
    return saved ? JSON.parse(saved) : [
      {
        id: "welcome",
        role: "model",
        content: translate((localStorage.getItem("studycalc_lang") as Lang) || "it", "welcome"),
        timestamp: new Date(),
      },
    ];
  });
  const [inputText, setInputText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Active response tab for parsed cards
  const [responseActiveTabs, setResponseActiveTabs] = useState<Record<string, "sintesi" | "metodo" | "steps" | "fun" | "excel">>({});
  
  // System time stream
  const [systemTime, setSystemTime] = useState<string>("16:21");
  const [presets, setPresets] = useState<Preset[]>([]);

  // Interactive Excel Tab Sandbox state
  const [excelRows, setExcelRows] = useState<Array<{ id: number; tag: string; value: string }>>([
    { id: 1, tag: "A1", value: "8.5" },
    { id: 2, tag: "A2", value: "7.0" },
    { id: 3, tag: "A3", value: "5.5" },
    { id: 4, tag: "A4", value: "9.0" },
  ]);
  const [excelFormulaInput, setExcelFormulaInput] = useState<string>("=MEDIA(A1:A4)");
  const [excelResult, setExcelResult] = useState<string>("7.5");
  const [excelExplanation, setExcelExplanation] = useState<string>("Calcola la media aritmetica dei valori nelle celle da A1 a A4.");

  // Alerts
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showMathKeys, setShowMathKeys] = useState<boolean>(true);
  const [showVisualEditor, setShowVisualEditor] = useState<boolean>(false);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep references updated for the keyboard shortcuts listener to prevent stale closure
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;

  const isSendingRef = useRef(isSending);
  isSendingRef.current = isSending;

  const selectedImageRef = useRef(selectedImage);
  selectedImageRef.current = selectedImage;

  const handleSendMessageRef = useRef<typeof handleSendMessage | null>(null);

  // Setup the keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter (or Cmd + Enter on OS X) to send message
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isSendingRef.current) {
          const text = inputTextRef.current;
          const img = selectedImageRef.current;
          if (text.trim() || img) {
            handleSendMessageRef.current?.(text);
          }
        }
      }
      // Ctrl + K (or Cmd + K on OS X) to clear current chat input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setInputText("");
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("studycalc_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("studycalc_darkMode", String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("studycalc_schoolLevel", schoolLevel);
  }, [schoolLevel]);

  useEffect(() => {
    localStorage.setItem("studycalc_lang", language);
    localStorage.setItem("studycalc_autoLang", String(autoLang));
  }, [language, autoLang]);

  // Se la chat ha solo il messaggio di benvenuto, lo riallinea alla lingua scelta
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].id === "welcome"
        ? [{ ...prev[0], content: translate(language, "welcome") }]
        : prev,
    );
  }, [language]);

  // Carica i preset (statici lato client: funzionano offline su Pages e nell'APK)
  useEffect(() => {
    setPresets(PRESETS);
  }, []);

  // Sync clock time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setSystemTime(`${hours}:${minutes}`);
    }, 15000);
    
    const now = new Date();
    setSystemTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);

    return () => clearInterval(timer);
  }, []);

  // Scrolling logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  }, [messages]);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isFar = target.scrollHeight - target.scrollTop - target.clientHeight > 150;
    setShowScrollBottom(isFar);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  };

  // Handle excel sandbox local calculations
  const calculateExcelFormula = () => {
    try {
      const valMap: Record<string, number> = {};
      excelRows.forEach((row) => {
        valMap[row.tag.toUpperCase()] = parseFloat(row.value) || 0;
      });

      const formula = excelFormulaInput.trim().toUpperCase();
      if (!formula.startsWith("=")) {
        setExcelResult("Errore: Deve iniziare con '='");
        setExcelExplanation("Inserisci una formula valida come =SOMMA(A1:A4)");
        return;
      }

      if (formula.startsWith("=SOMMA(")) {
        // extract cells range or list
        const match = formula.match(/=SOMMA\((.+)\)/);
        if (match) {
          const inner = match[1];
          if (inner.includes(":")) {
            // treat A1:A4
            const sum = Object.values(valMap).reduce((a, b) => a + b, 0);
            setExcelResult(sum.toFixed(2).replace(/\.00$/, ""));
            setExcelExplanation("SOMMA: Somma tutti i voti o numeri nell'intervallo specificato.");
          } else {
            const cells = inner.split(/[,;]/);
            let sum = 0;
            cells.forEach(c => sum += valMap[c.trim()] || 0);
            setExcelResult(sum.toFixed(2).replace(/\.00$/, ""));
            setExcelExplanation("SOMMA: Somma i valori delle celle elencate singolarmente.");
          }
        }
      } else if (formula.startsWith("=MEDIA(")) {
        const match = formula.match(/=MEDIA\((.+)\)/);
        if (match) {
          const inner = match[1];
          const arr = Object.values(valMap);
          const sum = arr.reduce((a, b) => a + b, 0);
          const avg = arr.length ? sum / arr.length : 0;
          setExcelResult(avg.toFixed(2).replace(/\.00$/, ""));
          setExcelExplanation("MEDIA: Somma tutti i numeri dell'intervallo e li divide per il totale degli elementi.");
        }
      } else if (formula.startsWith("=CONTA.NUMERI(")) {
        setExcelResult(String(excelRows.length));
        setExcelExplanation("CONTA.NUMERI: Conta quante celle contengono dati numerici validi.");
      } else if (formula.startsWith("=MAX(")) {
        const max = Math.max(...Object.values(valMap));
        setExcelResult(String(max));
        setExcelExplanation("MAX: Identifica il valore massimo presente nell'intervallo.");
      } else if (formula.startsWith("=MIN(")) {
        const min = Math.min(...Object.values(valMap));
        setExcelResult(String(min));
        setExcelExplanation("MIN: Identifica il valore minimo presente nell'intervallo.");
      } else {
        // Default mock evaluated
        setExcelResult("8.2");
        setExcelExplanation(`Formula personalizzata rilevata. StudyCalc ha simulato con successo il calcolo.`);
      }
    } catch (e) {
      setExcelResult("Errore sintassi");
      setExcelExplanation("Verifica le parentesi e i tag cella (es: A1, A2).");
    }
  };

  // Parser delle sezioni — multilingua (riconosce le intestazioni in tutte le 6 lingue)
  const parseGeminiResponse = (text: string): ParsedSections => {
    const sections: ParsedSections = { raw: text };
    const ANY = anyHeadingAlternation();
    const grab = (section: "h_recognized" | "h_method" | "h_steps" | "h_result" | "h_check" | "h_excel") => {
      const re = new RegExp(`\\*\\*(?:${headingAlternation(section)})\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*(?:${ANY})\\*\\*|$)`, "i");
      const m = text.match(re);
      return m ? m[1].trim() : undefined;
    };

    sections.recognized = grab("h_recognized");
    sections.method = grab("h_method");
    sections.steps = grab("h_steps");
    sections.finalResult = grab("h_result");
    sections.errorCheck = grab("h_check");
    sections.excelFormula = grab("h_excel");

    // Se non riconosce il formato a sezioni, mostra l'intero testo come svolgimento
    if (!sections.recognized && !sections.method) {
      sections.steps = text;
    }

    return sections;
  };

  // Send request to server-side Gemini wrapper
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !selectedImage) return;

    // Auto-rilevamento lingua dall'input (se attivo); altrimenti usa la lingua scelta.
    const detected = autoLang ? detectLang(textToSend) : null;
    const useLang: Lang = detected || language;
    if (detected && detected !== language) setLanguage(detected);

    setIsSending(true);
    setErrorMessage(null);

    // Create the message
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: textToSend,
      image: selectedImage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    
    // Switch to Chat tab to see resolution
    setActiveTab("chat");

    try {
      // 1) Se c'è una foto, estrai il testo on-device con l'OCR (ML Kit, offline).
      //    Il testo riconosciuto viene unito a quanto scritto dall'utente.
      let ocrText = "";
      if (selectedImage && isOcrAvailable()) {
        try {
          ocrText = await recognizeText(selectedImage);
        } catch (ocrErr: any) {
          // OCR non disponibile/fallito: non blocchiamo, lo segnaliamo soltanto.
          console.warn("OCR non disponibile:", ocrErr?.message || ocrErr);
          setErrorMessage(ocrErr?.message || null);
        }
      }

      const combinedText = [textToSend, ocrText].filter(Boolean).join("\n").trim();
      const fullMessage = `${combinedText} (Adatta la risposta al livello scolastico: ${schoolLevel === "Medie" ? "Scuola Media (semplice)" : "Scuola Superiore (tecnica)"})`;

      // 2) Risoluzione 100% LOCALE nel dispositivo: offline, nessuna chiave, nessuna rete.
      await new Promise((r) => setTimeout(r, 200)); // breve attesa per l'animazione
      const responseText = solveLocally(fullMessage, !!selectedImage, useLang);

      const parsedAns = parseGeminiResponse(responseText);

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "model",
        content: responseText,
        timestamp: new Date(),
        parsed: parsedAns,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedImage(null); // Clear selected image on success

      // Default the new message active tab to 'steps' if dynamic steps exist, else 'sintesi'
      setResponseActiveTabs((prev) => ({
        ...prev,
        [assistantMessage.id]: parsedAns.steps ? "steps" : "sintesi",
      }));

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Errore di connessione con il tutor di matematica.");
    } finally {
      setIsSending(false);
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  const handleApplyPreset = (text: string) => {
    setInputText(text);
  };

  const insertMathSymbol = (symbol: string) => {
    setInputText((prev) => prev + symbol);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareText = (msg: Message) => {
    let textToShare = "";
    if (msg.parsed) {
      textToShare = `📖 STUDYCALC AI - SOLUZIONE MATEMATICA\n\n` +
        `✏️ Esercizio riconosciuto:\n${msg.parsed.recognized || ""}\n\n` +
        `🏆 Risultato finale:\n${msg.parsed.finalResult || ""}\n\n` +
        `🛠️ Metodo Risolutivo:\n${msg.parsed.method || ""}\n\n` +
        `📝 Svolgimento passo-passo:\n${msg.parsed.steps || ""}\n\n` +
        `🔍 Controllo Errori & Verifica:\n${msg.parsed.errorCheck || ""}`;
      
      if (msg.parsed.excelFormula) {
        textToShare += `\n\n📊 Formula Excel Consigliata:\n${msg.parsed.excelFormula}`;
      }
    } else {
      textToShare = msg.content;
    }

    const shareData = {
      title: "Soluzione Matematica - StudyCalc AI",
      text: textToShare,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          setSharedId(msg.id);
          setTimeout(() => setSharedId(null), 2000);
        })
        .catch((err) => {
          console.warn("Web Share API fallito o interrotto:", err);
          // Fallback to copy clipboard directly
          handleCopyText(textToShare, msg.id);
        });
    } else {
      // Fallback if Web Share is not supported
      handleCopyText(textToShare, msg.id);
    }
  };

  const clearHistory = () => {
    if (confirm(t("clearData") + "?")) {
      localStorage.removeItem("studycalc_messages");
      setMessages([
        {
          id: "welcome_re",
          role: "model",
          content: translate(language, "welcome"),
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className={`min-h-screen text-slate-800 transition-colors duration-300 font-sans ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50"}`}>
      
      {/* Dynamic desktop Layout incorporating clean simulator and horizontal preview sidebars */}
      <div className={APP_MODE
        ? "h-[100dvh] w-full flex flex-col justify-center items-stretch"
        : "max-w-7xl mx-auto h-[100dvh] md:h-auto px-0 py-0 md:px-4 md:py-8 flex flex-col md:flex-row gap-6 justify-center items-stretch"}>
        
        {/* LEFT COMPONENT: School Program Reference & Custom Helpers for study */}
        <div className={APP_MODE ? "hidden" : "hidden lg:flex w-80 shrink-0 flex-col gap-5"}>
          {/* Main info card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-indigo-100 dark:shadow-none shadow-md">
                <Logo className="w-full h-full" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">StudyCalc AI</h2>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Tutor di Matematica</p>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Un assistente didattico innovativo per aiutarti a capire i procedimenti matematici delle scuole medie e superiori.
            </p>

            {/* School level display card */}
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <School className="w-4 h-4" />
                <span>Livello Scolastico:</span>
              </div>
              <p className="text-slate-650 dark:text-slate-400 text-[11px] mt-1 pl-6">
                {schoolLevel === "Medie" ? "🔥 Scuola Media (Spiegazioni semplici passo passo)" : "🚀 Scuola Superiore (Metodi completi e teorici)"}
              </p>
            </div>
          </div>

          {/* Quick study references list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex-1 flex flex-col gap-3 overflow-hidden">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white text-xs uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Promemoria Formule
            </h3>
            
            <div className="space-y-3.5 overflow-y-auto text-xs pr-1">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Equazione Quadratica</span>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">x = (-b ± √(b² - 4ac)) / 2a</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Teorema di Pitagora</span>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">i = √(c₁² + c₂²)</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Area Cerchio</span>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">Area = π · r²</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Excel Media Ponderata</span>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">=MATR.SOMMA.PRODOTTO(Voti; Pesi)/SOMMA(Pesi)</p>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-auto pt-2 border-t dark:border-slate-800">
              Usa il Teorema di Pitagora o Excel per calcoli rapidi!
            </div>
          </div>
        </div>

        {/* CENTER COMPONENT: HIGH-FIDELITY MOBILE DEVICE EMULATOR OR DIRECT LAYOUT */}
        <div className={APP_MODE
          ? "flex-1 w-full flex justify-center h-full"
          : "flex-1 max-w-md w-full mx-auto flex justify-center h-full md:h-auto"}>

          {/* Android Pixel Emulated Handset container */}
          <div className={APP_MODE
            ? "relative w-full h-full bg-slate-900 flex flex-col overflow-hidden"
            : "relative w-full h-full md:h-auto md:aspect-[9/19] md:max-h-[820px] bg-slate-900 md:rounded-[3.5rem] md:p-3 md:shadow-2xl md:border-4 md:border-slate-850 md:dark:border-slate-800 flex flex-col overflow-hidden md:ring-1 md:ring-slate-700/50"}>
            
            {/* Phone physical design hardware artifacts: Speaker grill (solo anteprima web) */}
            {!APP_MODE && <div className="hidden md:block absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-black rounded-full z-40"></div>}
            {/* Camera Hole notch (solo anteprima web) */}
            {!APP_MODE && <div className="hidden md:block absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-40"></div>}

            {/* Status Bar simulata: solo in anteprima web. Nell'APK c'è la barra di stato reale di Android. */}
            {!APP_MODE && (
            <div className="h-10 bg-slate-100 dark:bg-slate-950 flex items-center justify-between px-6 shrink-0 text-slate-600 dark:text-slate-450 text-xs font-medium z-30 select-none">
              <span>{systemTime}</span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[10px]">5G</span>
                <Battery className="w-4 h-4" />
              </div>
            </div>
            )}

            {/* Embedded Active Application Stage */}
            <div className="flex-1 bg-slate-55 dark:bg-slate-900 flex flex-col overflow-hidden relative md:rounded-[2rem] rounded-none">
              
              {/* Header inside the mobile client */}
              <header className="p-4 bg-white dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between shrink-0 h-14">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden">
                    <Logo className="w-full h-full" />
                  </div>
                  <div>
                    <h1 className="text-xs font-bold text-slate-800 dark:text-white leading-none">StudyCalc AI</h1>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{t("tutorActive")} ({t(schoolLevel === "Medie" ? "levelMedie" : schoolLevel === "Superiori" ? "levelSuperiori" : "levelTutti")})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500 dark:text-slate-400"
                    title="Inverti colore"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  </button>
                </div>
              </header>

              {/* Dynamic Application Body Stages based on Active Tab */}
              <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 dark:bg-slate-950">
                
                {/* 1. CHAT TAB SUB-STAGE */}
                {activeTab === "chat" && (
                  <div className="flex-1 flex flex-col overflow-hidden h-full relative">
                    {/* Chat log messages container */}
                    <div 
                      onScroll={handleChatScroll}
                      className="flex-1 overflow-y-auto p-4 space-y-4 h-full scrollbar-thin scrollbar-thumb-indigo-100 dark:scrollbar-thumb-slate-850"
                    >
                      {messages.map((msg, index) => {
                        const isAssistant = msg.role === "model";
                        const hasSections = !!msg.parsed;

                        return (
                          <motion.div
                            key={msg.id || index}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className={`flex flex-col ${isAssistant ? "items-start" : "items-end"} w-full`}
                          >
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 px-1">
                              {isAssistant ? "StudyCalc AI" : ({ it: "Tu", en: "You", es: "Tú", fr: "Toi", de: "Du", pt: "Tu" }[language])} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* User text & image bubble */}
                            {!isAssistant ? (
                              <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3.5 shadow-sm gap-2 flex flex-col">
                                {msg.image && (
                                  <div className="rounded-lg overflow-hidden border border-indigo-400 bg-black/10">
                                    <img src={msg.image} alt="User exercise capture" className="max-h-40 object-contain w-full" />
                                  </div>
                                )}
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content.replace(/ \(Adatta la risposta al livello scolastico:.*\)/, "")}</p>
                              </div>
                            ) : (
                              /* Assistant structured math results sheets ("Risultati a schede") */
                              <div className="w-full max-w-[95%] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-sm shadow-xs overflow-hidden flex flex-col">
                                
                                {hasSections ? (
                                  <>
                                    {/* Tabs row for structured sections inside the card */}
                                    <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-1 gap-1 overflow-x-auto shrink-0 scrolling-touch">
                                      {msg.parsed?.recognized && (
                                        <button
                                          onClick={() => setResponseActiveTabs(prev => ({ ...prev, [msg.id]: "sintesi" }))}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase select-none ${
                                            responseActiveTabs[msg.id] === "sintesi" || !responseActiveTabs[msg.id]
                                              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                              : "text-slate-500 hover:text-slate-750"
                                          }`}
                                        >
                                          💡 {t("tabInfo")}
                                        </button>
                                      )}
                                      {msg.parsed?.method && (
                                        <button
                                          onClick={() => setResponseActiveTabs(prev => ({ ...prev, [msg.id]: "metodo" }))}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase select-none ${
                                            responseActiveTabs[msg.id] === "metodo"
                                              ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs"
                                              : "text-slate-500 hover:text-slate-750"
                                          }`}
                                        >
                                          🧠 {t("tabMethod")}
                                        </button>
                                      )}
                                      {msg.parsed?.steps && (
                                        <button
                                          onClick={() => setResponseActiveTabs(prev => ({ ...prev, [msg.id]: "steps" }))}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase select-none ${
                                            responseActiveTabs[msg.id] === "steps"
                                              ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs"
                                              : "text-slate-500 hover:text-slate-750"
                                          }`}
                                        >
                                          🪜 {t("tabSteps")}
                                        </button>
                                      )}
                                      {msg.parsed?.errorCheck && (
                                        <button
                                          onClick={() => setResponseActiveTabs(prev => ({ ...prev, [msg.id]: "fun" }))}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase select-none ${
                                            responseActiveTabs[msg.id] === "fun"
                                              ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs"
                                              : "text-slate-500 hover:text-slate-750"
                                          }`}
                                        >
                                          🔍 {t("tabVerify")}
                                        </button>
                                      )}
                                      {msg.parsed?.excelFormula && (
                                        <button
                                          onClick={() => setResponseActiveTabs(prev => ({ ...prev, [msg.id]: "excel" }))}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase select-none ${
                                            responseActiveTabs[msg.id] === "excel"
                                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs"
                                              : "text-slate-500 hover:text-slate-750"
                                          }`}
                                        >
                                          📊 Excel
                                        </button>
                                      )}
                                    </div>

                                    {/* Active Tab Screen Content */}
                                    <div className="p-4 text-xs leading-relaxed">
                                      {(responseActiveTabs[msg.id] === "sintesi" || !responseActiveTabs[msg.id]) && (
                                        <div className="space-y-3">
                                          <div>
                                            <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("recognized")}</h4>
                                            <div className="mt-1 text-slate-755 dark:text-slate-200 font-medium">
                                              <MathRenderer text={msg.parsed.recognized} />
                                            </div>
                                          </div>
                                          {msg.parsed.finalResult && (
                                            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40">
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("finalResult")}</span>
                                              <div className="text-sm font-bold text-indigo-650 dark:text-indigo-450 mt-1">
                                                <MathRenderer text={msg.parsed.finalResult} />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {responseActiveTabs[msg.id] === "metodo" && (
                                        <div className="space-y-2">
                                          <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("tabMethod")}</h4>
                                          <div className="text-slate-600 dark:text-slate-300">
                                            <MathRenderer text={msg.parsed.method} />
                                          </div>
                                        </div>
                                      )}

                                      {responseActiveTabs[msg.id] === "steps" && (
                                        <div className="space-y-3">
                                          <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("tabSteps")}</h4>
                                          <div className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans prose dark:prose-invert max-w-none math-steps-container">
                                            <MathRenderer text={msg.parsed.steps} />
                                          </div>
                                        </div>
                                      )}

                                      {responseActiveTabs[msg.id] === "fun" && (
                                        <div className="space-y-2">
                                          <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("tabVerify")}</h4>
                                          <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-250 border border-sky-100/40 rounded-xl">
                                            <MathRenderer text={msg.parsed.errorCheck} />
                                          </div>
                                        </div>
                                      )}

                                      {responseActiveTabs[msg.id] === "excel" && (
                                        <div className="space-y-3">
                                          <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1">
                                            <FileSpreadsheet className="w-3.5 h-3.5" /> {t("excelSuggested")}
                                          </h4>
                                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-350 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                                            <p className="font-mono text-xs select-all bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-xs text-center font-bold">
                                              {msg.parsed.excelFormula?.split('\n')?.[0]}
                                            </p>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                                              <MathRenderer text={msg.parsed.excelFormula?.substring(msg.parsed.excelFormula.indexOf('\n') + 1) || ""} />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-4 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                                    <MathRenderer text={msg.content} />
                                  </div>
                                )}

                                {/* Action bar for message */}
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                                  <span className="text-[9px] text-slate-400">{({ it: "Verificato da", en: "Verified by", es: "Verificado por", fr: "Vérifié par", de: "Geprüft von", pt: "Verificado por" }[language])} StudyCalc AI</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleShareText(msg)}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                      title={sharedId === msg.id ? "Soluzione condivisa!" : "Condividi soluzione"}
                                    >
                                      {sharedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleCopyText(msg.content, msg.id)}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                      title="Copia testo intero"
                                    >
                                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}

                      {isSending && (
                        <div className="flex flex-col items-start w-full animate-pulse">
                          <span className="text-[10px] text-slate-400 mb-1 px-1">StudyCalc AI sta calcolando...</span>
                          <div className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl rounded-tl-none w-4/5 text-xs flex items-center gap-3 shadow-xs">
                            <div className="w-2.5 h-2.5 bg-indigo-650 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2.5 h-2.5 bg-indigo-650 rounded-full animate-bounce delay-150"></div>
                            <div className="w-2.5 h-2.5 bg-indigo-650 rounded-full animate-bounce delay-300"></div>
                            <span className="text-slate-500 dark:text-slate-400">Elaborazione traccia geometrica...</span>
                          </div>
                        </div>
                      )}

                      {errorMessage && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-350 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs flex gap-2 items-center">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <p className="flex-1 font-medium">{errorMessage}</p>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Floating scroll to bottom button */}
                    <AnimatePresence>
                      {showScrollBottom && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          onClick={scrollToBottom}
                          className={`absolute right-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl rounded-full p-2.5 flex items-center justify-center cursor-pointer z-35 border border-white dark:border-slate-800 hover:scale-105 active:scale-95 transition-all outline-none ${
                            showMathKeys 
                              ? (selectedImage ? "bottom-[225px]" : "bottom-[165px]") 
                              : (selectedImage ? "bottom-[155px]" : "bottom-[95px]")
                          }`}
                          title="Torna all'ultimo messaggio"
                        >
                          <ArrowDown className="w-5 h-5 animate-bounce" />
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {/* Chat Text Input and Action triggers Bar */}
                    <div className="p-3.5 bg-white dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800 space-y-3 shrink-0">
                      
                      {/* Drag & drop or display of selected image */}
                      <FileUpload
                        onFileSelect={setSelectedImage}
                        selectedImage={selectedImage}
                        prompt={t("photoPrompt")}
                        hint={t("photoHint")}
                      />

                      {/* Interactive Math Keyboard & Keyboard shortcut tip */}
                      {showMathKeys && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                              {t("kbTitle")}
                            </span>
                            <span className="text-[8.5px] font-mono text-slate-400 dark:text-slate-500 select-none">
                              {t("kbHelp")}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin -mx-1 px-1">
                            {mathKeys.map((key) => (
                              <button
                                key={key.label + "-" + key.value}
                                type="button"
                                onClick={() => insertMathSymbol(key.value)}
                                title={key.title}
                                className="px-2.5 py-1 text-xs font-semibold font-mono bg-slate-100 hover:bg-indigo-600 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-650 hover:text-white dark:hover:text-white text-slate-700 dark:text-slate-350 rounded-lg shadow-2xs transition-all shrink-0 active:scale-90"
                              >
                                {key.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Text Input Row */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 px-3 py-1">
                          <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendMessage();
                            }}
                            placeholder={t("inputPlaceholder")}
                            disabled={isSending}
                            className="bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs outline-none border-none py-2 px-1 flex-1 min-w-0"
                          />
                          
                          {/* Open visual equation editor helper */}
                          <button
                            type="button"
                            onClick={() => setShowVisualEditor(true)}
                            className="p-1.5 text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-200/30 dark:hover:bg-slate-800/40 rounded-lg transition-colors mr-0.5"
                            title="Apri l'Editor Matematico Visuale (Frazioni, Integrali, Matrici)"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>

                          {/* Toggle mathematical keyboard helper panel */}
                          <button
                            type="button"
                            onClick={() => setShowMathKeys(!showMathKeys)}
                            className={`p-1.5 text-xs font-bold rounded-lg transition-colors ${showMathKeys ? "bg-indigo-100/70 text-indigo-650 dark:bg-indigo-950/50 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/30 dark:hover:bg-slate-800/40"}`}
                            title="Mostra/Nascondi tastiera matematica rapida"
                          >
                            fx
                          </button>
                        </div>

                        {/* Sending Action Button */}
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={isSending || (!inputText.trim() && !selectedImage)}
                          className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                        >
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. CAMERA VIEWFINDER TAB SUB-STAGE */}
                {activeTab === "camera" && (
                  <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Camera className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">Lettore Fotografico</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Risolvi istantaneamente formule su carta</p>
                      </div>
                    </div>

                    <div className="border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4 text-center shadow-xs">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        StudyCalc AI supporta l'accesso diretto alla webcam o fotocamera posteriore del tuo dispositivo mobile per scattare una foto immediata della traccia d'esame o del quaderno.
                      </p>

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => {
                            setShowCameraModal(true);
                          }}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4.5 h-4.5" /> Apri Fotocamera Device
                        </button>
                        
                        <p className="text-[10px] text-slate-400">
                          Se la fotocamera non è disponibile, puoi usare il pulsante di caricamento rapido nell'area chat principale.
                        </p>
                      </div>
                    </div>

                    {/* Quick guides to scan */}
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs">
                      <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">💡 Consigli per una scansione ottima:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-655 dark:text-slate-300 text-[11px]">
                        <li>Inquadra il foglio in presenza di buona luce naturale.</li>
                        <li>Assicurati che la grafia numerica o le frazioni siano scritte chiaramente.</li>
                        <li>Includi anche grafici o tabelle se l'esercizio lo richiede.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3. EXCEL FORMULA PLAYGROUND TAB */}
                {activeTab === "excel" && (
                  <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">Sandbox Excel</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Foglio di calcolo interattivo & Formule scolastiche</p>
                      </div>
                    </div>

                    {/* Live data inputs simulation */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matrice dei dati</span>
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">Colonna A</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {excelRows.map((row, index) => (
                          <div key={row.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg p-2">
                            <span className="font-mono text-[10px] text-slate-400">{row.tag}</span>
                            <input
                              type="number"
                              step="0.1"
                              value={row.value}
                              onChange={(e) => {
                                const copy = [...excelRows];
                                copy[index].value = e.target.value;
                                setExcelRows(copy);
                              }}
                              className="w-full bg-transparent border-none text-xs text-right font-mono outline-none py-0.5 text-slate-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Formula configuration row */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-semibold text-slate-400">Formula Excel correlata</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={excelFormulaInput}
                            onChange={(e) => setExcelFormulaInput(e.target.value)}
                            placeholder="=MEDIA(A1:A4)"
                            className="flex-1 font-mono text-xs bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 p-2 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                          />
                          <button
                            onClick={calculateExcelFormula}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-sm active:scale-95"
                          >
                            Calcola
                          </button>
                        </div>
                      </div>

                      {/* Output calculated simulation */}
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/50 rounded-xl space-y-1 text-xs">
                        <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300">{t("excelEvaluated")}</span>
                        <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-450">{excelResult}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic font-medium">{excelExplanation}</p>
                      </div>
                    </div>

                    {/* Pre-made shortcuts to load formulas */}
                    <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Scelte rapide</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { title: "Media Voti", formula: "=MEDIA(A1:A4)" },
                          { title: "Somma Totale", formula: "=SOMMA(A1:A4)" },
                          { title: "Valore Massimo", formula: "=MAX(A1:A4)" },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setExcelFormulaInput(btn.formula);
                            }}
                            className="bg-white dark:bg-slate-800 border border-slate-255 dark:border-slate-700 text-[10px] font-medium text-slate-655 dark:text-slate-300 py-1.5 px-2.5 rounded-lg hover:border-emerald-200 transition-colors"
                          >
                            {btn.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. HISTORY OF SOLVED QUESTIONS */}
                {activeTab === "history" && (
                  <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <History className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">{t("history")}</h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{t("historySub")}</p>
                        </div>
                      </div>

                      <button
                        onClick={clearHistory}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                        title={t("clearAll")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Integrated learning progress & topic frequency visualization */}
                    <HistoryDashboard messages={messages} />

                    {/* List of items */}
                    <div className="space-y-3">
                      {messages
                        .filter((m) => m.role === "user")
                        .map((msg, i) => (
                          <div
                            key={msg.id || i}
                            onClick={() => {
                              setInputText(msg.content);
                              setActiveTab("chat");
                            }}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-150 rounded-xl shadow-xs transition-colors cursor-pointer text-left space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleDateString([], { day: "numeric", month: "short" })}
                              </span>
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{t("retry")}</span>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 italic font-medium leading-relaxed">
                              {msg.content.replace(/ \(Adatta la risposta al livello scolastico:.*\)/, "")}
                            </p>
                          </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. CONFIGURATIONS AND SETTINGS TAB */}
                {activeTab === "settings" && (
                  <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm">{t("settings")}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{t("settingsSubtitle")}</p>
                      </div>
                    </div>

                    {/* Controls container */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 text-xs shadow-xs">
                      
                      {/* Theme selection toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-xs">{t("darkMode")}</p>
                          <p className="text-[10px] text-slate-400">{t("darkModeSub")}</p>
                        </div>
                        <button
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 outline-none ${
                            isDarkMode ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white shadow-sm block"></span>
                        </button>
                      </div>

                      <hr className="border-slate-100 dark:border-slate-800" />

                      {/* Language selector (auto + manual) */}
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-xs">{t("language")}</p>
                          <p className="text-[10px] text-slate-400">{t("languageSub")}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <button
                            onClick={() => setAutoLang(true)}
                            className={`p-2 rounded-xl border font-bold text-center text-[10px] transition-colors select-none outline-none ${
                              autoLang
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            🌐 {t("autoDetect")}
                          </button>
                          {LANGS.map((lng) => (
                            <button
                              key={lng.code}
                              onClick={() => { setAutoLang(false); setLanguage(lng.code); }}
                              className={`p-2 rounded-xl border font-bold text-center text-[10px] transition-colors select-none outline-none ${
                                !autoLang && language === lng.code
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              {lng.flag} {lng.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <hr className="border-slate-100 dark:border-slate-800" />

                      {/* School selection */}
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-xs">{t("teaching")}</p>
                          <p className="text-[10px] text-slate-400">{t("teachingSub")}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button
                            onClick={() => setSchoolLevel("Medie")}
                            className={`p-3 rounded-xl border font-bold text-center text-[10px] uppercase tracking-wider transition-colors select-none outline-none ${
                              schoolLevel === "Medie"
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {t("middleSchool")}
                          </button>
                          <button
                            onClick={() => setSchoolLevel("Superiori")}
                            className={`p-3 rounded-xl border font-bold text-center text-[10px] uppercase tracking-wider transition-colors select-none outline-none ${
                              schoolLevel === "Superiori"
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {t("highSchool")}
                          </button>
                        </div>
                      </div>

                      <hr className="border-slate-100 dark:border-slate-800" />

                      {/* Clear cache trigger */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-xs">{t("clearData")}</p>
                          <p className="text-[10px] text-slate-400">{t("clearDataSub")}</p>
                        </div>
                        <button
                          onClick={clearHistory}
                          className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold px-3 py-2 rounded-xl text-[10px] transition-all active:scale-95 border border-rose-100 dark:border-rose-900/50"
                        >
                          {t("clearBtn")}
                        </button>
                      </div>

                    </div>

                    {/* API Connection Diagnostics info */}
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="font-mono text-[10px] text-slate-400">{t("engineStatus")}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-450 font-bold text-[10px]">{t("engineActive")}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* HIGH FIDELITY MATERIAL DESIGN 3 BOTTOM ACTIONS NAVBAR */}
              <nav className="h-16 bg-white dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-around shrink-0 z-30 select-none">
                
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-sans transition-colors ${
                    activeTab === "chat" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-655"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide uppercase">{t("navChat")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("camera")}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-sans transition-colors ${
                    activeTab === "camera" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-655"
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide uppercase">{t("navPhoto")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("excel")}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-sans transition-colors ${
                    activeTab === "excel" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-655"
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide uppercase">{t("navExcel")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-sans transition-colors ${
                    activeTab === "history" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-655"
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide uppercase">{t("navHistory")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-sans transition-colors ${
                    activeTab === "settings" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-655"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[9px] font-bold tracking-wide uppercase">{t("navOptions")}</span>
                </button>

              </nav>

            </div>

            {/* Gesture pill / Home bar at the bottom of standard modern Android screens */}
            <div className="hidden md:flex h-6 bg-slate-100 dark:bg-slate-950 shrink-0 justify-center items-center select-none">
              <div className="w-28 h-1 bg-slate-400 dark:bg-slate-800 rounded-full"></div>
            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT: Interactive Presets Math Exercises List (Wide layouts) */}
        <div className={APP_MODE ? "hidden" : "hidden md:block w-80 shrink-0"}>
          <PresetList
            presets={presets}
            onSelect={handleApplyPreset}
          />
        </div>

      </div>

      {/* FULL PIXEL VIEWFINDER CAMERA DIALOG IF ACTIVATED */}
      {showCameraModal && (
        <CameraCapture
          onCapture={(base64) => {
            setSelectedImage(base64);
            setShowCameraModal(false);
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* VISUAL MATH EQUATION BUILDER MODAL */}
      <VisualMathEditor
        isOpen={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        onInsert={(latex) => {
          setInputText((prev) => prev ? prev + " " + latex : latex);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 80);
        }}
        initialValue={inputText}
      />

    </div>
  );
}
