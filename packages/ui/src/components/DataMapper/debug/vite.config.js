// // @ts-check
// import react from '@vitejs/plugin-react';
// import { defineConfig } from 'vite';

// // https://vitejs.dev/config/

// export default defineConfig(async () => {
//   return {
//     plugins: [react()],
//     base: './',
//     css: {
//       preprocessorOptions: {
//         scss: {
//           api: 'modern-compiler',
//         },
//       },
//     },
//     resolve: {
//       alias: [
//         {
//           find: /^~.+/,
//           replacement: (val) => {
//             return val.replace(/^~/, '');
//           },
//         },
//       ],
//     },
//   };
// });
// vite.config.js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react()],
    base: '/Designer/',
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    resolve: {
      alias: [
        {
          find: /^~.+/,
          replacement: (val) => val.replace(/^~/, ''),
        },
      ],
    },
  };
});
