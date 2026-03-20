import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", check);
    check();
    return () => mql.removeEventListener("change", check);
  }, []);

  return !!isMobile;
}

export type ScreenSize = "mobile" | "tablet" | "desktop";

export function useScreenSize(): ScreenSize {
  const [size, setSize] = React.useState<ScreenSize>("mobile");

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < MOBILE_BREAKPOINT) setSize("mobile");
      else if (w < DESKTOP_BREAKPOINT) setSize("tablet");
      else setSize("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return size;
}
