import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  HelpCircle, 
  CornerDownLeft, 
  Sparkles, 
  Trash2, 
  Bookmark, 
  Keyboard, 
  Calculator, 
  Layers,
  Undo2,
  Copy,
  Check
} from "lucide-react";
import katex from "katex";

interface VisualMathEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  initialValue?: string;
}

// Categories definitions
const CATEGORIES = [
  { id: "base", label: "Elementari", icon: Calculator },
  { id: "calcolo", label: "Analisi (Calcolo)", icon: Layers },
  { id: "trigo", label: "Trigonometria", icon: HelpCircle },
  { id: "simboli", label: "Simboli & Logica", icon: Bookmark },
  { id: "complessi", label: "Matrici & Sistemi", icon: Keyboard },
];

interface MathToken {
  label: string;
  latex: string;
  description: string;
  example?: string;
}

const ELEMENTARI_TOKENS: MathToken[] = [
  { label: "Frazione", latex: "\\frac{a}{b}", description: "Frazione orizzontale", example: "\\frac{x+1}{2}" },
  { label: "Quoziente", latex: "a / b", description: "Frazione in linea", example: "x/4" },
  { label: "Esponente", latex: "x^{y}", description: "Esponente e potenza", example: "x^{2}" },
  { label: "Pedice", latex: "x_{i}", description: "Pedice/Indice", example: "x_{0}" },
  { label: "Radice Q.", latex: "\\sqrt{x}", description: "Radice quadrata", example: "\\sqrt{25}" },
  { label: "Radice N.", latex: "\\sqrt[n]{x}", description: "Radice ennesima", example: "\\sqrt[3]{8}" },
  { label: "Parentesi Quadre", latex: "\\left[ x \\right]", description: "Parentesi adattive", example: "\\left[ x+2 \\right]" },
  { label: "Graffe", latex: "\\left\\{ x \\right\\}", description: "Graffe matematiche", example: "\\left\\{ 1, 2, 3 \\right\\}" },
];

const CALCOLO_TOKENS: MathToken[] = [
  { label: "Integrale Definito", latex: "\\int_{a}^{b} x \\, dx", description: "Integrale definito con estremi", example: "\\int_{0}^{1} x^2 \\, dx" },
  { label: "Integrale Indefinito", latex: "\\int x \\, dx", description: "Integrale indefinito classico", example: "\\int \\sin(x) \\, dx" },
  { label: "Limite", latex: "\\lim_{x \\to x_0}", description: "Operazione di limite", example: "\\lim_{x \\to 0} \\frac{\\sin(x)}{x}" },
  { label: "Derivata", latex: "\\frac{d}{dx}", description: "Differenziale classico", example: "\\frac{d}{dx} (e^x)" },
  { label: "Derivata Parziale", latex: "\\frac{\\partial}{\\partial x}", description: "Gradiente parziale", example: "\\frac{\\partial f}{\\partial x}" },
  { label: "Sommatoria", latex: "\\sum_{i=1}^{n}", description: "Somma per cicli", example: "\\sum_{i=1}^{n} i^2" },
  { label: "Infinito", latex: "\\infty", description: "Simbolo di infinito", example: "\\infty" },
  { label: "Produttoria", latex: "\\prod_{i=1}^{n}", description: "Prodotto per serie", example: "\\prod_{i=1}^{n} a_i" },
  { label: "Delta", latex: "\\Delta", description: "Variazione o determinante", example: "\\Delta = b^2 - 4ac" },
];

const TRIGO_TOKENS: MathToken[] = [
  { label: "Seno", latex: "\\sin(x)", description: "Funzione seno", example: "\\sin(\\pi)" },
  { label: "Coseno", latex: "\\cos(x)", description: "Funzione coseno", example: "\\cos(2x)" },
  { label: "Tangente", latex: "\\tan(x)", description: "Funzione tangente", example: "\\tan(\\theta)" },
  { label: "Arcoseno", latex: "\\arcsin(x)", description: "Inversa del seno" },
  { label: "Arcocoseno", latex: "\\arccos(x)", description: "Inversa del coseno" },
  { label: "Pi Greco", latex: "\\pi", description: "Costante Pi Greco", example: "2\\pi" },
  { label: "Theta", latex: "\\theta", description: "Lettera greca Theta (angolo)", example: "\\theta" },
  { label: "Alfa", latex: "\\alpha", description: "Lettera greca Alfa" },
  { label: "Beta", latex: "\\beta", description: "Lettera greca Beta" },
];

