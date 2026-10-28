// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

const fontFiles = './node_modules/@fontsource-variable';

export default defineConfig({
  // Replace with the production domain before launch.
  site: 'https://britandsold.example',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-display',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: [`${fontFiles}/newsreader/files/newsreader-latin-wght-normal.woff2`],
            weight: '200 800',
            style: 'normal',
          },
          {
            src: [`${fontFiles}/newsreader/files/newsreader-latin-wght-italic.woff2`],
            weight: '200 800',
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--font-body',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: [`${fontFiles}/instrument-sans/files/instrument-sans-latin-wght-normal.woff2`],
            weight: '400 700',
            style: 'normal',
          },
        ],
      },
    },
  ],
});
