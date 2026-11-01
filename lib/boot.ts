// Runs in <head> before first paint. Marks that JavaScript is running, so the
// opening animation can hide what it is about to type without visitors who
// have JavaScript off ever losing that content.
export const jsFlagScript = `document.documentElement.dataset.js=""`;