const SIMBOLI_TOKENS: MathToken[] = [
  { label: "Uguale", latex: "=", description: "Uguaglianza standard" },
  { label: "Diverso", latex: "\\neq", description: "Non uguale", example: "x \\neq 0" },
  { label: "Minore o Uguale", latex: "\\le", description: "Disuguaglianza minore o uguale", example: "x \\le 5" },
  { label: "Maggiore o Uguale", latex: "\\ge", description: "Disuguaglianza maggiore o uguale", example: "x \\ge -1" },
  { label: "Circa Uguale", latex: "\\approx", description: "Uguaglianza approssimata", example: "\\pi \\approx 3.14" },
  { label: "Più o Meno", latex: "\\pm", description: "Segno algebrico doppio", example: "\\pm \\sqrt{\\Delta}" },
  { label: "Insieme Vuoto", latex: "\\emptyset", description: "Nessuna soluzione", example: "x \\in \\emptyset" },
  { label: "Appartiene", latex: "\\in", description: "Appartenenza insiemistica", example: "x \\in \\mathbb{R}" },
  { label: "Implica", latex: "\\implies", description: "Conseguenza logica", example: "x=2 \\implies x^2=4" },
  { label: "Freccia Destra", latex: "\\to", description: "Tende a o direzione", example: "x \\to \\infty" },
];

