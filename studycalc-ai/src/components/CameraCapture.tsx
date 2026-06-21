import { useState, useRef, useEffect } from "react";
import { Camera, CameraOff, Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load available camera devices
  useEffect(() => {
    async function getCameras() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devs.filter((device) => device.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          // Default to environment/back camera if found, otherwise first camera
          const envDevice = videoDevices.find((d) => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("posteriore") ||
            d.label.toLowerCase().includes("environment")
          );
          setSelectedDeviceId(envDevice ? envDevice.deviceId : videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not enumerate media devices:", err);
      }
    }
    getCameras();
  }, []);

  // Initialize selected camera
  useEffect(() => {
    if (!selectedDeviceId) return;
    
    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      setIsInitializing(true);
      setError(null);
      // Stop old stream first
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        // Fallback without deviceId filter
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
          });
          setStream(activeStream);
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
          }
        } catch (fallbackErr: any) {
          setError(
            "Impossibile accedere alla fotocamera. Verifica i permessi del browser o se un'altra applicazione la sta utilizzando."
          );
        }
      } finally {
        setIsInitializing(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Set canvas size to match the video feed resolution
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw the current video frame onto the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 jpeg
      const base64Data = canvas.toDataURL("image/jpeg", 0.9);
      onCapture(base64Data);
    }
  };

  const switchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-display font-semibold">Fotocamera StudyCalc</h3>
              <p className="text-xs text-slate-400">Inquadra l'esercizio di matematica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <CameraOff className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Stage */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm">Inizializzazione fotocamera...</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <p className="text-slate-300 text-sm max-w-xs">{error}</p>
              <button
                onClick={() => setSelectedDeviceId(selectedDeviceId)}
                className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Riprova
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-1"
              />
              {/* Target guidelines visual aid */}
              <div className="absolute inset-6 border-2 border-indigo-500/40 rounded-xl pointer-events-none flex flex-col items-center justify-between p-4">
                <div className="w-full flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl"></div>
                  <div className="w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr"></div>
                </div>
                <div className="bg-indigo-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-indigo-200 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Allinea l'esercizio qui
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl"></div>
                  <div className="w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Actions bar */}
        <div className="p-5 bg-slate-950 flex items-center justify-between gap-4">
          {devices.length > 1 ? (
            <button
              onClick={switchCamera}
              className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 font-medium px-4 py-2.5 rounded-xl transition-colors border border-slate-755"
              title="Inverti Fotocamera"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Inverti</span>
            </button>
          ) : (
            <div className="w-20" />
          )}

          <button
            onClick={capturePhoto}
            disabled={!!error || isInitializing}
            className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all outline-none border-4 border-slate-900 ring-2 ring-indigo-400"
            title="Scatta Foto"
          >
            <Camera className="w-8 h-8" />
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
