declare module 'react';
declare module 'react/jsx-runtime';
declare module 'react-dom';
declare module 'react-dom/client';

declare module '*.svg' {
    const content: string;
    export default content;
}
