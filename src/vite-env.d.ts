/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface GoogleMapsWindow {
    maps?: {
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: Record<string, unknown>
        ) => {
          addListener: (eventName: string, handler: () => void) => void;
          getPlace: () => {
            address_components?: Array<{ long_name: string; types: string[] }>;
            formatted_address?: string;
            name?: string;
          };
        };
      };
    };
  }

  interface Window {
    google?: GoogleMapsWindow;
  }
}

export {};