const COMPLESSI_TOKENS: MathToken[] = [
  { label: "Sistema 2 Eq.", latex: "\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}", description: "Sistema di equazioni a due variabili" },
  { label: "Sistema 3 Eq.", latex: "\\begin{cases} x + y + z = 1 \\\\ y - z = 2 \\\\ 2x + z = 0 \\end{cases}", description: "Sistema lineare a tre variabili" },
  { label: "Matrice 2x2", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", description: "Matrice bidimensionale standard" },
  { label: "Vettore Colonna", latex: "\\begin{pmatrix} x_1 \\\\ x_2 \\end{pmatrix}", description: "Vettore multidimensionale generico" },
  { label: "Determinante det", latex: "\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", description: "Determinante di matrice" },
  { label: "Limite Notevole Trigo", latex: "\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1", description: "Formula notevole classica" },
];

// Presets lists
const SAMPLE_PRESETS = [
  { name: "Equazione di 2° grado", text: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { name: "Funzione integrale", text: "F(x) = \\int_{a}^{x} f(t) \\, dt" },
  { name: "Derivata rapporto", text: "\\frac{d}{dx} \\left( \\frac{f(x)}{g(x)} \\right) = \\frac{f'(x)g(x) - f(x)g'(x)}{(g(x))^2}" },
  { name: "Sviluppo binomiale", text: "(a+b)^2 = a^2 + 2ab + b^2" },
];

export default function VisualMathEditor({ isOpen, onClose, onInsert, initialValue = "" }: VisualMathEditorProps) {
  const [latexInput, setLatexInput] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<string>("base");
  const [copied, setCopied] = useState<boolean>(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [compileError, setCompileError] = useState<string | null>(null);

  // Synchronize initial input on mount or opening
  useEffect(() => {
    if (isOpen) {
      setLatexInput(initialValue);
    }
  }, [isOpen, initialValue]);

  // Real-time KaTeX Compilation
  useEffect(() => {
    if (!latexInput.trim()) {
      setPreviewHtml("<span class='text-slate-400 font-sans text-xs italic dark:text-slate-600'>Inizia a cliccare sui tasti o scrivi in LaTeX per vedere la formula renderizzata...</span>");
      setCompileError(null);
      return;
    }

    try {
      // compile math syntax inline displayMode style
      const html = katex.renderToString(latexInput, {
        displayMode: true,
        throwOnError: true,
      });
      setPreviewHtml(html);
      setCompileError(null);
    } catch (err: any) {
      setCompileError(err.message || "Errore di sintassi LaTeX");
      // Gentle fallback preview without throwing 
      try {
        const fallbackHtml = katex.renderToString(latexInput, {
          displayMode: true,
          throwOnError: false,
        });
        setPreviewHtml(fallbackHtml);
      } catch (f) {}
    }
  }, [latexInput]);

  // Insert a fragment precisely at the text cursor position inside the textarea
  const insertAtCursor = (frag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLatexInput((prev) => prev + frag);
      return;
    }

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const scrollPos = textarea.scrollTop;
    
    const beforeText = latexInput.substring(0, startPos);
    const afterText = latexInput.substring(endPos, latexInput.length);
    
    const newValue = beforeText + frag + afterText;
    setLatexInput(newValue);
    
    // Put cursor right after the newly inserted fragment or inside its brackets
    const nextCursorPos = startPos + frag.length;
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPos, nextCursorPos);
      textarea.scrollTop = scrollPos;
    }, 25);
  };

  // Process preset selection
  const handleApplyPreset = (text: string) => {
    setLatexInput(text);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(latexInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearEditor = () => {
    setLatexInput("");
    textareaRef.current?.focus();
  };

  const handleAddBackslash = () => {
    insertAtCursor("\\");
  };

  const handleConfirmToken = () => {
    // Return expression wrapped inside standard $ inline or $$ block based on length/style
    // If it contains a newline or complex constructs, we'll suggest inline or block.
    // Let's provide it directly or let user's chat bubble wrapper handle $ or $$ representation.
    // We will wrap the formula inside $ to keep it inline and smooth, or the user can send as-is.
    // To play nice with KaTeX inline renderer, wrap with single $ if not already wrapped
    let cleanVal = latexInput.trim();
    if (!cleanVal.startsWith("$") && !cleanVal.endsWith("$")) {
      cleanVal = `$${cleanVal}$`;
    }
    onInsert(cleanVal);
    onClose();
  };

  // Grouped active category items getter
  const getActiveTokens = (): MathToken[] => {
    switch (activeSubTab) {
      case "base": return ELEMENTARI_TOKENS;
      case "calcolo": return CALCOLO_TOKENS;
      case "trigo": return TRIGO_TOKENS;
      case "simboli": return SIMBOLI_TOKENS;
      case "complessi": return COMPLESSI_TOKENS;
      default: return ELEMENTARI_TOKENS;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
          {/* Backdrop Click Dismiss */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden z-10"
          >
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-205 dark:border-slate-800/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    Editor Matematico Visuale
                    <span className="text-[9px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-1.5 py-0.5 rounded">LaTeX</span>
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500">Costruttore guidato di formule geometriche, matrici ed equazioni</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Chiudi"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Inner Workspace */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5 scrollbar-thin">
              
              {/* Preset Quick Loader Buttons */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wide">Esempi di Formule Notabili</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset.text)}
                      className="text-[9.5px] px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850 hover:border-indigo-600 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900 font-medium text-slate-600 dark:text-slate-400 transition-all text-left flex items-center gap-1 active:scale-95"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* KaTeX Live Beautiful Render Canvas */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wide">Anteprima Live Calcolatrice</span>
                <div className="relative min-h-[75px] bg-indigo-50/15 dark:bg-slate-900/40 border border-indigo-100/30 dark:border-slate-850 rounded-xl p-3.5 flex items-center justify-center text-center overflow-x-auto select-text scrollbar-thin">
                  <div 
                    className="math-display text-slate-800 dark:text-slate-100 text-sm py-1.5"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  {compileError && (
                    <div className="absolute top-1.5 right-1.5 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 text-right max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis px-1.5 rounded" title={compileError}>
                      ✎ Attesa sintassi...
                    </div>
                  )}
                </div>
              </div>

              {/* Formula Text Area Editor input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wide">Codice LaTeX (Modifica a mano)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddBackslash}
                      className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-150 dark:bg-slate-850 text-slate-700 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-650 transition-colors"
                      title="Inserisci carattere BACKSLASH"
                    >
                      \
                    </button>
                    <button
                      type="button"
                      onClick={clearEditor}
                      className="text-[9.5px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-450 flex items-center gap-1"
                      title="Pulisci l'intero editor"
                    >
                      <Trash2 className="w-3 h-3" />
                      Pulisci
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={latexInput}
                    onChange={(e) => setLatexInput(e.target.value)}
                    placeholder="Esempio: \frac{x}{y} + \sin(x) = \lim_{t \to a} f(t)"
                    rows={2.5}
                    className="w-full text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 text-xs font-mono bg-slate-50/50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 dark:focus:border-indigo-650 shadow-inner resize-none select-text"
                  />
                  <div className="absolute bottom-2.5 right-2.5 text-[8px] font-mono text-slate-400 select-none">
                    {latexInput.length} car.
                  </div>
                </div>
              </div>

              {/* Categorized Symbols visual Keyboard Builder */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-455 dark:text-slate-550 uppercase tracking-wide">Categorie per Selezione Rapida</span>
                
                {/* Horizontal Category Tab selectors */}
                <div className="flex items-center gap-1 pb-1 border-b border-slate-100 dark:border-slate-850 overflow-x-auto scrollbar-none -mx-1 px-1">
                  {CATEGORIES.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all ${
                          isActive 
                            ? "bg-indigo-600 text-white shadow-xs" 
                            : "bg-slate-50/50 dark:bg-slate-900 text-slate-655 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-850"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory interactive tiles list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {getActiveTokens().map((token) => (
                    <button
                      key={token.label + "-" + token.latex}
                      type="button"
                      onClick={() => insertAtCursor(token.latex)}
                      className="p-2 border border-slate-150/40 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/40 hover:bg-indigo-600/5 dark:hover:bg-indigo-950/10 hover:border-indigo-500 rounded-xl text-left flex flex-col justify-between transition-all group select-none active:scale-97 cursor-pointer"
                      title={`Clicca per inserire ${token.description}`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {token.label}
                        </span>
                        <span className="text-[7.5px] font-medium text-slate-400 dark:text-slate-550 select-none px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800">+</span>
                      </div>
                      <span className="text-[8.5px] font-mono text-slate-450 dark:text-slate-500 mt-1 block truncate">
                        {token.latex}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer Bar with confirmation */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-205 dark:border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyText}
                  disabled={!latexInput.trim()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Copia codice LaTeX appunti"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copia LaTeX
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleConfirmToken}
                  disabled={!latexInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-805 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  Conferma Formula
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
