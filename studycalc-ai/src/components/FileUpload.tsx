import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, FileImage, ImagePlus } from "lucide-react";
import { downscaleImage } from "../lib/image";

interface FileUploadProps {
  onFileSelect: (base64Image: string | null) => void;
  selectedImage: string | null;
  prompt?: string;
  hint?: string;
}

export default function FileUpload({ onFileSelect, selectedImage, prompt, hint }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Si prega di selezionare o trascinare esclusivamente file immagine (PNG, JPEG, GIF, ecc.)!");
      return;
    }

    // Ridimensioniamo/ricomprimiamo prima di tenerla in memoria: foto da 12 MP
    // a piena risoluzione possono saturare la memoria del webview su iPhone vecchi
    // (pagina bianca). La qualità resta ottima per l'OCR.
    try {
      const optimized = await downscaleImage(file);
      onFileSelect(optimized);
    } catch (err) {
      console.error("Ottimizzazione immagine fallita:", err);
      alert("Non sono riuscito a leggere questa immagine. Prova con un'altra foto.");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!selectedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerSelectFile}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 outline-none flex flex-col items-center justify-center gap-1.5 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/40 text-indigo-600 scale-[0.99] font-medium"
              : "border-slate-200 hover:border-slate-300 text-slate-500 hover:bg-slate-50/30"
          }`}
        >
          <div className={`p-2 bg-slate-100 rounded-lg group h-10 w-10 flex items-center justify-center ${isDragging ? "bg-indigo-100/55" : ""}`}>
            <ImagePlus className={`w-5 h-5 ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
          </div>
          <div>
            <span className="font-display font-medium text-slate-705 text-xs">
              {prompt ?? "Esercizi su carta? Carica immagine"}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {hint ?? "Clicca per esplorare o trascina il file qui (PNG, JPEG)"}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative border border-indigo-100 bg-indigo-50/20 p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white">
              <img
                src={selectedImage}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <span className="font-display font-medium text-indigo-900 text-xs flex items-center gap-1">
                <FileImage className="w-3.5 h-3.5" /> Esercizio pronto
              </span>
              <p className="text-[10px] text-slate-500 truncate">
                L'immagine verrà inviata per la risoluzione intelligente
              </p>
            </div>
          </div>
          <button
            onClick={removeImage}
            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors shrink-0"
            title="Rimuovi immagine"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}
    </div>
  );
}
