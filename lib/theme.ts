export type Theme = "light" | "dark";

const storageKey = "theme";

// Runs in <head> before first paint so a returning visitor's dark choice
// does not flash light. Storage can throw in private modes, so it is guarded.
export const themeScript = `try{if(localStorage.getItem("${storageKey}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // The choice still applies for this visit.
  }
}

/** Calls `onChange` whenever the theme attribute changes. */
export function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
