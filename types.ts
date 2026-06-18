export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  image?: string | null;  // base64 image data URI
  timestamp: Date;
  parsed?: ParsedSections;
}

export interface Preset {
  id: string;
  title: string;
  level: "Medie" | "Superiori" | "Tutti";
  description: string;
  text: string;
}

export interface ParsedSections {
  raw: string;
  recognized?: string;
  method?: string;
  steps?: string;
  finalResult?: string;
  errorCheck?: string;
  excelFormula?: string;
}
