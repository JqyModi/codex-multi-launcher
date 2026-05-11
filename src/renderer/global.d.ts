import type { CodexApi } from "../shared/types";

declare global {
  interface Window {
    codexProfileManager: CodexApi;
  }
}

export {};
