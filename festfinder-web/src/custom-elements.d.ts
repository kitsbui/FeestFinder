import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Elements of our own in the markup.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      /** The page wrapper in app/layout.tsx. */
      'ff-app': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
