export interface LogData {
  type: "FETCH" | "XHR" | "WS";
  url: string;
  method?: string;
  time: string;
  status: number | string;
  payload: unknown;
  response: unknown;
}

export interface Theme {
  bg: string;
  border: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  text: string;
  textDim: string;
}

export interface Config {
  MAX_LOGS: number;
  PANEL_WIDTH: string;
  PANEL_HEIGHT: string;
  THEME: Theme;
}

export interface XHRContext {
  method: string;
  url: string;
  time: string;
  payload?: unknown;
}
