declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    immediate?: boolean;
    [key: string]: any;
  }

  export function registerSW(options?: RegisterSWOptions): (
    reloadPage?: boolean,
  ) => Promise<void>;

  const _default: typeof registerSW;
  export default _default;
}

declare module 'virtual:pwa-register/vue' {
  export { registerSW } from 'virtual:pwa-register';
}
