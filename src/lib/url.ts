// Site-relative links must include the deploy base path (e.g. "/brit-and-sold" on GitHub Pages).
// Locally the base is "/", so paths are unchanged.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path: string) => (path.startsWith('/') ? `${base}${path}` : path);
