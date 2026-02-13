/**
 * Detect whether the app is running inside a Capacitor native shell.
 * Works by checking the global Capacitor object injected by the runtime.
 */
export function isNativeApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
  );
}
