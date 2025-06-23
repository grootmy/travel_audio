/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module "*.svg" {
  const content: string;
  export default content;
}

// React 19 compatibility - remove conflicting definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  interface FC<P = {}> {
    (props: P, context?: any): any;
  }
} 