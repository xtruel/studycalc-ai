import { useState } from "react";
import { Preset } from "../types";
import { BookOpen, Sparkles } from "lucide-react";

interface PresetListProps {
  presets: Preset[];
  onSelect: (presetText: string) => void;
}

export default function PresetList({ presets, onSelect }: PresetListProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Medie" | "Superiori" | "Tutti">("All");

  const filteredPresets = presets.filter((preset) => {
    if (activeTab === "All") return true;
    return preset.level === activeTab;
  });

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="font-display font-semibold text-slate-800 text-base">Esercizi di prova</h3>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Seleziona uno dei nostri scenari pronti per testare istantaneamente l'assistente StudyCalc AI.
      </p>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 overflow-x-auto">
        {(["All", "Medie", "Superiori", "Tutti"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-850 hover:bg-white/50"
            }`}
          >
            {tab === "All"
              ? "Tutti"
              : tab === "Medie"
              ? "Scuola Media"
              : tab === "Superiori"
              ? "Scuola Superiore"
              : "Excel / Fogli"}
          </button>
        ))}
      </div>

      {/* Preset Cards */}
      <div className="space-y-3">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.text)}
            className="w-full text-left p-3.5 border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 rounded-xl transition-all duration-200 group relative flex flex-col gap-1.5 outline-none hover:shadow-xs"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-display font-semibold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">
                {preset.title}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  preset.level === "Medie"
                    ? "bg-sky-50 text-sky-600"
                    : preset.level === "Superiori"
                    ? "bg-pink-50 text-pink-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {preset.level === "Medie" ? "MEDIE" : preset.level === "Superiori" ? "SUPERIORI" : "EXCEL"}
              </span>
            </div>
            <p className="text-slate-500 text-xs line-clamp-2">
              {preset.description}
            </p>
            <div className="bg-slate-100 text-slate-600 font-mono text-[10px] py-1 px-2.5 rounded-md truncate group-hover:bg-indigo-50/50 group-hover:text-indigo-600 transition-colors mt-1">
              {preset.text}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
