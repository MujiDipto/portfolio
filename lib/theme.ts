export type Theme = "light" | "dark";

const storageKey = "theme";

// Ayu dark is the default; Ayu Light is set with data-theme="light". Runs in
// <head> before first paint so a returning visitor's light choice does not
// flash dark. Storage can throw in private modes, so it is guarded.
export const themeScript = `try{if(localStorage.getItem("${storageKey}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export function setTheme(theme: Theme) {
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // The choice still applies for this visit.
  }
}

/** The theme showing now (browser only). */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
