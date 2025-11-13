declare module 'react-dom/client' {
  import type { Root } from 'react-dom';

  export const createRoot: (container: Element | DocumentFragment, options?: { hydrate?: boolean }) => Root;
  export const hydrateRoot: typeof createRoot;
}
