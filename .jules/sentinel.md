# Sentinel's Journal: Critical Security Learnings

## 2025-03-05 - Secure LocalStorage Parsing and Content Security Policy in Standalone PWA Game
**Vulnerability:** Potential application state corruption, Denial of Service (UI crashes), or unexpected behavior if LocalStorage keys (settings, highscores, talents) contain unvalidated types or out-of-bounds numeric values. Additionally, lack of HTTP security headers in the static hosting configuration leaves users exposed to Clickjacking and MIME sniffing.
**Learning:** LocalStorage data is shared on the client-side origin and can be manipulated by malicious scripts, browser extensions, physical access, or local storage corruption. Simply using `JSON.parse` or destructuring values into active React state can crash components or bypass logic.
**Prevention:** Always implement structural type checks, boundary clamps, and text sanitization (escaping characters like `<` and `>`) when loading stored values from LocalStorage. Enforce strict HTTP headers (CSP, X-Frame-Options, X-Content-Type-Options) directly in the hosting configuration file (`vercel.json`).
