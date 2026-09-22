declare const __DEV__: boolean;

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_WS_URL?: string;
    APP_ENV?: string;
    NODE_ENV?: string;
    [key: string]: string | undefined;
  }
}

declare const process: NodeJS.Process;

