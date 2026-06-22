import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Rete di sicurezza globale: se un qualunque errore di rendering esplode (es. testo
 * "sporco" riconosciuto dall'OCR, formula matematica malformata, ecc.), invece di
 * lasciare la PAGINA BIANCA mostriamo un messaggio gentile con un pulsante per
 * riprovare. Così l'app non "muore" mai davanti all'utente.
 */
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: (error as Error)?.message || "Si è verificato un errore imprevisto.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Solo log locale (nessun dato inviato in rete).
    console.error("ErrorBoundary:", error, info?.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>🧮</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
          Qualcosa è andato storto
        </h1>
        <p style={{ maxWidth: 360, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
          Non preoccuparti, i tuoi dati sono al sicuro. Tocca il pulsante per
          riprendere da dove eri.
        </p>
        <button
          onClick={this.handleReset}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Riprova
        </button>
      </div>
    );
  }
}
