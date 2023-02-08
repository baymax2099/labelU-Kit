import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { viteMockServe } from 'vite-plugin-mock';
import tsMonoAlias from 'vite-plugin-ts-mono-alias';
import vitePluginImp from 'vite-plugin-imp';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  publicDir: resolve(__dirname, 'public'),
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  plugins: [
    react(),
    // viteMockServe({
    //   mockPath: 'mock',
    //   localEnabled: true,
    // }),

    tsMonoAlias({
      ignorePackages: ['web-demo', 'server'],
    }),
    vitePluginImp({
      libList: [
        {
          libName: 'antd',
          style: (name) => `antd/es/${name}/style/index.js`,
        },
      ],
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
      components: resolve(__dirname, 'src/components/'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true, //注意，这一句是在less对象中，写在外边不起作用
        modifyVars: {
          //在这里进行主题的修改，参考官方配置属性
          // '@primary-color': '#1DA57A'
        },
      },
    },
  },
  build: {
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
});
